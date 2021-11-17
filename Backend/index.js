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
 *
 *
 *
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
//var ios = undefined;
var app = express();
// This dictionary contains the client that are conncted with the Socket.io server
// Only the logged in users can connect with the server (this will be implemented with the frontend)
var socketIOclients = {};
// This dictionary contains the match rooms: when an user creates a game requests in order to play a game
// he creates a room, named with his username (since the username is unique, cannot exists rooms with the same key)
var matchRooms = {};
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
    // return done(null, false, { statusCode: 500, error: true, errormessage: "Invalid password" });
}));
//TODO add console.log
//* Add API routes to express application
app.get("/", (req, res) => {
    // match.getModel().findOne({_id:"615c5b00ffdfbf0142511956"}).then((m)=>{
    //   console.log(m)
    //   console.log("-----------------")
    //   console.log(match.isMatch(m))
    // })
    res.status(200).json({ api_version: "1.0", endpoints: ["/", "/login", "/users", "/randomgame"] }); //TODO setta gli endpoints
});
// Login endpoint uses passport middleware to check
// user credentials before generating a new JWT
app.get("/login", passport.authenticate('basic', { session: false }), (req, res, next) => {
    // If we reach this point, the user is successfully authenticated and
    // has been injected into req.user
    // We now generate a JWT with the useful user data
    // and return it as response
    // if (!req.user.mail) {
    //   console.log("It's your first login, please change your info".red)
    //   // return done(null, false, {statusCode: 403, error: true, errormessage: "It's your first login, please change your info"})
    //   return res.status(401).json({error: true, errormessage: "It's your first login, please change your info"})
    // }
    //TODO: add useful info to JWT
    var tokendata = {
        username: req.user.username,
        roles: req.user.roles,
        mail: req.user.mail,
        id: req.user.id,
        state: req.user.state
    };
    console.log("Login granted. Generating token");
    var token_signed = jsonwebtoken.sign(tokendata, process.env.JWT_SECRET, { expiresIn: '1h' });
    // Note: You can manually check the JWT content at https://jwt.io
    return res.status(200).json({ error: false, errormessage: "", token: token_signed });
});
// Create new user
app.post('/users', (req, res, next) => {
    const basicStats = new (statistics.getModel())({
        nGamesWon: 0,
        nGamesLost: 0,
        nGamesPlayed: 0
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
        return res.status(200).json({ error: false, errormessage: "", user: { username: u.username, name: u.name, surname: u.surname, avatarImgURL: u.avatarImgURL, mail: u.mail, statistics: u.statistics, friendList: u.friendList } });
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
                nGamesPlayed: 0
            });
            console.log("Request Body".blue);
            console.log(req.body);
            if (!req.body.password || !req.body.username) {
                return next({ statusCode: 404, error: true, errormessage: "Some field missing, signin cannot be possibile" });
            }
            const doc = createNewUser(basicStats, req.body);
            doc.setNonRegisteredMod();
            doc.save().then((data) => {
                console.log("New creation of non registered moderator attempt from ".green + data.mail);
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
                    //! Eliminazione Fisica
                    // user.getModel().deleteOne({ username: req.params.username }).then(
                    //   (q) => {
                    //     if (q.deletedCount > 0) {
                    //       return res.status(200).json({ error: false, errormessage: "" })
                    //     } else {
                    //       return res.status(404).json({ error: true, errormessage: "Invalid username" })
                    //     }
                    //   }
                    // ).catch((reason) => {
                    //   return next({ statusCode: 404, error: true, errormessage: "DB error " + reason })
                    // })
                    //! Eliminazione Logica
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
    if (!req.body.password || !req.body.name || !req.body.surname || !req.body.mail || !req.body.avatarImgURL) {
        return next({ statusCode: 404, error: true, errormessage: "Some field missing, update cannot be possibile" });
    }
    const doc = user.getModel().findOne({ username: req.user.username, deleted: false }).then((u) => {
        u.name = req.body.name;
        u.surname = req.body.surname;
        u.mail = req.body.mail;
        u.avatarImgURL = req.body.avatarImgURL;
        u.setPassword(req.body.password);
        if (u.hasNonRegisteredModRole()) {
            console.log("Changing user role to moderator, now all operations are permitted".blue);
            u.setModerator();
        }
        u.save().then((data) => {
            console.log("Data saved successfully".blue);
            return res.status(200).json({ error: false, errormessage: "" });
        }).catch((reason) => {
            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
        });
    }).catch((reason) => {
        return res.status(401).json({ error: true, errormessage: "DB error: " + reason });
    });
});
app.post('/randomgame', auth, (req, res, next) => {
    const u = user.getModel().findOne({ username: req.user.username }).then((us) => {
        const matchRequest = notification.getModel().findOne({ type: "randomMatchmaking", receiver: null, deleted: false }).then((n) => {
            if (notification.isNotification(n)) {
                // console.log("Esiste uan richiesta");
                if (n != null && n.sender != us.username) {
                    const randomMatch = createNewRandomMatch(n.sender, us.username);
                    randomMatch.save().then((data) => {
                        console.log("New creation of random match");
                        // let player1 = n.sender
                        return res.status(200).json({ error: false, errormessage: "The match wil start soon" });
                    }).catch((reason) => {
                        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                    });
                    n.deleted = true;
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
                const u = user.getModel().findOne({ username: req.user.username }).then((us) => {
                    // Whene the client get this message he will send a message to the server to create a match room          
                    socketIOclients[us.username].emit('createMatchRoom', 'true');
                    const doc = createNewGameRequest(req.body, us.username);
                    console.log(doc);
                    doc.save().then((data) => {
                        if (notification.isNotification(data)) {
                            console.log("New creation of matchmaking request, player1 is: " + data.sender);
                            return res.status(200).json({ error: false, message: "Waiting for other player..." });
                        }
                    }).catch((reason) => {
                        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                    });
                });
            }
        });
    });
});
app.get('/game', auth, (req, res, next) => {
    res.status(200).json({ api_version: "1.0", message: "The game has been started" });
    // let doc = match.getModel().findOne({ inProgress: true, $or: [{player1: req.user.username}, {player2: req.user.username}]}).then((n) => {
    //   if(n != null){
    //     if(match.isMatch(n)){
    //       let i = 0
    //       let playground = n.playground
    //       socketIOclients[req.user.username].on('move', (clientData) => {
    //         if(i%2 == 0 && n.player1 == clientData.username){
    //           if(clientData.move >= 0 && clientData.move <= 7){
    //             n.update() // TODO update the playground by inserting the user move
    //           }
    //         }
    //         else if(i%2 == 1 && n.player2 == clientData.username){
    //         }
    //         else{
    //           // ! Errore
    //         }
    //       })
    //     }
    //   }
    // })
});
app.post('/notification', auth, (req, res, next) => {
    const doc = notification.getModel().findOne({ type: "friendRequest", sender: req.user.username, receiver: req.body.receiver, deleted: false }).then((n) => {
        if (n !== null) {
            console.log("You have already sent a request to this user.");
            return res.status(400).json({ error: true, errormessage: "You have already sent a request to this user." });
        }
        else {
            const u = user.getModel().findOne({ username: req.user.username }).then((u) => {
                const fr = createNewFriendRequest(req.body, u.username);
                fr.save().then((data) => {
                    if (notification.isNotification(data)) {
                        console.log("Request forwarded.");
                        return res.status(200).json({ error: false, message: "Request forwarded." });
                    }
                }).catch((reason) => {
                    return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                });
            });
        }
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
app.get('/notification', auth, (req, res, next) => {
    const u = notification.getModel().find({ $or: [{ receiver: req.user.username }, { sender: req.user.username }] }).then((n) => {
        return res.status(200).json({ error: false, errormessage: "", notification: n });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
app.put('/notification', auth, (req, res, next) => {
    const doc = notification.getModel().findOne({ type: "friendRequest", sender: req.body.sender, deleted: false }).then((n) => {
        if (n === null) {
            return res.status(404).json({ error: true, errormessage: "User not found." });
        }
        else {
            n.state = req.body.state;
            n.deleted = true;
            n.save().then((data) => {
                console.log("Data saved successfully".blue);
                if (data.state) {
                    return res.status(200).json({ error: false, errormessage: "", message: "You accept the request." });
                }
                else {
                    return res.status(200).json({ error: false, errormessage: "", message: "You decline the request" });
                }
            }).catch((reason) => {
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
            });
        }
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
app.post('/friend', auth, (req, res, next) => {
    const u = user.getModel().findOne({ username: req.user.username }).then((u) => {
        const friendToFriendList = notification.getModel().findOne({ type: "friendRequest", sender: req.body.sender, receiver: u.username, state: true, deleted: true }).then((n) => {
            u.addFriend(n.sender, false);
            u.save().then((data) => {
                const send = user.getModel().findOne({ username: n.sender }).then((send) => {
                    send.addFriend(u.username, false);
                    send.save().then((data) => {
                        console.log("Friend added.".blue);
                        return res.status(200).json({ error: false, errormessage: "", message: "Friend " + u.username + " added." });
                    }).catch((reason) => {
                        u.deleteFriend(n.sender);
                        u.save();
                        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
                    });
                });
            }).catch((reason) => {
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
            });
        });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
app.get('/friend', auth, (req, res, next) => {
    const u = user.getModel().findOne({ username: req.user.username }).then((u) => {
        return res.status(200).json({ error: false, errormessage: "", notification: u.friendList });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
    });
});
app.delete('/friend', auth, (req, res, next) => {
    const u = user.getModel().findOne({ username: req.user.username }).then((u) => {
        u.deleteFriend(req.body.username);
        u.save().then((data) => {
            const send = user.getModel().findOne({ username: req.body.username }).then((send) => {
                send.deleteFriend(u.username);
                send.save().then((data) => {
                    console.log("Friend deleted.".blue);
                    return res.status(200).json({ error: false, errormessage: "", message: "Friend " + u.username + " removed from the friendlist." });
                }).catch((reason) => {
                    return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
                });
            });
        }).catch((reason) => {
            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
        });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
app.put('/friend', auth, (req, res, next) => {
    const u = user.getModel().findOne({ username: req.user.username }).then((u) => {
        u.setIsBlocked(req.body.username, req.body.isBlocked);
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
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
function createNewGameRequest(bodyRequest, username) {
    const model = notification.getModel();
    const doc = new model({
        type: bodyRequest.type,
        text: null,
        sender: username.toString(),
        receiver: null,
        deleted: false
    });
    return doc;
}
function createNewRandomMatch(player1, player2) {
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
function createNewFriendRequest(bodyRequest, username) {
    const model = notification.getModel();
    const doc = new model({
        type: bodyRequest.type,
        text: "Richiesta di amicizia da parte di " + username + ".",
        sender: username,
        receiver: bodyRequest.receiver,
        state: false,
        deleted: false
    });
    return doc;
}
// TODO cancella sta cosa
app.get("/whoami", auth, (req, res, next) => {
    console.log(req.user);
    // return next({ statusCode: 200, error: false, errormessage: "Ciao " + req.user.username })
    return res.status(200).json({ error: false, errormessage: `L'utente loggato è ${req.user.username}` });
});
//* END of API routes
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
    // console.log("Fatto".green)
    let server = http.createServer(app);
    const option = {
        allowEIO3: true
    };
    ios = new Server(server, option);
    ios.on("connection", function (client) {
        console.log("Socket.io client connected".green);
        // This message is send by the client when he log in
        client.on('saveClient', (clientData) => {
            if (!socketIOclients[clientData.username]) {
                socketIOclients[clientData.username] = client;
                console.log("User registered".green);
            }
            else
                console.log("Utente già esistente");
        });
        // This event is triggered when a client want to play a random match but there is no match request active, so it creates a game request 
        client.on('createMatchRoom', (clientData) => {
            console.log("Joining...".green);
            if (matchRooms[clientData.username] != clientData) {
                matchRooms[clientData.username] = {};
                matchRooms[clientData.username][clientData.username] = client;
            }
            else {
                console.log("L'utente è già inserito in una room".red);
                client.emit('alreadyCreatedRoom');
            }
            client.join(clientData.username);
            console.log("Client joined the room".green + clientData.username);
            console.log(matchRooms);
        });
        client.on('isInRoom', () => {
            for (const [k, v] of Object.entries(matchRooms)) {
                for (const [k1, v1] of Object.entries(v)) {
                    if (v1 == client)
                        client.emit('isInRoom', 'Yes');
                }
            }
            client.emit('IsInRoom', 'No');
        });
        // TODO: fare i controlli
        client.on('move', (clientData) => {
            let u = user.getModel().findOne({ username: clientData.username }).then((n) => {
                if (n != null) {
                    let doc = match.getModel().findOne({ inProgress: true, $or: [{ player1: clientData.username }, { player2: clientData.username }] }).then((m) => {
                        if (m != null) {
                            if (match.isMatch(m)) {
                                // console.table(m.playground);
                                let index = parseInt(clientData.move);
                                let added = false;
                                // Mossa del player1                
                                if (m.nTurns % 2 == 1 && m.player1 == clientData.username) {
                                    if (index >= 0 && index <= 6) {
                                        if (m.playground[5][index] == '/') {
                                            // Copio la matrice salvata nel db
                                            let pl = new Array(6);
                                            for (let k = 0; k < 6; k++) {
                                                pl[k] = new Array(7);
                                                for (let c = 0; c < 7; c++) {
                                                    pl[k][c] = m.playground[k][c];
                                                }
                                            }
                                            // Aggiungo la mossa
                                            for (let k = 0; k < 6 && !added; k++) {
                                                if (m.playground[k][index] == '/') {
                                                    pl[k][index] = 'X';
                                                    client.emit('move', 'Mossa inserita');
                                                    added = true;
                                                }
                                            }
                                            m.playground = pl;
                                            // console.table(m.playground)
                                            m.nTurns += 1;
                                            // console.table(m.playground)
                                            m.save().then((data) => {
                                                // console.table(data.playground)
                                                console.log("Playground updated".green);
                                            }).catch((reason) => {
                                                console.log("Error: " + reason);
                                            });
                                        }
                                        else {
                                            //! Errore: la colonna è già piena
                                            client.emit('move', 'La colonna è piena');
                                        }
                                    }
                                    else {
                                        // ! La mossa inserita non è permessa, esce dal campo
                                        client.emit('move', 'Mossa non consentita');
                                    }
                                }
                                // Mossa del player 2
                                else if (m.nTurns % 2 == 0 && m.player2 == clientData.username) {
                                    if (index >= 0 && index <= 6) {
                                        if (m.playground[5][index] == '/') {
                                            // Copio la matrice salvata nel db
                                            let pl = new Array(6);
                                            for (let k = 0; k < 6; k++) {
                                                pl[k] = new Array(7);
                                                for (let c = 0; c < 7; c++) {
                                                    pl[k][c] = m.playground[k][c];
                                                }
                                            }
                                            // Aggiungo la mossa
                                            for (let k = 0; k < 6 && !added; k++) {
                                                if (m.playground[k][index] == '/') {
                                                    pl[k][index] = 'O';
                                                    client.emit('move', 'Mossa inserita');
                                                    added = true;
                                                }
                                            }
                                            m.playground = pl;
                                            // console.table(m.playground)
                                            m.nTurns += 1;
                                            // console.table(m.playground)
                                            m.save().then((data) => {
                                                // console.table(data.playground)
                                                console.log("Playground updated".green);
                                            }).catch((reason) => {
                                                console.log("Error: " + reason);
                                            });
                                        }
                                        else {
                                            //! Errore: la colonna è già piena
                                            client.emit('move', 'La colonna è piena');
                                        }
                                    }
                                    else {
                                        // ! La mossa inserita non è permessa, esce dal campo
                                        client.emit('move', 'Mossa non consentita');
                                    }
                                }
                                // Si sta cercando di eseguire una mossa quando non è il proprio turno
                                else {
                                    client.emit('move', 'Turno errato');
                                }
                                // Controllo se la partita è finita
                                console.table(m.playground);
                            }
                        }
                        else {
                            // ! Errore: il match non esiste
                        }
                    });
                }
                else {
                    // ! Errore: l'utente non esiste
                }
            });
        });
        client.on("disconnect", () => {
            // client.close()
            console.log("Socket.io client disconnected".red);
        });
    });
    server.listen(8080, () => console.log("HTTP Server started on port 8080".green));
}).catch((err) => {
    console.log("Error Occurred during initialization".red);
    console.log(err);
});
//# sourceMappingURL=index.js.map