"use strict";
/**
 * HTTP REST server + MongoDB(Mongoose) + Express
 *
 * Endpoints            Attributes              Method          Description
 *
 *  /                       -                   GET             Returns the version and a list of available endpoints
 *  /login                  -                   GET             Login an existing user, returning a JWT
 *
 *  /users                  -                   POST            Signin a new user
 *  /users                  -                   PUT             Update user information
 *  /users/:username        -                   DELETE          Deletion of standard players from moderators
 *  /users/:username        -                   GET             Return a user that has username specified
 *
 *  /users/mod              -                   POST            Create a new moderator, only moderator can do it
 *
 *  /game                   -                   POST            Create a random or friendly match. Furthermore a user can enter in a game as observator
 *  /game                   -                   DELETE          Used by a player in order to delete a started game or to delete a game request
 *
 *  /gameMessage            -                   POST            Send a message in the game chat
 *
 *  /notification           -                   POST            Create a new friend request
 *  /notification           -                   GET             Return all the notification of the specified user. This endpoint returns all the notification that are received and that are not read
 *  /notification           *                   PUT             Change the status of the notification, so the indicated notification will appear as read
 *
 *  /message                -                   GET             Returns all messages and all messages inpending
 *  /message                -                   POST						Send a private message to a specific user
 *	/message								-										PUT							Update a specific message and marks it as read
 *
 *  /friend                 -                   GET             Return the friendlist of the current logged user
 *  /friend                 -                   DELETE          Deletion of a friends in the friendlist of the current logged user
 *  /friend                 -                   PUT             Change the attribute isBlocked of the specified user in the friendlist
 *
 * To install the required modules:
 * $ npm install
 *
 * To compile:
 * $ npm run compile
 *
 * To run:
 * $ npm run start
*/
Object.defineProperty(exports, "__esModule", { value: true });
// TODO modifica commento sopra
const result = require('dotenv').config();
if (result.error) {
    console.log("Unable to load '.env' file. Please provide one to store the JWT secret key");
    process.exit(-1);
}
if (!process.env.JWT_SECRET) {
    console.log("'.env' file loaded but JWT_SECRET=<secret> key-value pair was not found");
    process.exit(-1);
}
const http = require("http"); // HTTP module
//import https = require('https'); // HTTPS module
const colors = require("colors"); // Module to color output string
colors.enabled = true;
const mongoose = require("mongoose");
const express = require("express");
const bodyparser = require("body-parser"); // Used to parse the request body and directly an object that contains "Content-type"
const passport = require("passport"); // Authentication middleware for Express
const passportHTTP = require("passport-http"); // Implements Basic and Digest authentication for HTTP
const jsonwebtoken = require("jsonwebtoken"); // JWT generation
const jwt = require("express-jwt"); // JWT parsing middleware for express
const cors = require("cors"); // Enable CORS middleware
// import io = require('socket.io');                 // Socket.io websocket library
const { Server } = require("socket.io");
// let server = http.createServer(app);
// const option = {
//   allowEIO3: true
// }
let ios = null;
const user = require("./User");
const statistics = require("./Statistics");
const notification = require("./Notification");
const match = require("./Match");
const message = require("./Message");
//var ios = undefined;
var app = express();
// This dictionary contains the client that are conncted with the Socket.io server
// Only the logged in users can connect with the server (this will be implemented with the frontend)
var socketIOclients = {};
// This dictionary contains the match rooms: when an user creates a game requests in order to play a game
// he creates a room, named with his username (since the username is unique, cannot exists rooms with the same key)
// A match room contains the two player and all the users that want to watch the match.
var matchRooms = {};
// This dictionary contains all the users that are watching a game. It is used for managing the chat of a game.
var matchWatcherRooms = {};
/*
  We create the JWT authentication middleware
  provided by the express-jwt library

  How it works (from the official documentation):
  If the token is valid, req.user will be set with the JSON object
  decoded to be used by later middleware for authentication and access control.
*/
var auth = jwt({ secret: process.env.JWT_SECRET, algorithms: ['HS256'] });
app.use(cors());
/*
  Install the top-level middleware "bodyparser"
  body-parser extracts the entire body portion of an incoming request stream
  and expises it on req.body
*/
app.use(bodyparser.json());
app.use((req, res, next) => {
    console.log("--------------------------------".inverse);
    console.log("New request for: " + req.url);
    console.log("Method:" + req.method);
    next();
});
/*
  Configure HTTP basic authentication strategy
  through passport middleware.
*/
passport.use(new passportHTTP.BasicStrategy(function (username, password, done) {
    // Delegate function we provide to passport middleware to verify user credentials
    console.log("New login attempt from ".green + username);
    user.getModel().findOne({ username: username }, (err, user) => {
        if (err) {
            return done({ statusCode: 500, error: true, errormessage: err });
        }
        if (!user) {
            return done(null, false, { statusCode: 500, error: true, errormessage: "Invalid user" });
        }
        if (user.validatePassword(password)) {
            return done(null, user);
        }
        return done(null, false, { statusCode: 500, error: true, errormessage: "Invalid password" });
    });
}));
//TODO add console.log
//* Add API routes to express application
app.get("/", (req, res) => {
    res.status(200).json({ api_version: "1.0", endpoints: ["/", "/login", "/users", "/matchmaking", "/game", "/notification", "/friend", "/whoami"] }); //TODO setta gli endpoints
});
function getToken(username, id, avatarImgURL, roles, mail, state) {
    return {
        username: username,
        id: id,
        roles: roles
    };
}
function signToken(tokendata) {
    // return jsonwebtoken.sign(tokendata, process.env.JWT_SECRET, {expiresIn: '360s'})
    return jsonwebtoken.sign(tokendata, process.env.JWT_SECRET, { expiresIn: '1h' });
}
// Login endpoint uses passport middleware to check
// user credentials before generating a new JWT
app.get("/login", passport.authenticate('basic', { session: false }), (req, res, next) => {
    // If we reach this point, the user is successfully authenticated and
    // has been injected into req.user
    // We now generate a JWT with the useful user data
    // and return it as response
    //TODO: add useful info to JWT
    const tokendata = getToken(req.user.username, req.user.id, req.user.avatarImgURL, req.user.roles, req.user.mail, req.user.state);
    console.log("Login granted. Generating token");
    var token_signed = signToken(tokendata);
    return res.status(200).json({ error: false, errormessage: "", token: token_signed });
});
// Create new user
app.post('/users', (req, res, next) => {
    const basicStats = new (statistics.getModel())({
        nGamesWon: 0,
        nGamesLost: 0,
        nGamesPlayed: 0,
        nTotalMoves: 0,
        ranking: 0
    });
    console.log("Request Body".blue);
    console.log(req.body);
    if (!req.body.password || !req.body.username || !req.body.name || !req.body.surname || !req.body.mail || !req.body.avatarImgURL) {
        return next({ statusCode: 404, error: true, errormessage: "Some field missing, signin cannot be possibile" });
    }
    const doc = createNewUser(basicStats, req.body);
    doc.setUser();
    doc.save().then((data) => {
        console.log("New creation of user, email is ".green + data.mail);
        return res.status(200).json({ error: false, errormessage: "", id: data._id });
    }).catch((reason) => {
        if (reason.code === 11000)
            return next({ statusCode: 404, error: true, errormessage: "User already exists" });
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
    });
});
// Get user by username
app.get('/users/:username', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        return res.status(200).json({ username: u.username, name: u.name, surname: u.surname, avatarImgURL: u.avatarImgURL, mail: u.mail, statistics: u.statistics, friendList: u.friendList, role: u.roles });
    }).catch((reason) => {
        return res.status(401).json({ error: true, errormessage: `DB error ${reason}` });
    });
});
app.get('/users', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username, deleted: false }).then((u) => {
        if (u.hasModeratorRole()) {
            user.getModel().find({ deleted: false }, "username name surname roles").then((list) => {
                return res.status(200).json({ error: false, errormessage: "", userlist: list });
            }).catch((reason) => {
                return res.status(401).json({ error: true, errormessage: "DB error " + reason });
            });
        }
        else {
            return res.status(401).json({ error: true, errormessage: "You cannot get user list" });
        }
    }).catch((reason) => {
        return res.status(401).json({ error: true, errormessage: "DB error " + reason });
    });
});
// Create a new moderator, only mod can do it
app.post("/users/mod", auth, (req, res, next) => {
    // Check if user who request is a moderator
    user.getModel().findOne({ username: req.user.username, deleted: false }).then((u) => {
        if (u.hasModeratorRole()) {
            const basicStats = new (statistics.getModel())({
                nGamesWon: 0,
                nGamesLost: 0,
                nGamesPlayed: 0,
                nTotalMoves: 0,
                ranking: 0
            });
            console.log("Request Body".blue);
            console.log(req.body);
            if (!req.body.password || !req.body.username) {
                return next({ statusCode: 404, error: true, errormessage: "Some field missing, signin cannot be possibile" });
            }
            const doc = createNewUser(basicStats, req.body);
            doc.setNonRegisteredMod();
            doc.save().then((data) => {
                console.log("New creation of non registered moderator attempt from ".green + req.user.username);
                return res.status(200).json({ error: false, errormessage: "", id: data._id });
            }).catch((reason) => {
                if (reason.code === 11000)
                    return next({ statusCode: 404, error: true, errormessage: "User already exists" });
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
            });
        }
        else {
            return res.status(401).json({ error: true, errormessage: "Operation not permitted" });
        }
    }).catch((reason) => {
        return res.status(401).json({ error: true, errormessage: "DB error: " + reason.errmsg });
    });
});
function createNewUser(statistics, bodyRequest) {
    const model = user.getModel();
    const doc = new model({
        username: bodyRequest.username,
        name: bodyRequest.name,
        surname: bodyRequest.surname,
        avatarImgURL: bodyRequest.avatarImgURL,
        mail: bodyRequest.mail,
        state: 'logged',
        statistics: statistics,
        deleted: false
    });
    doc.setPassword(bodyRequest.password);
    return doc;
}
app.delete("/users/:username", auth, (req, res, next) => {
    console.log("Deleting user with username ".blue + req.params.username);
    // Check if user who request is a moderator
    user.getModel().findOne({ username: req.user.username, deleted: false }).then((u) => {
        if (u.hasModeratorRole()) {
            user.getModel().findOne({ username: req.params.username }).then((d) => {
                if (d.hasModeratorRole()) {
                    return res.status(401).json({ error: true, errormessage: "You cannot delete a mod" });
                }
                else {
                    for (let i = 0; i < d.friendList.length; i++) {
                        user.getModel().findOne({ username: d.friendList[i].username }).then((u) => {
                            let newFriendList = [];
                            for (let j = 0; j < u.friendList.length; j++) {
                                if (u.friendList[j].username != req.params.username) {
                                    newFriendList.push(u.friendList[i]);
                                }
                            }
                            u.friendList = newFriendList;
                            u.save().then(() => {
                                console.log("Removed player from friend");
                            });
                        });
                    }
                    d.deleteUser();
                    d.save().then((data) => {
                        console.log(data.username + " deleted".blue);
                        return res.status(200).json({ error: false, errormessage: "" });
                    }).catch((reason) => {
                        return res.status(401).json({ error: true, errormessage: "DB error " + reason });
                    });
                }
            }).catch((reason) => {
                return res.status(404).json({ error: true, errormessage: "DB error " + reason });
            });
        }
        else {
            return res.status(401).json({ error: true, errormessage: "You cannot do it, you aren't a mod!" });
        }
    }).catch((reason) => {
        return res.status(401).json({ error: true, errormessage: "DB error " + reason });
    });
});
app.put("/users", auth, (req, res, next) => {
    console.log("Update user information for ".blue + req.user.username);
    console.log("Request Body".blue);
    console.log(req.body);
    const doc = user.getModel().findOne({ username: req.user.username, deleted: false }).then((u) => {
        u.name = req.body.name ? req.body.name : u.name;
        u.surname = req.body.surname ? req.body.surname : u.surname;
        u.mail = req.body.mail ? req.body.mail : u.mail;
        u.avatarImgURL = req.body.avatarImgURL ? req.body.avatarImgURL : u.avatarImgURL;
        if (req.body.password) {
            u.setPassword(req.body.password);
        }
        if (u.hasNonRegisteredModRole() && !(req.body.name && req.body.surname && req.body.mail && req.body.avatarImgURL && req.body.password)) {
            return res.status(400).json({ error: true, errormessage: "Some field are missing" });
        }
        if (u.hasNonRegisteredModRole()) {
            console.log("Changing user role to moderator, now all operations are permitted".blue);
            u.setModerator();
        }
        u.save().then((data) => {
            ios.emit('updateUser', data);
            console.log("Data saved successfully".blue);
            return res.status(200).json({ error: false, errormessage: "" });
        }).catch((reason) => {
            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
        });
    }).catch((reason) => {
        return res.status(401).json({ error: true, errormessage: "DB error: " + reason });
    });
});
// getting ranking history associated to logged user
app.get('/rankingstory', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username, deleted: false }).then((u) => {
        if (u.hasModeratorRole() || u.hasUserRole()) {
            notification.getModel().find({ deleted: true, sender: req.user.username, $or: [{ type: "randomMatchmaking" }, { type: "friendlyMatchmaking" }] }, "ranking").then((matchmakingList) => {
                return res.status(200).json({ error: false, errormessage: "", matchmakingList: matchmakingList });
            });
        }
        else {
            return res.status(401).json({ error: true, errormessage: "You cannot do it" });
        }
    }).catch((err) => {
        return res.status(401).json({ error: true, errormessage: `DB error: ${err}` });
    });
});
app.post('/game', auth, (req, res, next) => {
    if (req.body.type != 'watchGame') {
        let client = socketIOclients[req.user.username];
        // console.log(client);
        // console.log(matchRooms[req.user.username] != client);
        if (matchRooms[req.user.username] != client) {
            matchRooms[req.user.username] = {};
            matchRooms[req.user.username][req.user.username] = client;
            matchWatcherRooms[req.user.username] = {};
        }
        else {
            console.log("L'utente è già inserito in una room: ".red);
            // client.emit('alreadyCreatedRoom')
        }
        client.join(req.user.username);
        console.log("Client joined the room ".green + req.user.username);
    }
    if (req.body.type == 'randomMatchmaking') {
        const u = user.getModel().findOne({ username: req.user.username }).then((us) => {
            const matchRequest = notification.getModel().find({ type: "randomMatchmaking", receiver: null, deleted: false }).then((nList) => {
                let n = undefined;
                for (let i = 0; i < nList.length; i++) {
                    let iter = nList[i];
                    if (iter.ranking - us.statistics.ranking < 80) {
                        n = iter;
                    }
                }
                if (notification.isNotification(n)) {
                    if (n != null && n.sender != us.username) {
                        const randomMatch = createNewRandomMatch(n.sender, us.username);
                        n.receiver = us.username;
                        randomMatch.save().then((data) => {
                            console.log("New creation of random match");
                            return res.status(200).json({ error: false, message: "The match wil start soon" });
                        }).catch((reason) => {
                            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                        });
                        n.deleted = true;
                        n.inpending = false;
                        if (n != null) {
                            n.save().then().catch((reason) => {
                                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                            });
                        }
                        let player1 = randomMatch.player1.toString();
                        let player2 = randomMatch.player2.toString();
                        let client1 = socketIOclients[player1];
                        let client2 = socketIOclients[player2];
                        matchRooms[player1][player2] = client2;
                        client2.join(player1);
                        delete matchRooms[player2];
                        // When the clients receive this message they will redirect by himself to the match route
                        client1.emit('lobby', 'true');
                        client2.emit('lobby', 'true');
                        if (randomMatch.player1.toString() == player1.toString()) {
                            console.log("starts player1");
                            let pl1Turn = JSON.stringify({ yourTurn: true });
                            client1.emit('move', JSON.parse(pl1Turn));
                            let pl2Turn = JSON.stringify({ yourTurn: false });
                            client2.emit('move', JSON.parse(pl2Turn));
                        }
                        else {
                            console.log("starts player2");
                            let pl2Turn = JSON.stringify({ yourTurn: true });
                            client2.emit('move', JSON.parse(pl2Turn));
                            let pl1Turn = JSON.stringify({ yourTurn: false });
                            client1.emit('move', JSON.parse(pl1Turn));
                        }
                        let watchersMessage = JSON.stringify({ playerTurn: randomMatch.player1.toString() });
                        ios.to(randomMatch.player1.toString() + 'Watchers').emit('gameStatus', JSON.parse(watchersMessage));
                    }
                    else {
                        console.log("Match request already exists");
                        return res.status(200).json({ error: false, essage: "Match request already exists" });
                    }
                }
                else {
                    // Whene the client get this message he will send a message to the server to create a match room
                    socketIOclients[us.username].emit('createMatchRoom', 'true');
                    const doc = createNewGameRequest(req.body, us.username, us.statistics.ranking);
                    console.log(doc);
                    doc.save().then((data) => {
                        if (notification.isNotification(data)) {
                            console.log("New creation of matchmaking request, player1 is: " + data.sender);
                            return res.status(200).json({ error: false, message: "Waiting for other player..." });
                        }
                    }).catch((reason) => {
                        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                    });
                }
            });
        });
    }
    else if (req.body.type == 'friendlyMatchmaking') {
        const u = user.getModel().findOne({ username: req.user.username }).then((us) => {
            const matchRequest = notification.getModel().findOne({ type: "friendlyMatchmaking", receiver: us.username, deleted: false }).then((n) => {
                if (notification.isNotification(n)) {
                    if (n != null && n.sender != us.username) {
                        const randomMatch = createNewRandomMatch(n.sender, n.receiver);
                        randomMatch.save().then((data) => {
                            console.log("New creation of random match");
                            return res.status(200).json({ error: false, errormessage: "The match wil start soon" });
                        }).catch((reason) => {
                            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                        });
                        n.deleted = true;
                        n.inpending = false;
                        if (n != null) {
                            n.save().then().catch((reason) => {
                                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                            });
                        }
                        let player1 = n.sender;
                        let player2 = us.username;
                        let client1 = socketIOclients[player1];
                        let client2 = socketIOclients[player2];
                        matchRooms[player1][player2] = client2;
                        client2.join(player1);
                        // When the clients receive this message they will redirect by himself to the match route
                        client1.emit('lobby', 'true');
                        client2.emit('lobby', 'true');
                    }
                    else {
                        console.log("Match request already exists");
                        return res.status(200).json({ error: false, message: "Match request already exists" });
                    }
                }
                else {
                    // Whene the client get this message he will send a message to the server to create a match room
                    // socketIOclients[us.username].emit('createMatchRoom', 'true')
                    // Check if the opposite player is a friend
                    if (!us.isFriend(req.body.oppositePlayer))
                        return res.status(400).json({ error: true, message: "The selected opposite player is not a friend" });
                    const doc = createNewGameRequest(req.body, us.username, us.statistics.ranking, req.body.oppositePlayer);
                    console.log(doc);
                    doc.save().then((data) => {
                        if (notification.isNotification(data)) {
                            let friendMessage = JSON.stringify({ player: us.username.toString() });
                            socketIOclients[req.body.oppositePlayer].emit("gameRequest", JSON.parse(friendMessage));
                            console.log("New creation of matchmaking request, player1 is: " + data.sender);
                            return res.status(200).json({ error: false, message: "Waiting for other player..." });
                        }
                    }).catch((reason) => {
                        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                    });
                }
            });
        });
    }
    else if (req.body.type == 'watchGame') {
        user.getModel().findOne({ username: req.user.username }).then((user) => {
            if (user.hasUserRole() || user.hasModeratorRole()) {
                match.getModel().findOne({ inProgress: true, $or: [{ player1: req.body.player }, { player2: req.body.player }] }).then((m) => {
                    if (m != null) {
                        if (match.isMatch(m)) {
                            let client = null;
                            if (socketIOclients[user.username.toString()])
                                client = socketIOclients[user.username.toString()];
                            else
                                return next({ statusCode: 404, error: true, errormessage: "SocketIO client is not connected" });
                            if (!matchRooms[m.player1.toString()][user.username.toString()]) {
                                matchRooms[m.player1.toString()][user.username.toString()] = client;
                                client.join(m.player1);
                            }
                            if (!matchWatcherRooms[m.player1.toString()][user.username.toString()]) {
                                matchWatcherRooms[m.player1.toString()][user.username.toString()] = client;
                                client.join(m.player1.toString() + 'Watchers');
                            }
                            let watcherMessage = m.nTurns % 2 ? JSON.stringify({ playerTurn: m.player1.toString(), playground: m.playground }) : JSON.stringify({ playerTurn: m.player2.toString(), playground: m.playground });
                            client.emit('enterGameWatchMode', JSON.parse(watcherMessage));
                            return res.status(200).json({ error: false, message: "" });
                        }
                    }
                    else {
                        // ! Errore: il match non esiste
                    }
                });
            }
        });
    }
    else {
        return res.status(400).json({ error: true, errormessage: "The payload does not match the required parameter" });
    }
});
app.delete('/game', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((user) => {
        if (user.hasModeratorRole() || user.hasUserRole()) {
            match.getModel().findOne({ $or: [{ player1: user.username.toString() }, { player2: user.username.toString() }], inProgress: true }).then((match) => {
                if (match != null) {
                    match.inProgress = false;
                    match.winner = user.username.toString() ? match.player1.toString() : match.player2.toString();
                    match.save().then((data) => {
                        // socketIOclients[user.username.toString() !? match.player1.toString() : match.player2.toString()].emit('prova', 'prova')
                        if (user.username.toString() == match.player1.toString()) {
                            let message = JSON.stringify({ winner: match.player2.toString(), message: "Opposite player have left the game" });
                            // socketIOclients[match.player2.toString()].emit('result', JSON.parse(message))
                            socketIOclients[user.username.toString()].broadcast.to(match.player1).emit('result', JSON.parse(message));
                        }
                        else {
                            let message = JSON.stringify({ winner: match.player1.toString(), message: "Opposite player have left the game" });
                            socketIOclients[user.username.toString()].broadcast.to(match.player1).emit('result', JSON.parse(message));
                        }
                        console.log("The match have been deleted correctely");
                        return res.status(200).json({ error: false, message: "" });
                    }).catch((reason) => {
                        console.log("DB error: " + reason);
                        return res.status(400).json({ error: true, errormessage: "DB error" });
                    });
                }
                else {
                    // Se non esiste un match, allora si annulla la richiesta del match
                    notification.getModel().findOne({ type: 'randomMatchmaking', sender: user.username.toString(), receiver: null, deleted: false }).then((notification) => {
                        if (notification != null) {
                            notification.deleted = true;
                            notification.save().then((data) => {
                                delete matchRooms[notification.sender.toString()];
                                console.log("The match request have been deleted correctely");
                                return res.status(200).json({ error: false, message: "" });
                            }).catch((reason) => {
                                console.log("DB error: " + reason);
                                return res.status(400).json({ error: true, errormessage: "DB error" });
                            });
                        }
                        else {
                            // ! Non esiste alcuna notification
                            console.log("Non esiste alcune notification".red);
                            return res.status(400).json({ error: true, errormessage: "Non esiste alcuna notification" });
                        }
                    });
                }
            });
        }
        else {
            // ! L'utente non ha ruolo utente o moderatore
            console.log("L'utente non ha ruolo utente o moderatore");
            return res.status(400).json({ error: true, errormessage: "L'utente non ha ruolo utente o moderatore" });
        }
    });
});
// TODO controllare che l'utente sia dentro la stanza degli osservatori della partita
app.post('/gameMessage', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        if (u.hasUserRole() || u.hasModeratorRole()) {
            user.getModel().findOne({ username: req.body.player }).then((player) => {
                match.getModel().findOne({ inProgress: true, $or: [{ player1: player.username.toString() }, { player2: player.username.toString() }] }).then((m) => {
                    if (m != null) {
                        if (match.isMatch(m)) {
                            if (((u.username == m.player1 || u.username == m.player2) && socketIOclients[u.username].rooms.has(m.player1.toString())) || ((u.username != m.player1 && u.username != m.player2) && (socketIOclients[u.username].rooms.has(m.player1.toString()) && socketIOclients[u.username].rooms.has(m.player1.toString() + 'Watchers')))) {
                                let client = null;
                                if (socketIOclients[u.username.toString()])
                                    client = socketIOclients[u.username.toString()];
                                else
                                    return next({ statusCode: 404, error: true, errormessage: "SocketIO client is not connected" });
                                let newMessage = createChatMessage(u.username.toString(), req.body.message);
                                if (u.username == m.player1.toString() || u.username == m.player2.toString()) {
                                    client.broadcast.to(m.player1).emit('gameChat', newMessage);
                                }
                                else {
                                    client.broadcast.to(m.player1 + 'Watchers').emit('gameChat', newMessage);
                                }
                                m.updateOne({ $push: { chat: newMessage } }).then((data) => {
                                    console.log("Message saved".green);
                                    return res.status(200).json({ error: false, message: "" });
                                }).catch((reason) => {
                                    console.log("Error: " + reason);
                                });
                            }
                            else {
                                // ! Errore : il socket del client deve essere dentro alla room della partita
                            }
                        }
                        else {
                            console.log("Partita non valida");
                        }
                    }
                    else {
                        console.log("Partita non trovata");
                    }
                });
            });
        }
        else {
            console.log("Utente non trovato");
        }
    });
});
// Create a new request of different type
app.post('/notification', auth, (req, res, next) => {
    console.log("Entrato");
    console.log("Receiver:", req.body.receiver);
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        if (u.hasModeratorRole() || u.hasUserRole()) {
            if (req.body.type === "friendRequest") {
                user.getModel().findOne({ username: req.body.receiver }).then((receiver) => {
                    if (receiver.isFriend(u.username.toString())) {
                        return res.status(400).json({ error: true, errormessage: "You are already friend" });
                    }
                    else {
                        // Accetto la possibilità che un utente possa inviare di nuovo una richiesta, dopo che questa è stata rifiutata
                        notification.getModel().findOne({ type: "friendRequest", sender: u.username, receiver: receiver.username.toString(), deleted: false }).then((n) => {
                            if (n !== null) {
                                console.log("You have already sent a request to this user.");
                                return res.status(400).json({ error: true, errormessage: "You have already sent a request to this user." });
                            }
                            else {
                                const fr = createNewFriendRequest("friendRequest", u.username, receiver.username.toString());
                                fr.save().then((data) => {
                                    console.log("Request forwarded");
                                    if (socketIOclients[receiver.username.toString()]) {
                                        console.log("eccomi:", receiver.username.toString());
                                        let receiverMessage = JSON.stringify({ sender: u.username.toString(), type: "friendRequest" });
                                        socketIOclients[receiver.username.toString()].emit('newNotification', JSON.parse(receiverMessage));
                                    }
                                    return res.status(200).json({ error: false, message: "Request forwarded to " + req.body.receiver });
                                }).catch((reason) => {
                                    return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                                });
                            }
                        }).catch((reason) => {
                            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                        });
                    }
                });
                // } else if (req.body.type === "friendMessage") {//Send a new message to a friend
                //   //TODO WEBSOCKET
                //   if (u.isFriend(req.body.receiver) || u.hasModeratorRole()) {//Check if the receiver is a friend, in case i am a regular user
                //     if (!req.body.text || !req.body.receiver) {
                //       return next({ statusCode: 404, error: true, errormessage: "Something is missing" });
                //     }
                //     const msg = createNewFriendMessage(req.body, req.user.username);
                //     u.addNotification(msg);
                //     u.save().then((data) => {
                //       const rec = user.getModel().findOne({ username: msg.receiver }).then((rec: User) => {
                //         rec.addNotification(msg);
                //         rec.save().then((data) => {
                //           console.log("Message sent successfully to: ".green + req.body.receiver);
                //           return res.status(200).json({ error: false, errormessage: "", id: data._id });
                //         }).catch((reason) => {
                //           return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg })
                //         })
                //       })
                //     }).catch((reason) => {
                //       return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
                //     })
                //   } else {
                //     return next({ statusCode: 404, error: true, errormessage: "Friend not found. " });
                //   }
                // } else if (req.body.type === "friendlyMatchmaking") {
                //TODO WEBSOCKET(esempio della chat data dal sito di socket.io)
                // if (u.isFriend(req.body.receiver) || u.hasModeratorRole()) {//Check if the receiver is a friend, in case i am a regular user
                //   const doc = notification.getModel().findOne({ type: "friendlyMatchmaking", sender: req.user.username, receiver: req.body.receiver, $or: [{ deleted: false }, { deleted: true, state: true }] }).then((n) => {//? Come decido se poter rimandare o no la richiesta?
                //     if (n !== null) {
                //       console.log("You have already sent a request to this user.");
                //       return res.status(400).json({ error: true, errormessage: "You have already sent a request to this user." });
                //     } else {
                //       const fr = createNewFriendlyMatchmaking(req.body, u.username);
                //       fr.save().then((data) => {
                //         if (notification.isNotification(data)) {
                //           console.log("Request forwarded.")
                //           return res.status(200).json({ error: false, message: "Request forwarded to " + req.body.receiver });
                //         }
                //       }).catch((reason) => {
                //         return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                //       })
                //     }
                //   }).catch((reason) => {
                //     return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                //   })
                // } else {
                //   return next({ statusCode: 404, error: true, errormessage: "Friend not found. " });
                // }
            }
            else {
                return next({ statusCode: 404, error: true, errormessage: "Type of the notification not accepted. " });
            }
        }
        else {
            return next({ statusCode: 404, error: true, errormessage: "You are not registered yet. " });
        }
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
// Return all the notification of the specified user (no messages)
// Returns all the notification that the user have received and that are not read yet
app.get('/notification', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        if (u.hasModeratorRole() || u.hasUserRole()) {
            notification.getModel().find({ receiver: u.username.toString(), deleted: false, inpending: true }).then((n) => {
                return res.status(200).json({ error: false, errormessage: "", notification: n });
            }).catch((reason) => {
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
            });
        }
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
// Returns all the messages
app.get('/message', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((user) => {
        if (user.hasModeratorRole() || user.hasUserRole()) {
            message.getModel().find({ receiver: user.username.toString(), inpending: true }).then((inPendingMessages) => {
                message.getModel().find({ $or: [{ sender: user.username.toString() }, { receiver: user.username.toString() }] }).then((allMessages) => {
                    return res.status(200).json({ error: false, message: "", inPendingMessages: inPendingMessages, allMessages: allMessages });
                }).catch((reason) => {
                    console.log("DB error: " + reason);
                    return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                });
            }).catch((reason) => {
                console.log("DB error: " + reason);
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
            });
        }
        else {
            // ! Errore: l'utente non ha ruolo utente o moderatore 
        }
    }).catch((reason) => {
        console.log("DB error: " + reason);
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
// Send a message to a specif user
app.post('/message', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((sender) => {
        if (sender != null) {
            user.getModel().findOne({ username: req.body.receiver }).then((receiver) => {
                if (receiver != null) {
                    if (sender.isFriend(receiver.username) || sender.hasModeratorRole()) {
                        let m = createMessage(sender.username.toString(), receiver.username.toString(), req.body.message);
                        m.save().then((data) => {
                            console.log("Message have been saved correctely: ".green + data);
                            if (socketIOclients[receiver.username.toString()]) {
                                socketIOclients[receiver.username.toString()].emit('message', data);
                            }
                            return res.status(200).json({ error: false, errormessage: "" });
                        }).catch((reason) => {
                            console.log("DB error : " + reason);
                            return res.status(404).json({ error: true, errormessage: "DB error: " + reason.errmsg });
                        });
                    }
                    else {
                        // ! Errore: il destinatario non è un amico
                        console.log("Errore: il destinatario non è un amico");
                    }
                }
                else {
                    // ! Errore: il destinatario non è un utente
                    console.log("Errore: il destinatario non è un utente");
                }
            });
        }
        else {
            // ! Errore: il mittente non è un'utente
            console.log("Errore: il mittente non è un'utente");
        }
    });
});
// Update the non-read messages into read messages
app.put('/message', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((user) => {
        if (user.hasUserRole() || user.hasModeratorRole()) {
            message.getModel().find({ receiver: req.body.username, sender: req.body.sender, inpending: true }).then((m) => {
                if (m) {
                    m.forEach((message) => {
                        message.inpending = false;
                        message.save().then((data) => {
                            console.log("Message have been updated".green);
                        }).catch((reason) => {
                            console.log("DB error: " + reason);
                            return res.status(404).json({ error: true, errormessage: "DB error: " + reason.errmsg });
                        });
                    });
                    console.log("All messages have been updated");
                    return res.status(200).json({ error: false, errormessage: "" });
                }
                else {
                    // ! Non ci sono messagi
                    return res.status(404).json({ error: true, errormessage: "There is no messages to be update" });
                }
            });
        }
        else {
            // ! Errore: l'utente non ha ruolo utente o moderatore 
        }
    });
});
// Return the inbox of the current logged user
// app.get('/notification/inbox', auth, (req, res, next) => {
//   const u = user.getModel().findOne({ username: req.user.username }).then((u: User) => {
//     //Verify if the user is register
//     if (u.hasModeratorRole() || u.hasUserRole()) {
//       console.log("Questo è l'id della notifica: ", mongoose.Types.ObjectId().toString());
//       console.log("Chat di:" + req.user.username);
//       return res.status(200).json({ inbox: u.inbox });
//     }
//   }).catch((reason) => {
//     return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
//   })
// })
// When a client read a notification, when he open it then it send this request in order to inform the server that the notification has been
// read and it must be updated in the server
app.put('/notification', auth, (req, res, next) => {
    //The user accept or decline a friendRequest
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        if (u.hasModeratorRole() || u.hasUserRole()) {
            user.getModel().findOne({ username: req.body.sender }).then((sender) => {
                if (sender.hasModeratorRole() || sender.hasUserRole()) {
                    notification.getModel().findOne({ type: "friendRequest", sender: sender.username, deleted: false, inpending: true }).then((n) => {
                        if (n === null) {
                            return res.status(404).json({ error: true, errormessage: "Notification not found." });
                        }
                        else {
                            n.inpending = false;
                            if (req.body.accepted) {
                                u.addFriend(sender.username.toString(), false);
                                u.save().then((data) => {
                                    console.log("New friend saved".green);
                                }).catch((reason) => {
                                    return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
                                });
                                sender.addFriend(u.username.toString(), false);
                                sender.save().then((data) => {
                                    console.log("New friend saved".green);
                                }).catch((reason) => {
                                    return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
                                });
                                if (socketIOclients[sender.username.toString()]) {
                                    let senderMessage = JSON.stringify({ newFriend: u.username.toString() });
                                    socketIOclients[sender.username.toString()].emit('acceptedRequest', JSON.parse(senderMessage));
                                }
                            }
                            n.save().then((data) => {
                                console.log("Data saved successfully".blue);
                                return res.status(200).json({ error: false, errormessage: "" });
                            }).catch((reason) => {
                                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
                            });
                        }
                    }).catch((reason) => {
                        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                    });
                }
                else {
                    // ! Il sender non ha ruolo di utente o moderatore
                }
            }).catch((reason) => {
                return next({ statuscode: 404, error: true, errormessage: "DB error: " + reason });
            });
        }
        else {
            // ! L'utete non ha ruolo utente o moderatore
        }
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
// app.post('/friend', auth, (req, res, next) => {
//   user.getModel().findOne({ username: req.user.username }).then((u: User) => {
//     if (u.hasModeratorRole() || u.hasUserRole()) {
//       user.getModel().findOne({username : req.body.sender}).then((sender: User) => {
//         if((sender.hasModeratorRole() || sender.hasUserRole()) && !sender.isFriend(u.username.toString())){
//           notification.getModel().findOne({ type: "friendRequest", sender: sender.username.toString(), receiver: u.username.toString(), state: false, deleted: false }).then((n) => {
//             if(req.body.accepted)
//               u.addFriend(n.sender, false)
//             u.save().then((data) => {
//               sender.addFriend(u.username, false)    
//               sender.save().then((data) => {
//                 console.log("Friend added.".blue)
//                 return res.status(200).json({ error: false, errormessage: "", message: "Friend " + req.body.sender + " added." })
//               }).catch((reason) => {
//                 u.deleteFriend(n.sender)
//                 u.save()
//                 return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg })
//               })
//             })
//           }).catch((reason) => {
//             return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg })
//           })
//         }
//       }).catch((reason) => {
//         return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg })
//       })
//     }
//     else{
//       // ! Il sender non ha ruolo utente o moderatore oppure è già amico dell'utente
//     }
//   }).catch((reason) => {
//     return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg })
//   })
// })
app.get('/friend', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        if (u.hasModeratorRole() || u.hasUserRole()) {
            return res.status(200).json({ error: false, errormessage: "", friendlist: u.friendList });
        }
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
    });
});
app.delete('/friend', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        if (u.hasModeratorRole() || u.hasUserRole()) {
            user.getModel().findOne({ username: req.body.username }).then((friend) => {
                if (u.isFriend(friend.username.toString())) {
                    u.deleteFriend(friend.username.toString());
                    u.save().then((data) => {
                        friend.deleteFriend(u.username.toString());
                        friend.save().then((data) => {
                            console.log("Friend deleted.".blue);
                            return res.status(200).json({ error: false, errormessage: "", message: "Friend " + req.body.username + " removed from the friendlist." });
                        }).catch((reason) => {
                            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
                        });
                    }).catch((reason) => {
                        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
                    });
                }
            });
        }
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
app.put('/friend', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        if (u.hasModeratorRole() || u.hasUserRole()) {
            user.getModel().findOne({ username: req.body.username }).then((friend) => {
                u.setIsBlocked(friend.username.toString(), req.body.isBlocked);
                u.save().then((data) => {
                    if (req.body.isBlocked) {
                        console.log("Friend blocked.".blue);
                        return res.status(200).json({ error: false, errormessage: "", message: "You blocked " + req.body.username + "." });
                    }
                    else {
                        console.log("Friend unblocked.".blue);
                        return res.status(200).json({ error: false, errormessage: "", message: "You can now send a message to " + req.body.username + "." });
                    }
                }).catch((reason) => {
                    return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
                });
            });
        }
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
function createNewGameRequest(bodyRequest, username, ranking, oppositePlayer = null) {
    const model = notification.getModel();
    const id1 = mongoose.Types.ObjectId();
    const doc = new model({
        _id: id1,
        type: bodyRequest.type,
        text: null,
        sender: username.toString(),
        receiver: oppositePlayer,
        deleted: false,
        inpending: true,
        ranking: ranking
    });
    return doc;
}
function createNewRandomMatch(player1, player2) {
    // choose game start randomically
    if (Math.random() < 0.5) {
        let t = player1;
        player1 = player2;
        player2 = t;
    }
    const model = match.getModel();
    const doc = new model({
        inProgress: true,
        player1: player1,
        player2: player2,
        winner: null,
        playground: createPlayground(),
        chat: new Array(),
        nTurns: 1
    });
    return doc;
}
function createPlayground() {
    const playground = new Array(6);
    for (let i = 0; i < 6; i++) {
        playground[i] = new Array(7);
    }
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 7; j++) {
            playground[i][j] = '/';
        }
    }
    return playground;
}
function createNewFriendRequest(type, username, receiver) {
    const model = notification.getModel();
    const id1 = mongoose.Types.ObjectId();
    const doc = new model({
        _id: id1,
        type: type,
        text: "New friend request by " + username + ".",
        sender: username,
        receiver: receiver,
        inpending: true,
        deleted: false
    });
    return doc;
}
// function createNewFriendlyMatchmaking(bodyRequest, username) {
//   const model = notification.getModel()
//   const id1 = mongoose.Types.ObjectId()
//   const doc = new model({
//     _id: id1,
//     type: bodyRequest.type,
//     text: "New invitation for a friendly match from " + username + ".",
//     sender: username,
//     receiver: bodyRequest.receiver,
//     inpending: false,
//     deleted: false
//   })
//   return doc
// }
// function createNewFriendMessage(bodyRequest, username) {
//   const model = notification.getModel()
//   const id1 = mongoose.Types.ObjectId()
//   const doc = new model({
//     _id: id1,
//     type: bodyRequest.type,
//     text: bodyRequest.text,
//     sender: username,
//     receiver: bodyRequest.receiver,
//     deleted: false
//   })
//   return doc
// }
// get connected user and refresh token if expires within 5 minutes
app.get("/whoami", auth, (req, res, next) => {
    let next5Minutes = new Date();
    next5Minutes.setMinutes(next5Minutes.getMinutes() + 5);
    let response = {
        error: false,
        errormessage: `L'utente loggato è ${req.user.username}`
    };
    if (req.user.exp * 1000 <= next5Minutes.getTime()) {
        console.log("Your token will expires within 5 minutes, generating new one".blue);
        response["token"] = signToken(getToken(req.user.username, req.user.id, req.user.avatarImgURL, req.user.roles, req.user.mail, req.user.state));
    }
    return res.status(200).json(response);
});
app.post("/move", auth, (req, res, next) => {
    let username = req.user.username;
    let move = req.body.move;
    user.getModel().findOne({ username: username }).then((u) => {
        if (u.hasModeratorRole() || u.hasUserRole()) {
            if (!move) {
                return res.status(400).json({ error: true, errormessage: "Bad request, you should pass your move" });
            }
            match.getModel().findOne({ inProgress: true, $or: [{ player1: username }, { player2: username }] }).then((m) => {
                if (m) {
                    if (match.isMatch(m)) {
                        let client = socketIOclients[username];
                        let index = parseInt(move);
                        // post move logic
                        if (m.nTurns % 2 == 1 && m.player1 == username) {
                            return makeMove(index, m, client, 'X', m.player2, res, username);
                        }
                        else if (m.nTurns % 2 == 0 && m.player2 == username) { //  player2's turns
                            return makeMove(index, m, client, '/', m.player1, res, username);
                        }
                        else { // trying to post move out of right turn
                            let errorMessage = JSON.stringify({ "error": true, "codeError": 3, "errorMessage": "Wrong turn" });
                            client.emit('move', JSON.parse(errorMessage));
                            return res.status(400).json({ error: true, errormessage: "Wrong turn" });
                        }
                    }
                }
                else {
                    console.log("Match does not exists".red);
                    return res.status(404).json({ error: true, errormessage: "Match does not exists" });
                }
            });
        }
        else {
            return res.status(403).json({ error: true, errormessage: "You cannot do it" });
        }
    });
});
//* END of API routes
function makeMove(index, m, client, placehold, otherPlayer, res, username) {
    if (index >= 0 && index <= 6) {
        if (m.playground[5][index] == '/') {
            m.playground = insertMove(m.playground, index, placehold);
            let moveMessage = JSON.stringify({ "error": false, "codeError": null, "errorMessage": null });
            client.emit('move', JSON.parse(moveMessage));
            let opponentMessage = JSON.stringify({ move: index });
            // Notify event to other player
            socketIOclients[otherPlayer.toString()].emit('move', JSON.parse(opponentMessage));
            let watchersMessage = JSON.stringify({ player: m.player1, move: index, nextTurn: otherPlayer });
            // Notify event to watchers
            client.broadcast.to(`${m.player1}Watchers`).emit('gameStatus', JSON.parse(watchersMessage));
            m.nTurns += 1;
            m.save().then((data) => {
                console.log("Playground updated".green);
                // check winner
                if (username == m.player1.toString()) { // player1 controls
                    if (checkWinner(m.playground, 'X')) {
                        winnerControl(client, m, m.player2, m.player1);
                    }
                }
                else { // player2 controls
                    if (checkWinner(m.playground, 'O')) {
                        winnerControl(client, m, m.player1, m.player2);
                    }
                }
                //is playground full?
                let fullCheck = false;
                for (let i = 0; i < 6; i++) {
                    for (let j = 0; j < 7; j++) {
                        if (m.playground[i][j] == '/') {
                            fullCheck = true;
                        }
                    }
                }
                if (!fullCheck) {
                    let drawnMessage = JSON.stringify({ "winner": null });
                    client.broadcast.to(m.player1).emit('result', JSON.parse(drawnMessage));
                    client.emit('result', JSON.parse(drawnMessage));
                }
                return res.status(200).json({ error: false, errormessage: "added move" });
            }).catch((reason) => {
                console.log(`Error: ${reason}`);
            });
        }
        else {
            // Column not empty
            let errorMessage = JSON.stringify({ "error": true, "codeError": 1, "errorMessage": "The column is full" });
            client.emit('move', JSON.parse(errorMessage));
            return res.status(400).json({ error: true, errormessage: "This column is full, choose another one" });
        }
    }
    else { // move not allowed exit from playground dimension
        let errorMessage = JSON.stringify({ "error": true, "codeError": 2, "errorMessage": "Move not allowed, out of playground" });
        client.emit('move', JSON.parse(errorMessage));
        return res.status(400).json({ error: true, errormessage: "Move not allowed, out of playground, choose another one" });
    }
}
function winnerControl(client, m, loser, winner) {
    let winnerMessage = JSON.stringify({ winner: true });
    client.emit('result', JSON.parse(winnerMessage));
    let loserMessage = JSON.stringify({ winner: false });
    let loserClient = socketIOclients[loser.toString()];
    loserClient.emit('result', JSON.parse(loserMessage));
    let watchersMessage = JSON.stringify({ winner: m.player1 });
    client.broadcast.to(`${m.player1}Watchers`).emit('result', JSON.parse(watchersMessage));
    updateStats(winner, m.nTurns, true);
    updateStats(loser, m.nTurns, false);
    m.updateOne({ inProgress: false, winner: winner }).then((d) => {
        console.log("Winner updated".green);
    }).catch((reason) => {
        console.log(`Error: ${reason}`);
    });
}
function saveClient(client) {
    let token = client.handshake.query['jwt'];
    if (token) {
        jsonwebtoken.verify(token, process.env.JWT_SECRET, (err, dec) => {
            let username = dec.username;
            if (!socketIOclients[username]) {
                socketIOclients[username] = client;
                console.log("User registered".green);
            }
            else {
                console.log("User already registered");
            }
        });
    }
    else {
        console.log(`No jwt found, disconnetion`.red);
        client.disconnect();
    }
}
// Add error handling middleware
app.use(function (err, req, res, next) {
    console.log("Request error: ".red + JSON.stringify(err));
    res.status(err.statusCode || 500).json(err);
});
/*
  The very last middleware will report an error 404 if no error occurred and if the requested endpoint is not matched by any route
*/
app.use((req, res, next) => {
    res.status(404).json({ statusCode: 404, error: true, errormessage: "Invalid Endpoint" });
});
// Connect to mongoDB and launch the HTTP server through Express
mongoose.connect("mongodb+srv://taw:MujMm7qidIDH9scT@cluster0.1ixwn.mongodb.net/forzaCaste?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}).then(() => {
    console.log("Connected to MongoDB".green);
    return user.getModel().findOne({ username: "admin" });
}).then((u) => {
    if (!u) {
        console.log("Creating admin user".blue);
        const basicStats = new (statistics.getModel())({
            nGamesWon: 0,
            nGamesLost: 0,
            nGamesPlayed: 0
        });
        const d = {
            username: "admin",
            name: "admin",
            surname: "admin",
            avatarImgURL: 'https://dt2sdf0db8zob.cloudfront.net/wp-content/uploads/2019/12/9-Best-Online-Avatars-and-How-to-Make-Your-Own-for-Free-image1-5.png',
            mail: "admin@mail.it",
            password: "admin"
        };
        const doc = createNewUser(basicStats, d);
        // doc.setAdmin() //! Sicuri che serva?
        doc.setModerator();
        doc.save();
    }
    else {
        console.log("Admin user already exists".blue);
    }
}).then(() => {
    let server = http.createServer(app);
    const option = {
        allowEIO3: true,
        cors: {
            origin: ["http://localhost:4200", "http://localhost:4201", "http://0.0.0.0:4200"],
            methods: ["GET", "POST"],
            allowedHeaders: ["enableCORS"],
            credentials: true
        }
    };
    ios = new Server(server, option);
    ios.on("connection", function (client) {
        console.log("Socket.io client connected".green);
        saveClient(client);
        // This message is send by the client when he log in
        // TODO spostarlo nel login
        // client.on('saveClient', (clientData) => {
        //   //? Qui potrebbe accadere che il client sia diverso?
        //   if (!socketIOclients[clientData.username]) {
        //     socketIOclients[clientData.username] = client
        //     console.log("User registered".green);
        //   }
        //   else
        //     console.log("Utente già esistente");
        // })
        /*
          - Permette di "giocare" anche se uno ha già vinto -> Andrebbe bloccata ogni mossa.
          - Vorrei che lo stato si aggiornasse, es. Notifica che devi eseguire/avvenuta la mossa (potrebbe essere fatto sfruttando gameStatus)
        */
        // client.on('move', (clientData) => {
        //   let u = user.getModel().findOne({ username: clientData.username }).then((n) => {
        //     if (n != null) {
        //       let doc = match.getModel().findOne({ inProgress: true, $or: [{ player1: clientData.username }, { player2: clientData.username }] }).then((m) => { // Si dovrebbe usare n.username
        //         if (m != null) {
        //           if (match.isMatch(m)) {
        //             let index = parseInt(clientData.move)
        //             // Mossa del player1
        //             if (m.nTurns % 2 == 1 && m.player1 == clientData.username) {
        //               if (index >= 0 && index <= 6) {
        //                 if (m.playground[5][index] == '/') {
        //                   m.playground = insertMove(m.playground, index, 'X')
        //                   let moveMessage = JSON.stringify({"error" : false, "codeError" : null, "errorMessage" : null})
        //                   client.emit('move',JSON.parse(moveMessage))
        //                   let opponentMessage = JSON.stringify({move : index})
        //                   socketIOclients[m.player2.toString()].emit('move', JSON.parse(opponentMessage))
        //                   let watchersMessage = JSON.stringify({player : m.player1, move : index, nextTurn : m.player2})
        //                   client.broadcast.to(m.player1 +'Watchers').emit('gameStatus', JSON.parse(watchersMessage))
        //                   m.nTurns += 1
        //                   m.save().then((data) => {
        //                     console.log("Playground updated".green)
        //                   }).catch((reason) => {
        //                     console.log("Error: " + reason)
        //                   })
        //                 }
        //                 else {
        //                   //! Errore: la colonna è già piena
        //                   let errorMessage = JSON.stringify({"error" : true, "codeError" : 1, "errorMessage" : "The column is full"})
        //                   client.emit('move', JSON.parse(errorMessage))
        //                 }
        //               }
        //               else {
        //                 // ! La mossa inserita non è permessa, esce dal campo
        //                 let errorMessage = JSON.stringify({"error" : true, "codeError" : 2, "errorMessage" : "Move not allowed, out of playground"})
        //                 client.emit('move', JSON.parse(errorMessage))
        //               }
        //             }
        //             // Mossa del player 2
        //             else if (m.nTurns % 2 == 0 && m.player2 == clientData.username) {
        //               if (index >= 0 && index <= 6) {
        //                 if (m.playground[5][index] == '/') {
        //                   m.playground = insertMove(m.playground, index, 'O')
        //                   let moveMessage = JSON.stringify({"error" : false, "codeError" : null, "errorMessage" : null})
        //                   client.emit('move',JSON.parse(moveMessage))
        //                   let opponentMessage = JSON.stringify({move : index})
        //                   socketIOclients[m.player1.toString()].emit('move', JSON.parse(opponentMessage))
        //                   let watchersMessage = JSON.stringify({player : m.player2, move : index, nextTurn : m.player1})
        //                   client.broadcast.to(m.player1 +'Watchers').emit('gameStatus', JSON.parse(watchersMessage))
        //                   m.nTurns += 1
        //                   m.save().then((data) => {
        //                     console.log("Playground updated".green)
        //                   }).catch((reason) => {
        //                     console.log("Error: " + reason)
        //                   })
        //                 }
        //                 else {
        //                   //! Errore: la colonna è già piena
        //                   let errorMessage = JSON.stringify({"error" : true, "codeError" : 1, "errorMessage" : "The column is full"})
        //                   client.emit('move', JSON.parse(errorMessage))
        //                   return null
        //                 }
        //               }
        //               else {
        //                 // ! La mossa inserita non è permessa, esce dal campo
        //                 let errorMessage = JSON.stringify({"error" : true, "codeError" : 2, "errorMessage" : "Move not allowed, out of playground"})
        //                 client.emit('move', JSON.parse(errorMessage))
        //                 return null
        //               }
        //             }
        //             else {
        //               // ! Si sta cercando di eseguire una mossa quando non è il proprio turno
        //               let errorMessage = JSON.stringify({"error" : true, "codeError" : 3, "errorMessage" : "Wrong turn"})
        //               client.emit('move', JSON.parse(errorMessage))
        //               return null
        //             }
        //             // ! Invio la mossa a chi guarda la partita e all'avversario
        //             // TODO se si è verificato un errore nell'inserimento della mossa, il campo non deve essere inviato
        //             // client.broadcast.to(m.player1).emit('move', m.playground)
        //             // ! Controllo se la partita è finita
        //             // Controllo se c'è un vincitore
        //             if (n.username == m.player1.toString()) {
        //               // Controllo per il player1
        //               if (checkWinner(m.playground, 'X')) {
        //                 let winnerMessage = JSON.stringify({winner : true})
        //                 client.emit('result', JSON.parse(winnerMessage))
        //                 let loserMessage = JSON.stringify({winner : false})
        //                 let loserClient = socketIOclients[m.player2.toString()]
        //                 loserClient.emit('result', JSON.parse(loserMessage))
        //                 // Se il campo winner è null allora c'è stato un pareggio
        //                 let watchersMessage = JSON.stringify({winner : m.player1})
        //                 client.broadcast.to(m.player1 +'Watchers').emit('result', JSON.parse(watchersMessage))
        //                 // m.winner = m.player1
        //                 // m.inProgress = false
        //                 // m.set({
        //                 //   winner : m.player1,
        //                 //   inProgress : false
        //                 // })
        //                 // m.updateOne({ inProgress:false}).then((data) => {
        //                 //   data.updateOne({ winner: m.player1 }).then((d) => {
        //                 //     console.log("Winner updated".green)
        //                 //   })
        //                 // }).catch((reason)=>{
        //                 //   console.log("Error: " + reason)
        //                 // })
        //                 updateStats(m.player1, m.nTurns, true)
        //                 updateStats(m.player2, m.nTurns, false)
        //                 m.updateOne({ inProgress: false, winner: m.player1 }).then((d) => {
        //                   console.log("Winner updated".green)
        //                 }).catch((reason) => {
        //                   console.log("Error: " + reason)
        //                 })
        //               }
        //             }
        //             else {
        //               // Controllo per il player 2
        //               if (checkWinner(m.playground, 'O')) {
        //                 // client.emit('gameStatus', 'Hai vinto')
        //                 // let loserClient = socketIOclients[m.player1.toString()]
        //                 // loserClient.emit('gameStatus', 'Hai perso')
        //                 // client.broadcast.to(m.player1).emit('result', 'Il vincitore è: ' + m.player2)
        //                 let winnerMessage = JSON.stringify({winner : true})
        //                 client.emit('result', JSON.parse(winnerMessage))
        //                 let loserMessage = JSON.stringify({winner : false})
        //                 let loserClient = socketIOclients[m.player1.toString()]
        //                 loserClient.emit('result', JSON.parse(loserMessage))
        //                 // Se il campo winner è null allora c'è stato un pareggio
        //                 let watchersMessage = JSON.stringify({winner : m.player1})
        //                 client.broadcast.to(m.player1 +'Watchers').emit('result', JSON.parse(watchersMessage))
        //                 // m.winner = m.player2
        //                 // m.inProgress = false
        //                 // m.save().then((data) => {
        //                 //   console.log("Winner updated".green)
        //                 // }).catch((reason) => {
        //                 //   console.log("Error: " + reason)
        //                 // })
        //                 // m.updateOne({ inProgress:false}).then((data) => {
        //                 //   data.updateOne({ winner: m.player2 }).then((d) => {
        //                 //     console.log("Winner updated".green)
        //                 //   })
        //                 // }).catch((reason)=>{
        //                 //   console.log("Error: " + reason)
        //                 // })
        //                 updateStats(m.player2, m.nTurns, true)
        //                 updateStats(m.player1, m.nTurns, false)
        //                 m.updateOne({ inProgress: false, winner: m.player2 }).then((d) => {
        //                   console.log("Winner updated".green)
        //                 }).catch((reason) => {
        //                   console.log("Error: " + reason)
        //                 })
        //               }
        //             }
        //           }
        //         }
        //       })
        //     }
        //   })
        //   console.log(socketIOclients);
        // })
        // Quando si vuole osservare una partita il client deve accedere allo username del player1
        // Assicura che un client entri una sola volta nella room della partita
        // TODO controllare che il match
        // client.on('enterGameWatchMode', (clientData) => {
        //   user.getModel().findOne({ username: clientData.username }).then((n: User) => {
        //     if (n != null) {
        //       match.getModel().findOne({ inProgress: true, $or: [{ player1: clientData.player }, { player2: clientData.player }] }).then((m: Match) => { // Si dovrebbe usare n.username
        //         if (m != null) {
        //           if (match.isMatch(m)) {
        //             if (!matchRooms[m.player1.toString()][n.username]) {
        //               matchRooms[m.player1.toString()][n.username] = client
        //               client.join(m.player1)
        //             }
        //             if (!matchWatcherRooms[m.player1.toString()][n.username]) {
        //               matchWatcherRooms[m.player1.toString()][n.username] = client
        //               client.join(m.player1.toString() + 'Watchers')
        //             }
        //             let watcherMessage = m.nTurns % 2 ? JSON.stringify({playerTurn : m.player1.toString(), playground : m.playground}) : JSON.stringify({playerTurn : m.player2.toString(), playground : m.playground})
        //             client.emit('enterGameWatchMode', JSON.parse(watcherMessage))
        //           }
        //         }
        //       })
        //     }
        //   })
        // })
        // TODO
        // client.on('sendGameMessage', (clientData) => {
        //   user.getModel().findOne({ username: clientData.username }).then((u: User) => {
        //     // TODO controllare user.isUser(u)
        //     if (u != null) {
        //       // console.log(clientData.player)
        //       match.getModel().findOne({ inProgress: true, $or: [{ player1: clientData.player }, { player2: clientData.player }] }).then((m) => { // Si dovrebbe usare n.username
        //         if (m != null) {
        //           if (match.isMatch(m)) {
        //             // TODO deve essere inviato un JSON che contiene tutte le informazioni del messaggio come sender e timestamp
        //             if (u.username == m.player1.toString() || u.username == m.player2.toString()) {
        //               client.broadcast.to(m.player1).emit('gameChat', clientData.message)
        //               // console.log("Sented");
        //             }
        //             else {
        //               client.broadcast.to(m.player1 + 'Watchers').emit('gameChat', clientData.message)
        //               // console.log("sented");
        //             }
        //             m.updateOne({ $push: { chat: createChatMessage(u.username, clientData.message) } }).then((data) => {
        //               console.log("Message saved".green);
        //             }).catch((reason) => {
        //               console.log("Error: " + reason);
        //             })
        //           }
        //           else {
        //             console.log("Partita non valida");
        //           }
        //         }
        //         else {
        //           console.log("Partita non trovata");
        //         }
        //       })
        //     }
        //     else {
        //       console.log("Utente non trovato");
        //     }
        //   })
        // })
        // // TODO Cosa succede quando un amico è bloccato?
        // client.on("sendMessageTo", (clientData) => {
        //   user.getModel().findOne({username: clientData.username}).then((sender : User) => {
        //     if(sender != null){
        //       user.getModel().findOne({username: clientData.receiver}).then((receiver : User) => {
        //         if(receiver != null){
        //           if(sender.isFriend(receiver.username) || sender.hasModeratorRole()){
        //             let m = createMessage(sender.username.toString(), receiver.username.toString(), clientData.message)
        //             // privateChat.getModel().findOne({ $or: [{ $and: [{user1: sender.username}, {user2: receiver.username}]}, { $and: [{user1: receiver.username}, {user2: sender.username}]}]}).then((p) => {
        //               // if(p != null){
        //                 // Chat già esistente
        //                 // p.updateOne({$push : { msg : createMessage(p.user1, p.user2, clientData.message)}}).then((data) => {
        //                 //   console.log("Messaggio inserito correttamente".green)
        //                 //   let messageData = '{"sender" : "' + sender.username +'", "message" : "' + clientData.message + '", "timestamp" : "' + new Date().toLocaleString('it-IT') +'"}'
        //                 //   socketIOclients[receiver.username].emit('getMessage', JSON.parse(messageData))
        //                 // }).catch((reason) => {
        //                 //   console.log("Error: " + reason);
        //                 // })
        //               // }
        //               // else {
        //                 // Creo una nuova chat
        //                 // let doc = createPrivateChat(sender.username, receiver.username)
        //                 // doc.save().then((data) => {
        //                 //   console.log("Chat creata".green);
        //                 //   doc.updateOne({$push : { msg : createMessage(doc.user1, doc.user2, clientData.message)}}).then((data) => {
        //                 //     console.log("Messaggio inserito correttamente");
        //                 //     let messageData = '{"sender" : "' + sender.username +'", "message" : "' + clientData.message + '", "timestamp" : "' + new Date().toLocaleString('it-IT') +'"}'
        //                 //     socketIOclients[receiver.username].emit('getMessage', JSON.parse(messageData))
        //                 //   }).catch((reason) => {
        //                 //     console.log("Error: " + reason);
        //                 //   })
        //                 // }).catch((reason) => {
        //                 //   console.log("Errore: " + reason);
        //                 // })
        //               // }
        //             // })
        //           }
        //           else {
        //             // ! Errore: il destinatario non è un amico
        //             console.log("Errore: il destinatario non è un amico");
        //             console.log(sender);
        //           }
        //         }
        //         else {
        //           // ! Errore: il destinatario non è un utente
        //           console.log("Errore: il destinatario non è un utente");
        //         }
        //       })
        //     }
        //     else {
        //       // ! Errore: il mittente non è un'utente
        //       console.log("Errore: il mittente non è un'utente");
        //     }
        //   })
        // })
        // TODO fare le richieste hhtp per i messagi e le notifiche (per quando un utente si logga e si vanno a recuperare le pending notificoation)
        // A client send a friend request to another user
        // client.on("notification", (clientData) => {
        //   console.log(clientData.username)
        //   user.getModel().findOne({ username: clientData.username }).then((sender: User) => {
        //     if (sender.hasModeratorRole() || sender.hasUserRole()) {
        //       //Check the type of the request for the creation of the new notification 
        //       if (clientData.type === "friendRequest") {
        //         //TODO WEBSOCKET
        //         user.getModel().findOne({username : clientData.receiver}).then((receiver : User) => {
        //           if(sender.isFriend(receiver.username.toString())){
        //             notification.getModel().findOne({ type: "friendRequest", sender: sender.username, receiver: receiver.username, deleted: false }).then((n) => {//? Come decido se poter rimandare o no la richiesta?
        //               if (n !== null) {
        //                 console.log("You have already sent a request to this user.");
        //                 let clientMessage = JSON.stringify({error : true, message : "You have already sent a request to this user."})
        //                 client.emit('notification', JSON.parse(clientMessage))
        //               } else {
        //                 const fr = createNewFriendRequest(clientData.type, sender.username, receiver.username)
        //                 fr.save().then((data) => {
        //                   console.log("Request forwarded.".green)
        //                   let clientMessage = JSON.stringify({error : false, message: "The request haa been forwarded"})
        //                   client.emit('notification', JSON.parse(clientMessage))
        //                   let receiverMessage = JSON.stringify({type : clientData.type, sender : sender.username.toString()})
        //                   socketIOclients[receiver.username.toString()].emit('notification', JSON.parse(receiverMessage))
        //                 }).catch((reason) => {
        //                   console.log("Error: " + reason);
        //                 })
        //               }
        //             }).catch((reason) => {
        //               console.log("Error: " + reason);
        //             })
        //           }
        //           else{
        //             let clientMessage = JSON.stringify({errore : true, message : "You are already friend of that user"})
        //             client.emit('notification', JSON.parse(clientMessage))
        //           }
        //         })
        //       }
        //     }
        //   })
        // })
        client.on("disconnect", () => {
            let token = client.handshake.query['jwt'];
            if (token) {
                jsonwebtoken.verify(token, process.env.JWT_SECRET, (err, dec) => {
                    let username = dec.username.toString();
                    user.getModel().findOne({ username: username }).then((user) => {
                        match.getModel().findOne({ $or: [{ player1: user.username.toString() }, { player2: user.username.toString() }], inProgress: true, winner: null }).then((match) => {
                            if (match != null) {
                                match.inProgress = false;
                                // Il match esiste, deve essere interrotto e avvisato l'avversario e gli osservatori
                                // console.log(socketIOclients[user.username.toString()])
                                if (user.username.toString() == match.player1.toString()) {
                                    match.winner = match.player2.toString();
                                    let message = JSON.stringify({ winner: match.player2.toString(), message: "Opposite player have left the game" });
                                    // socketIOclients[match.player2.toString()].emit('result', JSON.parse(message))
                                    ios.to(match.player1).emit('result', JSON.parse(message));
                                }
                                else {
                                    match.winner = match.player1.toString();
                                    let message = JSON.stringify({ winner: match.player1.toString(), message: "Opposite player have left the game" });
                                    ios.to(match.player1).emit('result', JSON.parse(message));
                                }
                                match.save().then((data) => {
                                    console.log("Match have been saved corretely");
                                }).catch((reason) => {
                                    console.log("DB error: " + reason);
                                });
                            }
                            else {
                                // Non esiste alcun match, il client può essere disconnesso
                            }
                        });
                    });
                });
            }
            // Quando un client si disconette lo elimino dalla lista dei client connessi
            for (const [k, v] of Object.entries(socketIOclients)) {
                if (v == client)
                    delete socketIOclients[k];
            }
            console.log("Socket.io client disconnected".red);
        });
    });
    server.listen(8080, () => console.log("HTTP Server started on port 8080".green));
}).catch((err) => {
    console.log("Error Occurred during initialization".red);
    console.log(err);
});
// function createPrivateChat(user1, user2) {
//   const model = privateChat.getModel()
//   const doc = new model({
//     user1: user1,
//     user2: user2
//   })
//   return doc
// }
function createChatMessage(sender, text) {
    const model = message.getModel();
    const doc = new model({
        type: "gameMessage",
        content: text,
        sender: sender,
        receiver: null,
        timestamp: new Date().toLocaleString('it-IT')
    });
    return doc;
}
function createMessage(sender, receiver, text) {
    const model = message.getModel();
    const doc = new model({
        type: "message",
        content: text,
        sender: sender,
        receiver: receiver,
        timestamp: new Date().toLocaleString('it-IT'),
        inpending: true
    });
    return doc;
}
function updateStats(player, nTurns, isWinner) {
    user.getModel().findOne({ username: player }).then((p) => {
        let stats = p.statistics;
        if (isWinner) {
            stats.nGamesWon++;
        }
        else {
            stats.nGamesLost++;
        }
        stats.nGamesPlayed++;
        stats.nTotalMoves += Math.trunc(nTurns / 2);
        let rank = getRank(getMMR(stats), isWinner);
        stats.ranking += rank;
        if (stats.ranking <= 0) {
            stats.ranking = 0;
        }
        let msg = JSON.stringify({ "rank": rank });
        socketIOclients[player].emit("result", JSON.parse(msg));
        p.updateOne({ statistics: stats }).then((d) => {
            console.log("Stats updated".green);
        }).catch((reason) => {
            console.log("Error " + reason);
        });
    });
}
function getMMR(statistics) {
    let winRate = statistics.nGamesWon / statistics.nGamesPlayed;
    let avgMove = statistics.nTotalMoves / statistics.nGamesPlayed;
    return winRate + winRate / avgMove;
}
function getRank(mmr, isWinner = true) {
    if (isWinner) {
        if (mmr >= 0.85) {
            return getRandomInt(60, 70);
        }
        else if (mmr >= 0.70) {
            return getRandomInt(40, 60);
        }
        else if (mmr >= 0.50) {
            return getRandomInt(30, 40);
        }
        else if (mmr >= 0.30) {
            return getRandomInt(20, 30);
        }
        else {
            return getRandomInt(10, 20);
        }
    }
    else {
        if (mmr >= 0.50) {
            return -getRandomInt(15, 25);
        }
        else {
            return -getRandomInt(15, 35);
        }
    }
}
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}
function insertMove(playground, index, player) {
    let added = false;
    // Copio la matrice salvata nel db
    let pl = copyPlayground(playground);
    // Aggiungo la mossa
    for (let k = 0; k < 6 && !added; k++) {
        if (pl[k][index] == '/') {
            pl[k][index] = player;
            added = true;
        }
    }
    return pl;
}
function copyPlayground(playground) {
    let pl = new Array(6);
    for (let k = 0; k < 6; k++) {
        pl[k] = new Array(7);
        for (let c = 0; c < 7; c++) {
            pl[k][c] = playground[k][c];
        }
    }
    return pl;
}
// TODO ottimizzare codice
function checkWinner(playground, player) {
    let winCheck = false;
    for (let j = 0; j < 4; j++) {
        for (let i = 0; i < 6; i++) {
            if (playground[i][j] == player && playground[i][j + 1] == player && playground[i][j + 2] == player && playground[i][j + 3] == player) {
                winCheck = true;
            }
        }
    }
    // verticalCheck
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 7; j++) {
            if (playground[i][j] == player && playground[i + 1][j] == player && playground[i + 2][j] == player && playground[i + 3][j] == player) {
                winCheck = true;
            }
        }
    }
    // ascendingDiagonalCheck
    for (let i = 3; i < 6; i++) {
        for (let j = 0; j < 4; j++) {
            if (playground[i][j] == player && playground[i - 1][j + 1] == player && playground[i - 2][j + 2] == player && playground[i - 3][j + 3] == player)
                winCheck = true;
        }
    }
    // descendingDiagonalCheck
    for (let i = 3; i < 6; i++) {
        for (let j = 3; j < 7; j++) {
            if (playground[i][j] == player && playground[i - 1][j - 1] == player && playground[i - 2][j - 2] == player && playground[i - 3][j - 3] == player)
                winCheck = true;
        }
    }
    return winCheck;
}
//# sourceMappingURL=index.js.map