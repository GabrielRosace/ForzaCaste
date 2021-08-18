/**
 * HTTP REST server + MongoDB(Mongoose) + Express
 * 
 * Endpoints            Attributes            Method            Description
 * 
 *    /                     -                   GET             Returns the version and a list of available endpoints
 *  /login                  -                   GET             login an existing user, returning a JWT
 *  /users                  -                   POST            signin a user
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

const result = require('dotenv').config()

if (result.error) {
  console.log("Unable to load '.env' file. Please provide one to store the JWT secret key");
  process.exit(-1);
}

if (!process.env.JWT_SECRET) {
  console.log("'.env' file loaded but JWT_SECRET=<secret> key-value pair was not found");
  process.exit(-1);
}

import fs = require('fs'); // Filesystem Module
import http = require('http'); // HTTP module
//import https = require('https'); // HTTPS module
import colors = require('colors'); // Module to color output string
colors.enabled = true;

import mongoose = require('mongoose');

import express = require('express');
import bodyparser = require('body-parser');       // Used to parse the request body and directly an object that contains "Content-type"

import passport = require('passport');            // Authentication middleware for Express
import passportHTTP = require('passport-http');   // Implements Basic and Digest authentication for HTTP

import jsonwebtoken = require('jsonwebtoken');    // JWT generation
import jwt = require('express-jwt');              // JWT parsing middleware for express

import cors = require('cors');                    // Enable CORS middleware
import io = require('socket.io');                 // Socket.io websocket library
import { nextTick } from 'process'; //! Cos'è?


// * Import application module *
import { User } from './User';
import * as user from './User';

import { Statistics } from './Statistics'
import * as statistics from './Statistics'






declare global { // TODO: Modifica questo
  namespace Express {
    interface User {
      mail: string,
      usernam: string,
      roles: string[],
      id: string
    }
  }
}

var ios = undefined;
var app = express();


/*  
  We create the JWT authentication middleware
  provided by the express-jwt library

  How it works (from the official documentation):
  If the token is valid, req.user will be set with the JSON object
  decoded to be used by later middleware for authentication and access control.
*/
var auth = jwt({ secret: process.env.JWT_SECRET, algorithms: ['RS256'] });

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


//* Add API routes to express application

app.get("/", (req, res) => {
  res.status(200).json({ api_version: "1.0", endpoints: ["/","/login","/users"] }); //TODO setta gli endpoints
});

// Login endpoint uses passport middleware to check
// user credentials before generating a new JWT
app.get("/login", passport.authenticate('basic', { session: false }), (req, res, next) => {

  // If we reach this point, the user is successfully authenticated and
  // has been injected into req.user

  // We now generate a JWT with the useful user data
  // and return it as response

  var tokendata = {
    username: req.user.username,
    roles: req.user.roles,
    mail: req.user.mail,
    id: req.user.id
  };

  console.log("Login granted. Generating token");
  var token_signed = jsonwebtoken.sign(tokendata, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Note: You can manually check the JWT content at https://jwt.io

  return res.status(200).json({ error: false, errormessage: "", token: token_signed });

});

app.post('/users', (req, res, next) => {

  const basicStats = new (statistics.getModel())({
    nGamesWon: 0,
    nGamesLost: 0,
    nGamesPlayed: 0
  })

  const model = user.getModel()

  console.log("Request Body".blue)
  console.log(req.body)

  if (!req.body.password || !req.body.username || !req.body.name || !req.body.surname || !req.body.mail || !req.body.avatarImgURL) {
    return next({ statusCode: 404, error: true, errormessage: "Some field missing, signin cannot be possibile" })
  }


  const doc = new model({
    username: req.body.username,
    name: req.body.name,
    surname: req.body.surname,
    avatarImgURL: req.body.avatarImgURL,
    mail: req.body.mail,
    state: 'logged',
    statistics: basicStats
  })


  doc.setPassword(req.body.password)

  // doc.setAdmin()
  
  doc.save().then((data) => {
    console.log("New signin attempt from ".green + data.mail)
    return res.status(200).json({ error: false, errormessage: "", id: data._id });
  }).catch((reason) => {
    if (reason.code === 11000)
      return next({ statusCode: 404, error: true, errormessage: "User already exists" });
    return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
  })
});


/*
  Configure HTTP basic authentication strategy
  through passport middleware.
*/
passport.use(new passportHTTP.BasicStrategy(
  function (username, password, done) {
    // Delegate function we provide to passport middleware to verify user credentials
    console.log("New login attempt from ".green + username);

    user.getModel().findOne({ mail: username }, (err, user) => {
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
    })
    // return done(null, false, { statusCode: 500, error: true, errormessage: "Invalid password" });
  }
));

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
}).then(
  () => {
    console.log("Connected to MongoDB".green);
  }
)/*.then(
  () => {
    console.log("Creating admin user");

    const basicStats = new (statistics.getModel())({
      nGamesWon: 0,
      nGamesLost: 0,
      nGamesPlayed: 0
    })

    const model = user.getModel()
    const doc = new model({
      username: "admin",
      name: "admin",
      surname: "admin",
      avatarImgURL: 'https://dt2sdf0db8zob.cloudfront.net/wp-content/uploads/2019/12/9-Best-Online-Avatars-and-How-to-Make-Your-Own-for-Free-image1-5.png',
      mail: "admin@mail.it",
      state: 'logged',
      statistics: basicStats
    })
    doc.setPassword("admin")
    doc.setAdmin()
    doc.save()
  }
)*/.then(
  () => {

    // console.log("Fatto".green)

    let server = http.createServer(app);

    ios = io(server);
    ios.on("connection", function (client) {
      console.log("Socket.io client connected".green);
    });

    server.listen(8080, () => console.log("HTTP Server started on port 8080".green));
  }
).catch(
  (err) => {
    console.log("Error Occurred during initialization".red);
    console.log(err);
  }
);
