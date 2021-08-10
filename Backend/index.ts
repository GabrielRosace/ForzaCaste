/**
 * HTTP REST server + MongoDB(Mongoose) + Express
 * 
 * Endpoints            Attributes            Method            Description
 * 
 * 
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
var auth = jwt({ secret: process.env.JWT_SECRET, algorithms: ['RS256']});

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
  res.status(200).json({ api_version: "1.0", endpoints: ["/"] }); //TODO setta gli endpoints
});


/*
  Configure HTTP basic authentication strategy
  through passport middleware.
*/
passport.use(new passportHTTP.BasicStrategy(
  function (username, password, done) {
    // Delegate function we provide to passport middleware to verify user credentials
    console.log("New login attempt from ".green + username);

    //TODO login logic
    return done(null, false, { statusCode: 500, error: true, errormessage: "Login not implemented yet!" });
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
mongoose.connect("mongodb+srv://taw:MujMm7qidIDH9scT@cluster0.1ixwn.mongodb.net/forzaCaste?retryWrites=true&w=majority").then(
  () => {
    console.log("Connected to MongoDB".green);
  }
).then(
  () => {
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
