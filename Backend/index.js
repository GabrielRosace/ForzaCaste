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
const server = http.createServer(app);
const Server = require('socket.io');
var ios = Server(server);
const io = require("socket.io"); // Socket.io websocket library
const user = require("./User");
const statistics = require("./Statistics");
const notification = require("./Notification");
const match = require("./Match");
//var ios = undefined;
var app = express();
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
// app.listen(3000, function () {
//   console.log('Listening on port 3000!');
//  });
// ios.on("connection", function (client) {
//   console.log("Socket.io client connected".green);
// });
ios.on('connection', (socket) => {
    console.log('socket is ready for connection');
    socket.on('waitingPlayer', (msg) => {
        console.log("A player is waiting");
        console.log(msg);
    });
});
app.post('/randomgame', auth, (req, res, next) => {
    const u = user.getModel().findOne({ username: req.user.username }).then((us) => {
        const matchRequest = notification.getModel().findOne({ type: "randomMatchmaking", sender: { $ne: us._id }, receiver: null, deleted: false }).then((n) => {
            if (notification.isNotification(n)) {
                console.log("Esiste uan richiesta");
                if (n != null) {
                    const randomMatch = createNewRandomMatch(n.sender, us._id);
                    randomMatch.save().then((data) => {
                        console.log("New creation of random match");
                        return res.status(200).json({ error: false, errormessage: "" });
                    }).catch((reason) => {
                        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                    });
                    n.deleted = true;
                    if (n != null) {
                        n.save().then().catch((reason) => {
                            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                        });
                    }
                }
            }
            else {
                const u = user.getModel().findOne({ username: req.user.username }).then((us) => {
                    console.log("Non esiste una richiesta");
                    const doc = createNewGameRequest(req.body, us._id);
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
        nTurns: 0
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
    console.log("Fatto".green);
    let server = http.createServer(app);
    ios = io(server);
    ios.on("connection", function (client) {
        console.log("Socket.io client connected".green);
    });
    server.listen(8080, () => console.log("HTTP Server started on port 8080".green));
}).catch((err) => {
    console.log("Error Occurred during initialization".red);
    console.log(err);
});
//# sourceMappingURL=index.js.map