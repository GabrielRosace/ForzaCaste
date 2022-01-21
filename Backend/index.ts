/**
 * HTTP REST server + MongoDB(Mongoose) + Express
 *
 * Endpoints            Attributes              Method          Description
 *
 *  /                       -                   GET             Returns the version and a list of available endpoints
 * 
 * 
 *  /login                  -                   GET             Login an existing user, returning a JWT
 *
 *  /whoami                 -                   GET             Get user information and refresh the JWT
 * 
 *  /users/:username        -                   GET             Return a user that has username specified
 *  /users                  -                   GET             Return a list of available user
 *  /users/online           -                   GET             Return a list of online player at this moment
 *  /users                  -                   POST            Sign up a new user
 *  /users/mod              -                   POST            Create a new moderator, only moderator can do it
 *  /users                  -                   PUT             Update user information
 *  /users/:username        -                   DELETE          Deletion of standard players from moderators
 * 
 * 
 *  /rankingstory           -                   GET             Return a list of ranking that logged user has at the time of game requests
 *  /rankingstory/:username -                   GET             Return a list of ranking that username has at the time of game requests
 * 
 * 
 *  /game                   -                   GET             Returns a list of game in progress
 *  /game                   -                   POST            Create a random or friendly match. Furthermore a user can enter in a game as observer
 *  /game/cpu               -                   POST            Create a match against CPU. Furthermore a user can enter in a game as observer
 *  /game                   -                   DELETE          Used by a player in order to delete a started game or to delete a game request
 * 	/game                   -                   PUT             Accept a friendly game request
 * 
 *  /move                   -                   POST            Play the turn making a move, it contains the game logic and the event notifier 
 *  /move/cpu               -                   POST            Play the turn vs AI, it contains the game logic and call minmax algorithm to play the AI turn
 *  /move                   -                   GET             Ask AI what is the best move, returns the best column in which insert the disk
 * 
 * 
 *  /gameMessage            -                   POST            Send a message in the game chat
 *
 *  
 * 
 *  /notification           -                   POST            Create a new friend request
 *  /notification           -                   GET             Return all the notification of the specified user. This endpoint returns all the notification that are received and that are not read
 *  /notification     ?inpending=true           GET             Return all the notification of the specified user. This endpoint returns all the notification that are not read
 *  /notification  ?makeNotificationRead=true   GET             Return all the notification of the specified user. This endpoint mark all the notification as read
 *  /notification           -                   PUT             Change the status of the notification, so the indicated notification will appear as read
 * 
 *  /message                -                   GET             Returns all messages and all messages in pending
 *  /message         ?modMessage=true           GET             Returns all moderator messages and all moderator messages in pending
 *  /message                -                   POST            Send a private message to a specific user
 *  /message/mod            -                   POST            Send a private moderator message to a specific user
 *	/message                -                   PUT             Update a specific message and marks it as read
 *  
 *  /friend                 -                   GET             Return the friendlist of the current logged user
 *  /friend/:username       -                   DELETE          Deletion of a friends in the friendlist of the current logged user
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
 * 
 * To compile and run in watch mode:
 * $ npm run auto 
*/

const result = require('dotenv').config()

// if (result.error) {
//   console.log("Unable to load '.env' file. Please provide one to store the JWT secret key");
//   process.exit(-1);
// }

if (!process.env.JWT_SECRET) {
  console.log("'.env' file loaded but JWT_SECRET=<secret> key-value pair was not found");
  process.exit(-1);
}

import fs = require('fs'); // Filesystem Module
import http = require('http'); // HTTP module
// import https = require('https'); // HTTPS module
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
const { Server } = require("socket.io");


// Declaration of variabile to store connected socket
let ios = null




// * Import application module *
import { User } from './User';
import * as user from './User';

import { Statistics } from './Statistics'
import * as statistics from './Statistics'

import { Notification } from './Notification'
import * as notification from './Notification'

import { Match } from './Match'
import * as match from './Match'

import { Message } from './Message'
import * as message from './Message'


import * as CPU from './cpu'
import { timeStamp } from 'console';

declare global {
  namespace Express {
    interface User {
      mail: string,
      usernam: string,
      roles: string[],
      id: string
    }
  }
}

//var ios = undefined;
var app = express();

// This dictionary contains the client that are connected with the Socket.io server
// Only the logged in users can connect with the server (this will be implemented with the frontend)
var socketIOclients = {}
// This dictionary contains the match rooms: when an user creates a game requests in order to play a game
// he creates a room, named with his username (since the username is unique, cannot exists rooms with the same key)
// A match room contains the two player and all the users that want to watch the match.
// var matchRooms = {}
// This dictionary contains all the users that are watching a game. It is used for managing the chat of a game.
// var matchWatcherRooms = {}




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
  and expires it on req.body
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
passport.use(new passportHTTP.BasicStrategy(
  function (username, password, done) {
    // Delegate function we provide to passport middleware to verify user credentials
    console.log("New login attempt from ".green + username);

    if (checkOnlineUser(username)) {
      console.log(`${username} is already logged in...`.red)
      // return done(null,false, {statusCode: 500, error:true, errormessage: 'You are already logged in'})
      return done(null,false, { message: 'You are already logged in'})
    }

    user.getModel().findOne({ username: username }, (err, user) => {
      if (err) {
        return done({ statusCode: 500, error: true, errormessage: err });
      }

      if (!user) {
        console.log(`${username} -> Invalid user`.red)
        // return done(null, false, { statusCode: 500, error: true, errormessage: "Invalid user" });
        return done(null, false, { message: "Invalid user" });
      }
      
      if (user.validatePassword(password)) {
        return done(null, user);
      }
      
      console.log(`${username} -> Invalid password`.red)
      // return done(null, false, { statusCode: 500, error: true, errormessage: "Invalid password" });
      return done(null, false, { message: "Invalid password" });
    })
  }
));

// List of available endpoints in specified version
app.get("/", (req, res) => {
  res.status(200).json({ api_version: "1.0", endpoints: ["/", "/login", "/whoami", "/users","/rankingstory", "/game", "/gameMessage", "/notification", "/friend", "/message", "/move", ] })
});



// ------------------------- User management ---------------------------------
// In our token we save username, id and role of the logged user
function getToken(username, id, roles) {
  return {
    username: username,
    id: id,
    roles: roles
  };
}

function signToken(tokendata) {
  // Making token expiration within 1h, this method is used to make token renewal
  return jsonwebtoken.sign(tokendata, process.env.JWT_SECRET, { expiresIn: '1h' })
}


// Login endpoint uses passport middleware to check user credentials and if it is everything ok a new JWT will be returned
app.get("/login", passport.authenticate('basic', { session: false }), (req, res, next) => {

  // If we reach this point, the user is successfully authenticated and
  // has been injected into req.user

  // We now generate a JWT with the useful user data
  // and return it as response

  const tokendata = getToken(req.user.username, req.user.id, req.user.roles)

  console.log("Login granted. Generating token".green);
  var token_signed = signToken(tokendata)

  return res.status(200).json({ error: false, errormessage: "", token: token_signed });

});


// Get user information associated with the current JWT_TOKEN, in addition refreshes the JWT_TOKEN if the expire time is less than 5 minutes
app.get("/whoami", auth, (req, res, next) => {
  let next5Minutes = new Date()
  next5Minutes.setMinutes(next5Minutes.getMinutes() + 5)

  let response = {
    error: false,
    errormessage: `Logged in user is ${req.user.username}`
  }


  if (req.user.exp * 1000 <= next5Minutes.getTime()) {
    console.log("Your token will expires within 5 minutes, generating new one".blue)
    response["token"] = signToken(getToken(req.user.username, req.user.id, req.user.roles))
  }

  return res.status(200).json(response);
})

// Creation of a new user, this endpoint reset statistics and save user information into DB
app.post('/users', (req, res, next) => {

  const basicStats = new (statistics.getModel())({
    nGamesWon: 0,
    nGamesLost: 0,
    nGamesPlayed: 0,
    nTotalMoves: 0,
    ranking: 0
  })

  console.log("Request Body".blue)
  console.log(req.body)

  if (!req.body.password || !req.body.username || !req.body.name || !req.body.surname || !req.body.mail || !req.body.avatarImgURL) {
    console.log("Some field missing, signup cannot be possible".red)
    return next({ statusCode: 400, errormessage: "Some field missing, signup cannot be possible" })
  }

  if (req.body.username == 'cpu') {
    console.log("You cannot register yourself as cpu".red)
    return next({ statusCode: 400, errormessage: "You cannot register yourself as cpu" })
  }

  const doc = createNewUser(basicStats, req.body)

  doc.setUser()

  doc.save().then((data) => {
    console.log("New creation of user, email is ".green + data.mail)
    return res.status(200).json({ error: false, errormessage: "", id: data._id });
  }).catch((reason) => {
    if (reason.code === 11000) {
      console.log("User already exists".red)
      return next({ statusCode: 404, errormessage: "User already exists" });
    }
    console.log(`DB error : ${reason.errmsg}`.red)
    return next({ statusCode: 401, errormessage: "DB error: " + reason.errmsg });
  })
});

// Getting all online users with a socket.io registered in the application
app.get('/users/online', auth, (req, res, next) => {
  user.getModel().findOne({ deleted: false, username: req.user.username }).then((u: User) => {
    if (u.hasModeratorRole() || u.hasUserRole()) {
      return res.status(200).json({ error: false, errormessage: '', onlineuser: Object.keys(socketIOclients) })
    } else {
      console.log(`You cannot do it`.red)
      return next({ statusCode: 401, errormessage:`You cannot do it` })
    }
  }).catch((e) => {
    console.log(`DB error: ${e}`.red)
    return next({ statusCode: 401, errormessage:`DB error: ${e}` })
  })
})

// This request allows the user to obtain information about another user
app.get('/users/:username', auth, (req, res, next) => {
  user.getModel().findOne({ username: req.params.username }).then((u) => {
    return res.status(200).json({ username: u.username, name: u.name, surname: u.surname, avatarImgURL: u.avatarImgURL, mail: u.mail, statistics: u.statistics, friendList: u.friendList, role: u.roles })
  }).catch((reason) => {
    console.log(`DB error: ${reason}`.red)
    return next({ statusCode: 401, errormessage:`DB error: ${reason}` })
  })
})

// This request allows the user to get all the useful information about the players who are registered in the platform.
app.get('/users', auth, (req, res, next) => {
  user.getModel().findOne({ username: req.user.username, deleted: false }).then((u: User) => {
    if (u.hasModeratorRole() || u.hasUserRole()) {
      user.getModel().find({ deleted: false }, "username name surname roles").then((list: User[]) => {
        return res.status(200).json({ error: false, errormessage: "", userlist: list })
      }).catch((reason) => {
        console.log(`DB error: ${reason}`.red)
        return next({ statusCode: 401, errormessage:`DB error: ${reason}` })
      })
    } else {
      console.log(`You cannot get user list`.red)
      return next({ statusCode: 401, errormessage:`You cannot get user list` })
    }
  }).catch((reason) => {
    console.log(`DB error: ${reason}`.red)
    return next({ statusCode: 401, errormessage:`DB error: ${reason}` })
    })
})

// Create a new moderator, only mod can do it
app.post("/users/mod", auth, (req, res, next) => {
  // Check if user who request is a moderator
  user.getModel().findOne({ username: req.user.username, deleted: false }).then((u: User) => {
    if (u.hasModeratorRole()) {
      // const basicStats = new (statistics.getModel())({
      //   nGamesWon: 0,
      //   nGamesLost: 0,
      //   nGamesPlayed: 0,
      //   nTotalMoves: 0,
      //   ranking: 0
      // })

      const basicStats = {}

      console.log("Request Body".blue)
      console.log(req.body)

      if (!req.body.password || !req.body.username) {
        console.log("Some field missing, signup cannot be possible".red)
        return next({ statusCode: 400, errormessage: "Some field missing, signup cannot be possible" })
      }
      
      const doc = createNewUser(basicStats, req.body)
      
      doc.setNonRegisteredMod()

      doc.save().then((data) => {
        console.log("New creation of non registered moderator attempt from ".green + req.user.username)
        return res.status(200).json({ error: false, errormessage: "", id: data._id });
      }).catch((reason) => {
        if (reason.code === 11000) {
          console.log("User already exists".red) 
          return next({ statusCode: 400, errormessage: "User already exists" });
        }
        console.log(`DB error: ${reason}`.red)
        return next({ statusCode: 401, errormessage: "DB error: " + reason.errmsg });
      })
    } else {
      console.log(`Operation not permitted`.red)
      return next({ statusCode: 401, errormessage:`Operation not permitted` })
    }
  }).catch((reason) => {
    console.log(`2 - DB error: ${reason}`.red)
    return next({ statusCode: 401, errormessage:`DB error: ${reason}` })
  })
})

function createNewUser(statistics, bodyRequest) {
  const model = user.getModel()
  const doc = new model({
    username: bodyRequest.username,
    name: bodyRequest.name,
    surname: bodyRequest.surname,
    avatarImgURL: bodyRequest.avatarImgURL,
    mail: bodyRequest.mail,
    // state: 'logged',
    statistics: statistics,
    deleted: false
  })
  doc.setPassword(bodyRequest.password)
  return doc
}

// This request allows the moderator to logically delete a standard player specified within param. It also removes his friendships.
app.delete("/users/:username", auth, (req, res, next) => {
  console.log("Deleting user with username ".blue + req.params.username)
  // Check if user who request is a moderator
  user.getModel().findOne({ username: req.user.username, deleted: false }).then(
    (u: User) => {
      if (u.hasModeratorRole()) {
        user.getModel().findOne({ username: req.params.username }).then((d) => {
          if (d.hasModeratorRole()) {
            console.log(`You cannot delete a mod`.red)
            return next({ statusCode: 401, errormessage:`You cannot delete a mod` })
          } else {
            for (let i = 0; i < d.friendList.length; i++) {
              user.getModel().findOne({ username: d.friendList[i].username }).then((u: User) => {
                let newFriendList: any = []
                for (let j = 0; j < u.friendList.length; j++) {
                  if (u.friendList[j].username != req.params.username) {
                    newFriendList.push(u.friendList[i])
                  }
                }
                u.friendList = newFriendList
                u.save().then(() => {
                  console.log("Removed player from friend")
                })
              })
            }

            d.deleteUser()
            d.save().then((data) => {
              console.log(data.username + " deleted".blue)

              return res.status(200).json({ error: false, errormessage: "" })
            }).catch((reason) => {
              console.log(`DB error: ${reason}`.red)
              return next({ statusCode: 401, errormessage:`DB error: ${reason}` })
            })
          }
        }).catch((reason) => {
          console.log(`DB error: ${reason}`.red)
          return next({ statusCode: 401, errormessage:`DB error: ${reason}` })
        })
      } else {
        console.log(`You cannot do it, you aren't a mod!`.red)
        return next({ statusCode: 401, errormessage:`You cannot do it, you aren't a mod!` })
      }
    }).catch((reason) => {
      console.log(`DB error: ${reason}`.red)
      return next({ statusCode: 401, errormessage:`DB error: ${reason}` })
    })
})

// This request allows the user to modify his profile. This is also used by moderators who must update the profile before they can browse the API.
app.put("/users", auth, (req, res, next) => {
  console.log("Update user information for ".blue + req.user.username)

  console.log("Request Body".blue)
  console.log(req.body)

  const doc = user.getModel().findOne({ username: req.user.username, deleted: false }).then((u: User) => {
    u.name = req.body.name ? req.body.name : u.name
    u.surname = req.body.surname ? req.body.surname : u.surname
    u.mail = req.body.mail ? req.body.mail : u.mail
    u.avatarImgURL = req.body.avatarImgURL ? req.body.avatarImgURL : u.avatarImgURL
    if (req.body.password) {
      if (req.body.oldpassword) {
        if (u.validatePassword(req.body.oldpassword)) {
          u.setPassword(req.body.password)
        } else {
          console.log(`Wrong password, you aren't allowed to do it`.red)
          return next({ statusCode: 401, errormessage:`Wrong password, you aren't allowed to do it` })
        }
      } else {
        console.log(`Old password is missing`.red)
        return next({ statusCode: 400, errormessage:`Old password is missing` })
      }
    }

    if (u.hasNonRegisteredModRole() && !(req.body.name && req.body.surname && req.body.mail && req.body.avatarImgURL && req.body.password)) {
      console.log(`Some field are missing`.red)
      return next({ statusCode: 400, errormessage:`Some field are missing` })
    }

    if (u.hasNonRegisteredModRole()) {
      console.log("Changing user role to moderator, now all operations are permitted".blue)
      u.setModerator()
    }

    u.save().then((data) => {
      ios.emit('updateUser', data)
      console.log("Data saved successfully".blue)
      return res.status(200).json({ error: false, errormessage: "" })
    }).catch((reason) => {
      console.log(`DB error: ${reason}`.red)
      return next({ statusCode: 401, error: true, errormessage: "DB error: " + reason.errmsg })
    })
  }).catch((reason) => {
    console.log(`DB error: ${reason}`.red)
    return next({ statusCode: 401, errormessage:`DB error: ${reason}` })
  })
})


// ---------------------------------------------------------------------------------------------------

// Getting the history of logged in user ranking, it is based on the ranking he had at the time of the game requests he made
app.get('/rankingstory', auth, (req, res, next) => {
  user.getModel().findOne({ username: req.user.username, deleted: false }).then((u: User) => {
    if (u.hasModeratorRole() || u.hasUserRole()) {
      getRankingList(req.user.username).then((matchmakingList) => {
        return res.status(200).json({ error: false, errormessage: "", matchmakingList: matchmakingList })
      })
    } else {
      console.log(`You cannot do it`.red)
      return next({ statusCode: 401, errormessage:'You cannot do it' })
    }
  }).catch((err) => {
    console.log(`DB error: ${err}`.red)
    return next({ statusCode: 401, errormessage:`DB error: ${err}` })
  })
})

// Getting the ranking history of the specified user 
app.get('/rankingstory/:username', auth, (req, res, next) => {
  user.getModel().findOne({ username: req.user.username, deleted: false }).then((u: User) => {
    if (u.hasModeratorRole() || u.hasUserRole()) {
      getRankingList(req.params.username).then((matchmakingList) => {
        return res.status(200).json({ error: false, errormessage: "", matchmakingList: matchmakingList })
      })
    } else {
      console.log(`You cannot do it`.red)
      return next({ statusCode: 401, errormessage:'You cannot do it' })
    }
  }).catch((err) => {
    console.log(`DB error: ${err}`.red)
    return next({ statusCode: 401, errormessage:`DB error: ${err}` })
  })
})


function getRankingList(username: string) {
  return notification.getModel().find({ deleted: true, sender: username, $or: [{ type: "randomMatchmaking" }, { type: "friendlyMatchmaking" }] }, 'ranking')
}

app.post('/game', auth, (req, res, next) => {
  if(!req.body.type){
    console.log("ERROR: Bad Request")
    return next({statusCode: 400, errormessage: "Bad Request"})
  }
  if (req.body.type == 'randomMatchmaking') {
    user.getModel().findOne({ username: req.user.username }).then((us: User) => {
      if(us.hasModeratorRole() || us.hasUserRole()){
        notification.getModel().find({ type: "randomMatchmaking", receiver: null, deleted: false }).then((nList) => {
          let n: Notification | undefined = undefined
          for (let i = 0; i < nList.length; i++) {
            let iter: Notification = nList[i]
            if (iter.ranking - us.statistics.ranking < 80) {
              n = iter
            } else { // prevent deadlock of user with high ranking
              iter.ranking -= 80
              iter.save()
            }
          }
          if (notification.isNotification(n)) {
            if (n != null && n.sender != us.username) {
              const randomMatch = createNewRandomMatch(n.sender, us.username)
              n.receiver = us.username
              randomMatch.save().then((data) => {
                console.log("Match has been created correctely".green);
              }).catch((reason) => {
                console.log("ERROR: match creation error \nDB error: ".red + reason)
                return next({ statusCode: 404, errormessage: "Match creation error"});
              })
              n.deleted = true
              n.inpending = false
              n.save().then((data) => {
                console.log("Game request has been updated correctely".green)
              }).catch((reason) => {
                console.log("ERROR: match request update error \nDB error: ".red + reason)
                return next({ statusCode: 404, errormessage: "Match request update error" });
              })
  
              let player1 = randomMatch.player1.toString()
              let player2 = randomMatch.player2.toString()
              let client1 = socketIOclients[player1]
              let client2 = socketIOclients[player2]
              client1.join(player1)
              client2.join(player1)
  
              client1.emit('gameReady', { 'gameReady': true, 'opponentPlayer': player2 })
              client2.emit('gameReady', { 'gameReady': true, 'opponentPlayer': player1 })
  
              if (randomMatch.player1.toString() == player1.toString()) {
                console.log("starts player1")
                let pl1Turn = JSON.stringify({ yourTurn: true })
                client1.emit('move', JSON.parse(pl1Turn))
                let pl2Turn = JSON.stringify({ yourTurn: false })
                client2.emit('move', JSON.parse(pl2Turn))
              } else {
                console.log("starts player2")
                let pl2Turn = JSON.stringify({ yourTurn: true })
                client2.emit('move', JSON.parse(pl2Turn))
                let pl1Turn = JSON.stringify({ yourTurn: false })
                client1.emit('move', JSON.parse(pl1Turn))
              }
              let watchersMessage = JSON.stringify({ playerTurn: randomMatch.player1.toString() })
              ios.to(randomMatch.player1.toString() + 'Watchers').emit('gameStatus', JSON.parse(watchersMessage))
  
              console.log("Match creation and game request update done".green)
              return res.status(200).json({ error: false, errormessage: "Match has been created correctely" })
            }
            else {
              console.log("Match request already exists".red);
              return next({ statusCode: 404, errormessage: "Match request already exists" });
            }
          } else {
            const doc = createNewGameRequest(req.body, us.username, us.statistics.ranking)
  
            doc.save().then((data) => {
              if (notification.isNotification(data)) {
                console.log("Notification creation done")
                return res.status(200).json({ error: false, message: "Match request has been created correctely" });
              }
            }).catch((reason) => {
              console.log("ERROR: random game request creation error \nDB error: ".red + reason)
              return next({ statusCode: 404, errormessage: "Random game request creation error" });
            })
          }
        }).catch((error) => {
          console.log("ERROR: DB error\n".red + error)
          return next({statusCode: 404, errormessage: "DB error"})          
        })
      }
      else{
        console.log("ERROR: Unauthorized".red)
        return next({ statusCode: 401, errormessage: "Unauthorized" })
      }
    }).catch((error) => {
      console.log("ERROR: DB error\n".red + error)
      return next({statusCode: 404, errormessage: "DB error"}) 
    })
  }
  else if (req.body.type == 'friendlyMatchmaking') {
    if(!req.body.oppositePlayer){
      console.log("ERROR: Bad Request")
      return next({statusCode: 400, errormessage: "Bad Request"})
    }
    user.getModel().findOne({ username: req.user.username }).then((us: User) => {
      if(us.hasModeratorRole() || us.hasUserRole()){
        notification.getModel().findOne({ type: "friendlyMatchmaking", sender: us.username, deleted: false }).then((n) => {
          if (!notification.isNotification(n)) {
            // Check if the opposite player is a friend
            user.getModel().findOne({ username: req.body.oppositePlayer }).then((friend) => {
              if (!us.isFriend(friend.username.toString())) {
                console.log("ERROR: opposite player is not a friend".red);
                return next({ statusCode: 404, errormessage: "The opposite player is not a friend" })
              }
  
              // Check if the opposite player is online
              if (!checkOnlineUser(friend.username)) {
                console.log("ERROR: opposite player is not online".red);
                return next({ statusCode: 404, errormessage: "The opposite player is not online" })
              }
  
              const doc = createNewGameRequest(req.body, us.username, us.statistics.ranking, friend.username)
  
              doc.save().then((data) => {
                // Check if friend is online
                if (socketIOclients[friend.username]) {
                  let friendMessage = JSON.stringify({ type: "friendlyGame", player: us.username.toString() })
                  socketIOclients[friend.username].emit("gameRequest", JSON.parse(friendMessage))
                  console.log("Creation of friendly game request done, player1 is: ".green + data.sender)
                  return res.status(200).json({ error: false, message: "Request sended to friend" });
                }
                else {
                  console.log("Opposite player is not online".green + data.sender)
                  return next({ statusCode: 404, errormessage: "The opposite player is not online" })
                }
              }).catch((reason) => {
                console.log("ERROR: friendly game request creation error \nDB error: ".red + reason)
                return next({ statusCode: 404, errormessage: "Friendly game request creation error" });
              })
            }).catch((error) => {
              console.log("ERROR: DB error\n".red + error);
              return next({statusCode: 404, errormessage: "DB error"})
            })
          }
          else {
            console.log("ERROR: friendly game request already exist".red);
            return next({statusCode:404, errormessage: "Friendly game request already exist"})
          }
        }).catch((error) => {
          console.log("ERROR: DB error\n" + error)
          return next({statusCode: 404, errormessage: "DB error"})
        })
      }
      else{
        console.log("ERROR: Unauthorized".red)
        return next({ statusCode: 401, errormessage: "Unauthorized" })
      }
    }).catch((error) => {
      console.log("ERROR: DB error\n".red + error)
      return next({statusCode: 404, errormessage: "DB error"}) 
    })
  }
  else if (req.body.type == 'watchGame') {
    if(!req.body.player){
      console.log("ERROR: Bad Request")
      return next({statusCode: 400, errormessage: "Bad Request"})
    }
    user.getModel().findOne({ username: req.user.username }).then((user: User) => {
      if (user.hasUserRole() || user.hasModeratorRole()) {
        match.getModel().findOne({ inProgress: true, $or: [{ player1: req.body.player }, { player2: req.body.player }] }).then((m: Match) => { // Si dovrebbe usare n.username
          if (m != null && match.isMatch(m)) {
            let client = null
            if (socketIOclients[user.username.toString()]){
              client = socketIOclients[user.username.toString()]
              client.join(m.player1.toString()+'Watchers')
              client.join(m.player1.toString())
            }
            else
              return next({ statusCode: 404, errormessage: "SocketIO client is not connected" })

            let watcherMessage = m.nTurns % 2 ? JSON.stringify({ playerTurn: m.player1.toString(), playground: m.playground }) : JSON.stringify({ playerTurn: m.player2.toString(), playground: m.playground })
            client.emit('enterGameWatchMode', JSON.parse(watcherMessage))
            return res.status(200).json({ error: false, message: "Match joined as observator" })
          }
          else {
            console.log("ERROR: the specified match does not exist".red)
            return next({ statusCode: 404, errormessage: "The specified match does not exist" })
          }
        }).catch((error) => {
          console.log("ERROR: DB error\n".red + error)
          return next({ statusCode: 404, errormessage: "DB error" })
        })
      }
      else {
        console.log("ERROR: Unauthorized".red)
        return next({ statusCode: 401, errormessage: "Unauthorized" })
      }
    }).catch((error) => {
      console.log("ERROR: DB error\n".red + error)
      return next({ statusCode: 404, errormessage: "DB error" })
    })
  }
  else {
    console.log("ERROR: invalid request".red)
    return next({ statusCode: 400, errormessage: "Invalid request" })
  }
})

app.put('/game', auth, (req, res, next) => {
  if(req.body.accept === undefined || !req.body.sender){
    console.log("ERROR: Bad Request")
    return next({statusCode: 400, errormessage: "Bad Request"})
  }
  user.getModel().findOne({ username: req.user.username }).then((user: User) => {
    if(user.hasModeratorRole() || user.hasUserRole()){
      notification.getModel().findOne({ type: "friendlyMatchmaking", receiver: user.username.toString(), deleted: false, sender: req.body.sender }).then((n) => {
        if (n != null && n.sender != user.username) {
          if (req.body.accept === true) {
            const randomMatch = createNewRandomMatch(n.sender, n.receiver)
            randomMatch.save().then((data) => {
              console.log("Match has been created correctely".green)
            }).catch((reason) => {
              console.log("ERROR: match creation error \nDB error: ".red + reason)
              next({ statusCode: 404, errormessage: "Match creation error" });
            })
            n.deleted = true
            n.inpending = false
            n.save().then((data) => {
              console.log("Game request has been updated correctely".green)
            }).catch((reason) => {
              console.log("ERROR: match request update error \nDB error: ".red + reason)
              return next({ statusCode: 404, errormessage: "Match request update error" });
            })
  
            let player1 = randomMatch.player1.toString()
            let player2 = randomMatch.player2.toString()
            let client1 = socketIOclients[player1]
            let client2 = socketIOclients[player2]
            client1.join(player1)
            client2.join(player1)
  
            client1.emit('gameReady', { 'gameReady': true, 'opponentPlayer': player2 })
            client2.emit('gameReady', { 'gameReady': true, 'opponentPlayer': player1 })
  
  
            if (randomMatch.player1.toString() == player1.toString()) {
              console.log("starts player1")
              let pl1Turn = JSON.stringify({ yourTurn: true })
              client1.emit('move', JSON.parse(pl1Turn))
              let pl2Turn = JSON.stringify({ yourTurn: false })
              client2.emit('move', JSON.parse(pl2Turn))
            } else {
              console.log("starts player2")
              let pl2Turn = JSON.stringify({ yourTurn: true })
              client2.emit('move', JSON.parse(pl2Turn))
              let pl1Turn = JSON.stringify({ yourTurn: false })
              client1.emit('move', JSON.parse(pl1Turn))
            }
  
            let watchersMessage = JSON.stringify({ playerTurn: randomMatch.player1.toString() })
            ios.to(randomMatch.player1.toString() + 'Watchers').emit('gameStatus', JSON.parse(watchersMessage))
  
            console.log("Match creation and game request update done".green)
            return res.status(200).json({ error: false, message: "Match has been created correctely" })
          }
          else {
            n.inpending = false
            n.deleted = true
            n.save().then((data) => {
              console.log("Game request has been updated correctely".green)
              if (socketIOclients[n.sender.toString()]) {
                socketIOclients[n.sender.toString()].emit("gameReady", { "gameReady": false, "message": "Request refused" })
              }
              return res.status(200).json({ error: false, message: "Request refused" })
            }).catch((reason) => {
              console.log("ERROR: match request update error \nDB error: ".red + reason)
              return next({ statusCode: 404, errormessage: "Match request update error" });
            })
          }
        }
        else {
          console.log("ERROR: Match request does not exists".red);
          return next({ statusCode: 404, errormessage: "Match request does not exists" });
        }
      }).catch((error) => {
        console.log("ERROR: DB error".red + error)
        return next({statusCode: 404, errormessage: "DB error"})
      })
    }
    else{
      console.log("ERROR: Unauthorized".red)
      return next({ statusCode: 401, errormessage: "Unauthorized" })
    }
  }).catch((error) => {
    console.log("ERROR: DB error".red + error)
    return next({statusCode: 404, errormessage: "DB error"})
  })
})

app.delete('/game', auth, (req, res, next) => {
  user.getModel().findOne({ username: req.user.username }).then((user: User) => {
    if (user.hasModeratorRole() || user.hasUserRole()) {
      match.getModel().findOne({ $or: [{ player1: user.username.toString() }, { player2: user.username.toString() }], inProgress: true }).then((match) => {
        if (match != null) {
          match.inProgress = false
          match.winner = user.username.toString() === match.player1.toString() ? match.player2.toString() : match.player1.toString()
          match.save().then((data) => {
            let message = user.username.toString() == match.player1.toString() ? JSON.stringify({ winner: match.player2.toString(), message: "Opposite player have left the game" }) : JSON.stringify({ winner: match.player1.toString(), message: "Opposite player have left the game" })
            if (data.player2.toString() != "cpu") {
              if (socketIOclients[user.username.toString()]) {
                socketIOclients[user.username.toString()].broadcast.to(match.player1).emit('result', JSON.parse(message))
              }
            }
            else {
              socketIOclients[user.username.toString()].broadcast.to(match.player1 + 'Watchers').emit('result', JSON.parse(message))
            }
            console.log("The match has been deleted correctely".green)
            return res.status(200).json({ error: false, message: "The match has been deleted correctely" })
          }).catch((reason) => {
            console.log("ERROR: match cancellation error \nDB error: ".red + reason)
            return next({ statusCode: 404, errormessage: "Match cancellation error" })
          })
        }
        else {
          // Se non esiste un match, allora si annulla la richiesta del match
          notification.getModel().findOne({ $or: [{type: 'randomMatchmaking'}, {type: 'friendlyMatchmaking'}], sender: user.username.toString(), deleted: false }).then((notification) => {
            if (notification != null) {
              notification.deleted = true
              notification.save().then((data) => {
                console.log("The match request has been deleted correctely".green)
                return res.status(200).json({ error: false, message: "The match request has been deleted correctely" })
              }).catch((reason) => {
                console.log("ERROR: notification cancellation error \nDB error: ".red + reason)
                return next({ statusCode: 404, errormessage: "Notification cancellation error" })
              })
            }
            else {
              console.log("ERROR: Match request does not exist".red)
              return next({ statusCode: 404, errormessage: "Match request does not exists" })
            }
          }).catch((error) => {
            console.log("ERROR: DB error".red + error)
            return next({statusCode: 404, errormessage: "DB error"})
          })
        }
      }).catch((error) => {
        console.log("ERROR: DB error".red + error)
        return next({statusCode: 404, errormessage: "DB error"})
      })
    }
    else {
      console.log("ERROR: Unauthorized".red)
      return next({ statusCode: 401, errormessage: "Unauthorized" })
    }
  }).catch((error) => {
    console.log("ERROR: DB error".red + error)
    return next({statusCode: 404, errormessage: "DB error"})
  })
})

app.get('/game', auth, (req, res, next) => {
  user.getModel().findOne({ username: req.user.username }).then((user: User) => {
    if (user.hasModeratorRole() || user.hasUserRole()) {
      match.getModel().find({ inProgress: true, winner: null }).then((matches) => {
        console.log("Matches obtained".green);
        return res.status(200).json({ error: false, matches: matches })
      }).catch((reason) => {
        console.log("ERROR: error getting matches \nDB error: ".red + reason)
        return next({ statusCode: 404, errormessage: "Error getting matches" })
      })
    }
    else {
      console.log("ERROR: Unauthorized".red)
      return next({ statusCode: 404, errormessage: "Unauthorized" })
    }
  }).catch((error) => {
    console.log("ERROR: DB error".red + error)
    return next({statusCode: 404, errormessage: "DB error"})
  })
})

function checkOnlineUser(username) {
  return socketIOclients[username] ? true : false
}

// Create game against AI
app.post('/game/cpu', auth, (req, res, next) => {
  let player = req.user.username
  user.getModel().findOne({ username: player }).then((u: User) => {
    if (!(u.hasModeratorRole() || u.hasUserRole())) {
      return next({ statusCode: 403, errormessage: "Unauthorized" })
    }
    const model = match.getModel()
    const doc = new model({
      inProgress: true,
      player1: player,
      player2: "cpu",
      winner: null,
      playground: createPlayground(),
      chat: new Array(),
      nTurns: 1
    })

    doc.save().then((m) => {
      try {
        let client = socketIOclients[u.username.toString()]
        client.join(u.username.toString())
        console.log("Client joined the room ".green + u.username.toString());
      }
      catch (error) {
        console.log("Socket.Io error".red + error)
        return next({ statusCode: 404, errormessage: "Socket.IO error" })
      }
      console.log(`Single player match has been created`.green)
      return res.status(200).json({ error: false, errormessage: "Single player match has been created" })
    }).catch((error) => {
      console.log("ERROR: Match saving error\nDB ERROR: ".red + error)
      return next({ statusCode: 404, errormessage: "Match saving error" })
    })
  }).catch((error) => {
    console.log("ERROR: DB error\n".red + error)
    return next({ statusCode: 404, errormessage: "DB error" })
  })
})

// Ask AI which move is the best one
app.get('/move', auth, (req, res, next) => {
  let username = req.user.username
  user.getModel().findOne({ username: username }).then((u: User) => {
    if (!(u.hasModeratorRole() || u.hasUserRole())) {
      console.log(`You cannot do it`.red)
      return next({ statusCode: 403, errormessage: "You cannot do it" })
    }

    if (u.statistics.ranking < 100) {
      console.log(`You have to improve your ranking before doing that!`.red)
      return next({ statusCode: 403, errormessage: "You have to improve your ranking before doing that!" })
    }

    match.getModel().findOne({ inProgress: true, $or: [{ player1: username }, { player2: username }] }).then((m) => {
      if (match.isMatch(m)) {
        if (m.player1.toString() == username) {
          return res.status(200).json({ error: false, errormessage: "", move: CPU.minmax(m.playground, 5, -Infinity, Infinity, false, 'O', 'X') })
        } else {
          return res.status(200).json({ error: false, errormessage: "", move: CPU.minmax(m.playground, 5, -Infinity, Infinity, false, 'X', 'O') })
        }
      } else {
        console.log(`Match not found`.red)
        return next({statusCode: 404, errormessage: `Match not found` })
      }
    }).catch((error) => {
      console.log("ERROR: DB error\n".red + error)
      return next({ statusCode: 401, errormessage: "DB error" })
    })
  }).catch((err) => {
    console.log(`DB error: ${err}`.red)
    return next({statusCode: 401, errormessage: `DB error: ${err}` })
  })
})

// Playing against AI
app.post('/move/cpu', auth, (req, res, next) => {
  let move = req.body.move

  user.getModel().findOne({ username: req.user.username }).then((u: User) => {
    if (!(u.hasModeratorRole() || u.hasUserRole())) {
      console.log(`You cannot do it`.red)
      return next({ statusCode: 403, errormessage: "Unauthorized" })
    }

    if (move == undefined) {
      console.log(`Incorrectly formed request`.red)
      return next({ statusCode: 401, errormessage: "Incorrectly formed request" })
    }

    match.getModel().findOne({ player1: req.user.username, player2: "cpu", inProgress: true }).then((m) => {
      if (match.isMatch(m)) {
        let client = socketIOclients[req.user.username]
        let index = parseInt(move)

        if (index >= 0 && index <= 6) {
          if (m.playground[5][index] == '/') {
            m.playground = insertMove(m.playground, index, 'X')

            m.nTurns += 2

            let winner: string = undefined

            m.save().then((data) => {
              let watchersMessage = JSON.stringify({ player: m.player1.toString(), move: index, nextTurn: 'cpu' })
              client.broadcast.to(`${m.player1}Watchers`).emit('gameStatus', JSON.parse(watchersMessage))

              console.log(`Playground updated`.green)

              if (checkWinner(m.playground, 'X')) {
                winnerControl(client, m, m.player1, m.player2)
                winner = m.player1
              }

              let fullCheck = false
              for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 7; j++) {
                  if (m.playground[i][j] == '/') {
                    fullCheck = true
                  }
                }
              }
              if (!fullCheck) {
                let drawnMessage = JSON.stringify({ "winner": null })
                client.broadcast.to(m.player1).emit('result', JSON.parse(drawnMessage))
                client.emit('result', JSON.parse(drawnMessage))
                return res.status(200).json({ error: false, errormessage: "The match ends in a draw" })
              }

              // Minmax AI, with depth adjustable from 2 to 7
              let depth = req.body.difficulty
              if (depth == undefined) {
                depth = 4 // Default difficulty
              }
              let cpuInfo = CPU.minmax(data.playground, depth, -Infinity, Infinity, true, 'X', 'O')

              data.playground = insertMove(data.playground, cpuInfo[0], 'O')

              watchersMessage = JSON.stringify({ player: 'cpu', move: cpuInfo[0], nextTurn: m.player1.toString() })
              client.broadcast.to(`${m.player1}Watchers`).emit('gameStatus', JSON.parse(watchersMessage))

              if (checkWinner(data.playground, 'O')) {
                winnerControl(client, m, m.player1, m.player2)
                winner = "Cpu"
              }

              fullCheck = false
              for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 7; j++) {
                  if (data.playground[i][j] == '/') {
                    fullCheck = true
                  }
                }
              }
              if (!fullCheck) {
                let drawnMessage = JSON.stringify({ "winner": null })
                client.broadcast.to(m.player1).emit('result', JSON.parse(drawnMessage))
                client.emit('result', JSON.parse(drawnMessage))
                return res.status(200).json({ error: false, errormessage: "The match ends in a draw" })
              }

              let returnObj: any = { error: false, errormessage: "Correctly added move", cpu: cpuInfo[0] }

              if (winner != undefined) {
                returnObj.winner = `${winner}`

                let watchersMessage = JSON.stringify({ winner: winner })
                client.broadcast.to(`${m.player1}Watchers`).emit('result', JSON.parse(watchersMessage))
              }

              data.save().then((mm) => {
                return res.status(200).json(returnObj)
              })
            })
          } else {
            console.log(`You cannot insert in a full column`.red)
            return next({statusCode: 400, errormessage: "You cannot insert in a full column" })
          }
        } else {
          console.log(`You cannot insert out of the playground`.red)
          return next({statusCode: 400, errormessage: "You cannot insert out of the playground" })
        }
      } else {
        console.log(`Match cannot found, please start a new one`.red)
        return next({statusCode: 404, errormessage: "Match cannot found, please start a new one" })
      }
    }).catch((err) => {
      console.log(`DB error: ${err}`.red)
      return next({statusCode: 401, errormessage: `DB error: ${err}` })
    })
  }).catch((error) => {
    console.log("ERROR: DB error\n".red + error)
    return next({ statusCode: 401, errormessage: "DB error" })
  })
})

// Play the turn making a move 
app.post("/move", auth, (req, res, next) => {
  let username = req.user.username
  let move = req.body.move

  user.getModel().findOne({ username: username }).then((u: User) => {
    if (u.hasModeratorRole() || u.hasUserRole()) {
      if (!move) {
        console.log(`Bad request, you should pass your move`.red)
        return next({ statusCode: 400, errormessage: "Bad request, you should pass your move" })
      }

      match.getModel().findOne({ inProgress: true, $or: [{ player1: username }, { player2: username }] }).then((m) => {
        if (m) {
          if (match.isMatch(m)) {            
            let client = socketIOclients[username]
            let index = parseInt(move)
            // post move logic
            if (m.nTurns % 2 == 1 && m.player1 == username) {
              return makeMove(index, m, client, 'X', m.player2, res, username)
            } else if (m.nTurns % 2 == 0 && m.player2 == username) {
              return makeMove(index, m, client, 'O', m.player1, res, username)
            } else { // trying to post move out of right turn
              let errorMessage = JSON.stringify({ "error": true, "codeError": 3, "errorMessage": "Wrong turn" })
              client.emit('move', JSON.parse(errorMessage))
              console.log(`Wrong turn`.red)
              return next({ statusCode: 400, errormessage: "Wrong turn" })
            }
          }
        } else {
          console.log("Match does not exists".red)
          return next({ statusCode: 404, errormessage: "Match does not exists" })
        }
      })
    } else {
      console.log(`You cannot do it`.red)
      return next({ statusCode: 403, errormessage: "You cannot do it" })
    }
  }).catch((error) => {
    console.log("ERROR: DB error".red + error)
    return next({statusCode: 404, errormessage: "DB error"})
  })
})

app.post('/gameMessage', auth, (req, res, next) => {
  if(!req.body.player || !req.body.message){
    console.log("ERROR: Bad Request")
    return next({statusCode: 400, errormessage: "Bad Request"})
  }
  user.getModel().findOne({ username: req.user.username }).then((u: User) => {
    if (u.hasUserRole() || u.hasModeratorRole()) {
      user.getModel().findOne({ username: req.body.player }).then((player: User) => {
        match.getModel().findOne({ inProgress: true, $or: [{ player1: player.username.toString() }, { player2: player.username.toString() }] }).then((m) => {
          if (m != null && match.isMatch(m)) {
            if (((u.username.toString() == m.player1.toString() || u.username.toString() == m.player2.toString()) && socketIOclients[u.username.toString()].rooms.has(m.player1.toString())) || ((u.username.toString() != m.player1.toString() && u.username.toString() != m.player2.toString()) && (socketIOclients[u.username.toString()].rooms.has(m.player1.toString()) && socketIOclients[u.username.toString()].rooms.has(m.player1.toString() + 'Watchers')))) {
              let client = null
              if (socketIOclients[u.username.toString()])
                client = socketIOclients[u.username.toString()]
              else
                return next({ statusCode: 404, errormessage: "SocketIO client is not connected" })

              let newMessage = createChatMessage(u.username.toString(), req.body.message)

              if (u.username == m.player1.toString() || u.username == m.player2.toString()) {
                client.broadcast.to(m.player1).emit('gameChat', newMessage)
              }
              else {
                client.broadcast.to(m.player1 + 'Watchers').emit('gameChat', newMessage)
              }
              m.updateOne({ $push: { chat: newMessage } }).then((data) => {
                console.log("Message have been send and saved correctely".green);
                return res.status(200).json({ error: false, message: "Message have been send and saved correctely" });
              }).catch((reason) => {
                console.log("ERROR: send message error\nDB error: ".red + reason)
                return next({ statusCode: 404, errormessage: "Send message error" })
              })
            }
            else {
              console.log("ERROR: SocketIO client is not in the match room".red)
              return next({ statusCode: 404, errormessage: "SocketIO client is not in the match room" })
            }
          }
          else {
            console.log("ERROR: match not found".red)
            return next({ statusCode: 404, errormessage: "Match not found" })
          }
        }).catch((error) => {
          console.log("ERROR: DB error".red + error)
          return next({statusCode: 404, errormessage: "DB error"})
        })
      }).catch((error) => {
        console.log("ERROR: DB error".red + error)
        return next({statusCode: 404, errormessage: "DB error"})
      })
    }
    else {
      console.log("ERROR: Unauthorized".red)
      return next({ statusCode: 404, errormessage: "Unauthorized" })
    }
  }).catch((error) => {
    console.log("ERROR: DB error".red + error)
    return next({statusCode: 404, errormessage: "DB error"})
  })
})

// Create a new friend request
app.post('/notification', auth, (req, res, next) => {
  if(!req.body.receiver || !req.body.type){
    console.log("ERROR: Bad Request")
    return next({statusCode: 400, errormessage: "Bad Request"})
  }
  user.getModel().findOne({ username: req.user.username }).then((u: User) => {
    if (u.hasModeratorRole() || u.hasUserRole()) {
      if (req.body.type === "friendRequest") {
        user.getModel().findOne({ username: req.body.receiver }).then((receiver: User) => {
          if (receiver != null) {
            if (receiver.isFriend(u.username.toString())) {
              console.log("ERROR: You are already friend".red)
              return next({ statusCode: 404, errormessage: "You are already friend" })
            }
            else {
              notification.getModel().findOne({ type: "friendRequest", $or: [{sender: u.username, receiver: receiver.username.toString()}, {sender: receiver.username.toString(), receiver: u.username}], deleted: false }).then((n) => {//? Come decido se poter rimandare o no la richiesta?
                if (n !== null) {
                  console.log("ERROR: Request already exist".red)
                  return next({ statusCode: 404, errormessage: "Request already exist" })
                } else {
                  const fr = createNewFriendRequest("friendRequest", u.username, receiver.username.toString())
                  fr.save().then((data) => {
                    if (socketIOclients[receiver.username.toString()]) {
                      let receiverMessage = JSON.stringify({ sender: u.username.toString(), type: "friendRequest" })
                      socketIOclients[receiver.username.toString()].emit('newNotification', JSON.parse(receiverMessage))
                    }
                    return res.status(200).json({ error: false, message: "Request forwarded" })
                  }).catch((reason) => {
                    console.log("ERROR: Notification creation error\nDB ERROR: ".red + reason)
                    return next({ statusCode: 404, errormessage: "Notification creation error" });
                  })
                }
              }).catch((error) => {
                console.log("ERROR: DB error".red + error)
                return next({statusCode: 404, errormessage: "DB error"})
              })
            }
          }
          else {
            console.log("ERROR: Specified user does not exist".red)
            return next({ statusCode: 404, errormessage: "Specified user does not exist" })
          }
        }).catch((error) => {
          console.log("ERROR: DB error".red + error)
          return next({statusCode: 404, errormessage: "DB error"})
        })
      }
      else {
        console.log("ERROR: Type of the notification not accepted")
        return next({ statusCode: 404, errormessage: "Type of the notification not accepted" });
      }
    }
    else {
      console.log("ERROR: Unauthorized".red)
      return next({ statusCode: 404, errormessage: "Unauthorized" })
    }
  }).catch((error) => {
    console.log("ERROR: DB error".red + error)
    return next({statusCode: 404, errormessage: "DB error"})
  })
})

// Return all the notification of the specified user (no messages)
// Returns all the notification that the user have received and that are not read yet
app.get('/notification', auth, (req, res, next) => {
  user.getModel().findOne({ username: req.user.username }).then((u: User) => {
    if (u.hasModeratorRole() || u.hasUserRole()) {
      let inpending: boolean = req.query.inpending
      let makeNotificationRead = req.query.makeNotificationRead
      let query = notification.getModel().find({ receiver: u.username.toString(), deleted: false, inpending: inpending })
      if (inpending == undefined) {
        query = notification.getModel().find({ receiver: u.username.toString(), deleted: false })
      }
      query.then((n) => {
        if (makeNotificationRead == "true") {
          notification.getModel().updateMany({ receiver: u.username.toString(), deleted: false }, { inpending: false }, {}, (err, result) => {
            if (err) {
              console.log(`Error updating inpending notification: ${err}`.red)
              return next({ statusCode: 404, errormessage: `DB error: ${err}`})
            } else {
              console.log(`Mark notification as read`.green)
            }
          })
        }
        return res.status(200).json({ error: false, notification: n });
      }).catch((reason) => {
        console.log(`DB error: ${reason}`.red)
        return next({ statusCode: 404, errormessage: "DB error: " + reason });
      })
    }
    else{
      console.log("ERROR: Unauthorized".red)
      return next({statusCode: 401, errormessage: "Unauthorized"})
    }
  }).catch((error) => {
    console.log("ERROR: DB error".red + error)
    return next({statusCode: 404, errormessage: "DB error"})
  })
})

// When a client read a notification, when he open it then it send this request in order to inform the server that the notification has been
// read and it must be updated in the server
app.put('/notification', auth, (req, res, next) => {
  //The user accept or decline a friendRequest
  if(req.body.accepted == undefined || !req.body.sender){
    console.log("ERROR: Bad Request".red)
    return next({statusCode: 400, errormessage: "Bad Request"})
  }
  user.getModel().findOne({ username: req.user.username }).then((u: User) => {
    if (u.hasModeratorRole() || u.hasUserRole()) {
      user.getModel().findOne({ username: req.body.sender }).then((sender) => {
        if (sender.hasModeratorRole() || sender.hasUserRole()) {
          notification.getModel().findOne({ type: "friendRequest", sender: sender.username, deleted: false }).then((n) => {
            if (n === null) {
              console.log("ERROR: Notification does not exist".red)
              return next({ statusCode: 404, errormessage: "Notification does not exist" })
            } else {
              n.inpending = false
              n.deleted = true
              if (req.body.accepted === true) {
                u.addFriend(sender.username.toString(), false)
                u.save().then((data) => {
                  sender.addFriend(u.username.toString(), false)
                  sender.save().then((data) => {
                    console.log("New friend saved".green);
                  }).catch((reason) => {
                    console.log("ERROR: Friend addition error\nDB ERROR: " + reason)
                    return next({ statusCode: 404, errormessage: "Friend addition error" })
                  })
                  if (socketIOclients[sender.username.toString()]) {
                    let senderMessage = JSON.stringify({ newFriend: u.username.toString() })
                    socketIOclients[sender.username.toString()].emit('request', JSON.parse(senderMessage))
                  }
                }).catch((reason) => {
                  console.log("ERROR: Friend addition error\nDB ERROR: " + reason)
                  return next({ statusCode: 404, errormessage: "Friend addition error" })
                })
              }
              else {
                if (socketIOclients[sender.username.toString()]) {
                  let senderMessage = JSON.stringify({ newFriend: null })
                  socketIOclients[sender.username.toString()].emit('request', JSON.parse(senderMessage))
                }
              }
              n.save().then((data) => {
                console.log("Data saved successfully".blue)
                return res.status(200).json({ error: false, errormessage: "Data saved successfully" })
              }).catch((reason) => {
                console.log("ERROR: Notification update error\nDB ERROR: " + reason)
                return next({ statusCode: 404, errormessage: "Notification update error" })
              })
            }
          }).catch((error) => {
            console.log("ERROR: DB error".red + error)
            return next({statusCode: 404, errormessage: "DB error"})
          })
        }
        else {
          console.log("ERROR: Unauthorized".red)
          return next({statusCode: 404, errormessage: "Unauthorized"})
        }
      }).catch((error) => {
        console.log("ERROR: DB error".red + error)
        return next({statusCode: 404, errormessage: "DB error"})
      })
    }
    else {
      console.log("ERROR: Unauthorized".red)
      return next({statusCode: 401, errormessage: "Unauthorized"})
    }
  }).catch((error) => {
    console.log("ERROR: DB error".red + error)
    return next({statusCode: 404, errormessage: "DB error"})
  })
})

app.delete('/friend/:username', auth, (req, res, next) => {
  let friend = req.params.username
  if (!friend) {
    console.log("ERROR: Bad Request".red)
    return next({statusCode: 400, errormessage: "Bad Request"})
  }
  user.getModel().findOne({ username: req.user.username }).then((u: User) => {
    if (u.hasModeratorRole() || u.hasUserRole()) {
      user.getModel().findOne({ username: friend }).then((friend: User) => {
        if (u.isFriend(friend.username.toString())) {
          u.deleteFriend(friend.username.toString())
          u.save().then((data) => {
            friend.deleteFriend(u.username.toString());
            friend.save().then((data) => {
              console.log("Friend deleted.".blue)
              // ios.emit('friend', { user: [req.user.username, friend], deleted: true })
              if (socketIOclients[friend.username.toString()]) {
                let senderMessage = JSON.stringify({ deletedFriend: u.username.toString() })
                socketIOclients[friend.username.toString()].emit('friendDeleted', JSON.parse(senderMessage))
              }
              return res.status(200).json({ error: false, errormessage: "Friend removed" })
            }).catch((reason) => {
              console.log("ERROR: DB error".red)
              return next({statusCode: 404, errormessage: "DB error"})
            })
          }).catch((reason) => {
            console.log("ERROR: DB error".red)
            return next({statusCode: 404, errormessage: "DB error"})
          })
        }
        else{
          console.log("ERROR: The user is not friend".red)
          return next({statusCode: 404, errormessage: "The user is not friend"})
        }
      }).catch((error) => {
        console.log("ERROR: DB error".red + error)
        return next({statusCode: 404, errormessage: "DB error"})
      })
    }
    else{
      console.log("ERROR: Unauthorized".red)
      return next({statusCode: 401, errormessage: "Unauthorized"})
    }
  }).catch((error) => {
    console.log("ERROR: DB error".red + error)
    return next({statusCode: 404, errormessage: "DB error"})
  })
})

app.put('/friend', auth, (req, res, next) => {
  if(!req.body.username || req.body.isBlocked == undefined){
    console.log("ERROR: Bad Request".red)
    return next({statusCode: 400, errormessage: "Bad Request"})
  }
  user.getModel().findOne({ username: req.user.username }).then((u: User) => {
    if (u.hasModeratorRole() || u.hasUserRole()) {
      user.getModel().findOne({ username: req.body.username }).then((friend: User) => {
        u.setIsBlocked(friend.username.toString(), req.body.isBlocked)
        u.save().then((data) => {
          if (req.body.isBlocked) {
            console.log("Friend blocked".green)
            if (socketIOclients[friend.username.toString()]) {
              let isBeingBlocked = JSON.stringify({ blocked: true })
              socketIOclients[friend.username.toString()].emit('friendBlocked', JSON.parse(isBeingBlocked))
            }
            return res.status(200).json({ error: false, errormessage: "User blocked" })
          } else {
            console.log("Friend unblocked.".green)
            if (socketIOclients[friend.username.toString()]) {
              let isBeingBlocked = JSON.stringify({ blocked: false })
              socketIOclients[friend.username.toString()].emit('friendBlocked', JSON.parse(isBeingBlocked))
            }
            return res.status(200).json({ error: false, errormessage: "User unblocked" })
          }
        }).catch((error) => {
          console.log("ERROR: DB error".red + error)
          return next({statusCode: 404, errormessage: "DB error"})
        })
      }).catch((error) => {
        console.log("ERROR: DB error".red + error)
        return next({statusCode: 404, errormessage: "DB error"})
      })
    }
    else{
      console.log("ERROR: Unauthorized".red)
      return next({statusCode: 401, errormessage: "Unauthorized"})
    }
  }).catch((error) => {
    console.log("ERROR: DB error".red + error)
    return next({statusCode: 404, errormessage: "DB error"})
  })
})

app.get('/friend', auth, (req, res, next) => {
  user.getModel().findOne({ username: req.user.username }).then((u: User) => {
    if (u.hasModeratorRole() || u.hasUserRole()) {
      return res.status(200).json({ error: false, errormessage: "", friendlist: u.friendList });
    }
    else{
      console.log("ERROR: Unauthorized".red)
      return next({statusCode: 401, errormessage: "Unauthorized"})
    }
  }).catch((error) => {
    console.log("ERROR: DB error".red + error)
    return next({statusCode: 404, errormessage: "DB error"})
  })
})

// Returns all the messages
app.get('/message', auth, (req, res, next) => {

  let modmessage = undefined
  if (req.query && req.query.ModMessage == 'true') {
    modmessage = true
  }

  user.getModel().findOne({ username: req.user.username }).then((user: User) => {
    if (user.hasModeratorRole() || user.hasUserRole()) {
      message.getModel().find({ isAModMessage: modmessage, receiver: user.username.toString(), inpending: true }).then((inPendingMessages) => {
        message.getModel().find({ isAModMessage: modmessage, $or: [{ sender: user.username.toString() }, { receiver: user.username.toString() }] }).then((allMessages) => {
          return res.status(200).json({ error: false, inPendingMessages: inPendingMessages, allMessages: allMessages });
        }).catch((reason) => {
          console.log("ERROR: Error getting messages from DB\nDB error: " + reason)
          return next({ statusCode: 404, errormessage: "Error getting messages from DB"})
        })
      }).catch((reason) => {
        console.log("ERROR: Error getting messages from DB\nDB error: " + reason)
        return next({ statusCode: 404, errormessage: "Error getting messages from DB"})
      })
    }
    else {
      console.log("ERROR: Unauthorized".red)
      return next({ statusCode: 404, errormessage: "Unauthorized" })
    }
  }).catch((error) => {
    console.log("ERROR: DB error".red + error)
    return next({statusCode: 404, errormessage: "DB error"})
  })
})

// Send a message to a specif user that is in your friendlist
app.post('/message', auth, (req, res, next) => {
  if(!req.body.message || !req.body.receiver){
    console.log("ERROR: Bad Request".red)
    return next({statusCode: 400, errormessage: "Bad Request"})
  }
  user.getModel().findOne({ username: req.user.username }).then((sender: User) => {
    if (sender.hasUserRole() || sender.hasModeratorRole()) {
      user.getModel().findOne({ username: req.body.receiver }).then((receiver: User) => {
        if (receiver != null) {
          if (sender.isFriend(receiver.username) || sender.hasModeratorRole()) {
            let m = createMessage(sender.username.toString(), receiver.username.toString(), req.body.message)
            m.save().then((data) => {
              console.log("Message has been saved correctely: ".green + data)
              if (socketIOclients[receiver.username.toString()]) {
                socketIOclients[receiver.username.toString()].emit('message', data)
              }
              return res.status(200).json({ error: false, errormessage: "Message has been saved correctely" })
            }).catch((reason) => {
              console.log("ERROR: message creation error\nDB ERROR: " + reason);
              return next({ statusCode: 404, errormessage: "Message creation error" })
            })
          }
          else {
            console.log("ERROR: The user is not a friend".red)
            return next({ statusCode: 404, errormessage: "The user is not a friend" })
          }
        }
        else {
          console.log("ERROR: The user does not exist".red)
          return next({ statusCode: 404, errormessage: "The user does not exist" })
        }
      }).catch((error) => {
        console.log("ERROR: DB error".red + error)
        return next({statusCode: 404, errormessage: "DB error"})
      })
    }
    else {
      console.log("ERROR: Unauthorized".red)
      return next({ statusCode: 401, errormessage: "Unauthorized" })
    }
  }).catch((error) => {
    console.log("ERROR: DB error".red + error)
    return next({statusCode: 404, errormessage: "DB error"})
  })
})

// Send a message to a specif user, receiver or sender must be moderator
app.post('/message/mod', auth, (req, res, next) => {
  if (req.body.receiver == undefined || req.body.message == undefined) {
    return next({ statusCode: 400, errormessage: 'You should send receiver and message body' })
  }
  let rec = req.body.receiver
  let message = req.body.message
  user.getModel().findOne({ username: req.user.username }).then((sender: User) => {
    user.getModel().findOne({ username: rec }).then((receiver: User) => {
      if (sender != null && receiver != null && (sender.hasModeratorRole() || receiver.hasModeratorRole())) {
        let msg = createMessage(sender.username.toString(), receiver.username.toString(), message)
        msg.isAModMessage = true
        msg.save().then((savedMsg) => {
          console.log("Message from admin has been saved correctely: ".green + savedMsg)
          if (socketIOclients[receiver.username.toString()]) {
            socketIOclients[receiver.username.toString()].emit('message', savedMsg)
          }
          return res.status(200).json({ error: false, errormessage: "Message from admin has been saved correctely" })
        }).catch((error) => {
          console.log("ERROR: Message creation error\nDB error : " + error)
          return next({ statusCode: 404, errormessage: "Message creation error" })
        })
      } else {
        console.log("ERROR: The user is not a friend".red)
        return next({ statusCode: 404, errormessage: "The user is not a friend" })
      }
    }).catch((e) => {
      console.log("ERROR: The user does not exist".red)
      return next({ statusCode: 404, errormessage: "The user does not exist" })
    })
  }).catch((e) => {
    console.log("ERROR: Unauthorized".red)
    return next({ statusCode: 401, errormessage: "Unauthorized" })
  })
})

// Update the non-read messages into read messages
app.put('/message', auth, (req, res, next) => {

  if (!req.body.sender) {
    return next({ statusCode: 400, errormessage: "Bad Request" })
  }

  let modMessage = req.body.modMessage

  user.getModel().findOne({ username: req.user.username }).then((user: User) => {
    if (user.hasUserRole() || user.hasModeratorRole()) {
      let query
      if (modMessage == undefined) {
        query = message.getModel().find({ receiver: req.user.username, sender: req.body.sender, inpending: true })
      } else if (modMessage) {
        query = message.getModel().find({ receiver: req.user.username, sender: req.body.sender, inpending: true, isAModMessage: true })
      } else {
        query = message.getModel().find({ receiver: req.user.username, sender: req.body.sender, inpending: true, $or: [{ isAModMessage: false }, { isAModMessage: undefined }] })
      }

      query.then((m) => {
        if (m) {
          m.forEach((message) => {
            message.inpending = false
            message.save().then((data) => {
            }).catch((reason) => {
              console.log("ERROR: Message update error\nDB ERROR: " + reason)
              return next({ statusCode: 404, errormessage: "Message update error" })
            })
          })
          console.log("Messages have been updated".green)
          return res.status(200).json({ error: false, errormessage: "Messages have been updated" })
        } else {
          console.log("ERROR: There are no messages to be update".red)          
          return next({ statusCode: 404, errormessage: "There are no messages to be update" })
        }
      }).catch((error) => {
        console.log("ERROR: DB error".red + error)
        return next({statusCode: 404, errormessage: "DB error"})
      })
    }
    else {
      console.log("ERROR: Unauthorized".red)
      return next({ statusCode: 401, errormessage: "Unauthorized" })
    }
  }).catch((error) => {
    console.log("ERROR: DB error".red + error)
    return next({statusCode: 404, errormessage: "DB error"})
  })
})

function createNewGameRequest(bodyRequest, username, ranking, oppositePlayer = null) {
  const model = notification.getModel()
  const id1 = mongoose.Types.ObjectId()
  const doc = new model({
    _id: id1,
    type: bodyRequest.type,
    text: null,
    sender: username.toString(),
    receiver: oppositePlayer,
    deleted: false,
    inpending: true,
    ranking: ranking
  })
  return doc
}

function createNewRandomMatch(player1, player2) {
  // choose game start randomly
  if (Math.random() < 0.5) {
    let t = player1
    player1 = player2
    player2 = t
  }

  const model = match.getModel()
  const doc = new model({
    inProgress: true,
    player1: player1,
    player2: player2,
    winner: null,
    playground: createPlayground(),
    chat: new Array(),
    nTurns: 1
  })
  return doc
}

function createPlayground() {
  const playground = new Array(6)
  for (let i = 0; i < 6; i++) {
    playground[i] = new Array(7)
  }
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 7; j++) {
      playground[i][j] = '/'
    }
  }
  return playground
}

function createNewFriendRequest(type, username, receiver) {
  const model = notification.getModel()
  const id1 = mongoose.Types.ObjectId()
  const doc = new model({
    _id: id1,
    type: type,
    text: "New friend request by " + username + ".",
    sender: username,
    receiver: receiver,
    inpending: true,
    deleted: false
  })
  return doc
}


//* END of API routes


// Game logic, notify event to listener, save move into game match
function makeMove(index, m, client, placehold, otherPlayer, res, username) {
  if (index >= 0 && index <= 6) {
    if (m.playground[5][index] == '/') {
      m.playground = insertMove(m.playground, index, placehold)

      let moveMessage = JSON.stringify({ "error": false, "codeError": null, "errorMessage": null })
      client.emit('move', JSON.parse(moveMessage))

      let opponentMessage = JSON.stringify({ move: index })

      // Notify event to other player
      if(otherPlayer.toString() != "cpu")
        socketIOclients[otherPlayer.toString()].emit('move', JSON.parse(opponentMessage))

      let watchersMessage = JSON.stringify({ player: username, move: index, nextTurn: otherPlayer })

      // Notify event to watchers
      client.broadcast.to(`${m.player1}Watchers`).emit('gameStatus', JSON.parse(watchersMessage))

      m.nTurns += 1

      m.save().then((data) => {
        console.log("Playground updated".green)
        // check winner
        if (username == m.player1.toString()) { // player1 controls
          if (checkWinner(m.playground, 'X')) {
            winnerControl(client, m, m.player2, m.player1)
          }
        } else { // player2 controls
          if (checkWinner(m.playground, 'O')) {
            winnerControl(client, m, m.player1, m.player2)
          }
        }
        //is playground full?
        let fullCheck = false
        for (let i = 0; i < 6; i++) {
          for (let j = 0; j < 7; j++) {
            if (m.playground[i][j] == '/') {
              fullCheck = true
            }
          }
        }
        if (!fullCheck) {
          let drawnMessage = JSON.stringify({ "winner": null })
          client.broadcast.to(m.player1).emit('result', JSON.parse(drawnMessage))
          client.emit('result', JSON.parse(drawnMessage))
          m.updateOne({ inProgress: false }).then((d) => {
            console.log("Winner updated".green)
          }).catch((reason) => {
            console.log(`Error: ${reason}`)
          })
        }
        return res.status(200).json({ error: false, errormessage: "added move" })
      }).catch((reason) => {
        console.log(`Error: ${reason}`)
      })
    } else {
      // Column not empty
      let errorMessage = JSON.stringify({ "error": true, "codeError": 1, "errorMessage": "The column is full" })
      client.emit('move', JSON.parse(errorMessage))
      console.log(`This column is full, choose another one`.red)
      return res.status(400).json({ error: true, errormessage: "This column is full, choose another one" })
    }
  } else { // move not allowed exit from playground dimension
    let errorMessage = JSON.stringify({ "error": true, "codeError": 2, "errorMessage": "Move not allowed, out of playground" })
    client.emit('move', JSON.parse(errorMessage))
    console.log(`Move not allowed, out of playground, choose another one`.red)
    return res.status(400).json({ error: true, errormessage: "Move not allowed, out of playground, choose another one" })
  }
}

// Notify listener that game has finished and send who is winner, then update stats
function winnerControl(client, m, loser, winner) {
  let winnerMessage = JSON.stringify({ winner: true })
  client.emit('result', JSON.parse(winnerMessage))

  let loserMessage = JSON.stringify({ winner: false })
  let loserClient = socketIOclients[loser.toString()]
  loserClient.emit('result', JSON.parse(loserMessage))


  let watchersMessage = JSON.stringify({ winner: m.player1 })
  client.broadcast.to(`${m.player1}Watchers`).emit('result', JSON.parse(watchersMessage))


  if (!(loser == "cpu" || winner == "cpu")) {
    updateStats(winner, m.nTurns, true)
    updateStats(loser, m.nTurns, false)
  }

  m.updateOne({ inProgress: false, winner: winner }).then((d) => {
    console.log("Winner updated".green)
  }).catch((reason) => {
    console.log(`Error: ${reason}`)
  })
}

function saveClient(client) {
  let token = client.handshake.query['jwt']

  if (token) {
    jsonwebtoken.verify(token, process.env.JWT_SECRET, (err, dec) => {
      let username = dec.username
      if (!socketIOclients[username]) {
        socketIOclients[username] = client
        console.log("User registered".green)
        ios.emit('online', { username: username, isConnected: true }) // inform listener that username is online
      } else {
        console.log("User already registered")
      }
    })
  } else {
    console.log(`No jwt found, disconnetion`.red)
    client.disconnect()
  }
}

// Add error handling middleware
app.use(function (err, req, res, next) {
  console.log("Request error: ".red + JSON.stringify(err));
  console.log(err)
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
    console.log("Connected to MongoDB".green)
    return user.getModel().findOne({ username: "admin" })
  }
).then(
  (u) => {
    if (!u) {
      console.log("Creating admin user".blue);

      const basicStats = new (statistics.getModel())({
        nGamesWon: 0,
        nGamesLost: 0,
        nGamesPlayed: 0
      })

      const d = {
        username: "admin",
        name: "admin",
        surname: "admin",
        avatarImgURL: 'https://dt2sdf0db8zob.cloudfront.net/wp-content/uploads/2019/12/9-Best-Online-Avatars-and-How-to-Make-Your-Own-for-Free-image1-5.png',
        mail: "admin@mail.it",
        password: "admin"
      }
      const doc = createNewUser(basicStats, d)
      doc.setModerator()
      doc.save()
    } else {
      console.log("Admin user already exists".blue)
    }
  }
).then(
  () => {
    let server = http.createServer(app);
    const option = {
      cors: {
        origin: true,
        methods: ["GET", "POST"],
        allowedHeaders: ["enableCORS"],
        credentials: true,
        
      },
    }
    ios = new Server(server, option)

    ios.on("connection", function (client) {
      console.log("Socket.io client connected".green);

      saveClient(client)

      client.on("disconnect", () => {
        let token = client.handshake.query['jwt']

        if (token) {
          jsonwebtoken.verify(token, process.env.JWT_SECRET, (err, dec) => {
            let username = dec.username.toString()

            user.getModel().findOne({ username: username }).then((user: User) => {
              match.getModel().findOne({ $or: [{ player1: user.username.toString() }, { player2: user.username.toString() }], inProgress: true, winner: null }).then((match) => {
                if (match != null) {
                  match.inProgress = false
                  if (user.username.toString() == match.player1.toString()) {
                    match.winner = match.player2.toString()
                    let message = JSON.stringify({ winner: match.player2.toString(), message: "Opposite player have left the game" })
                    ios.to(match.player1).emit('result', JSON.parse(message))
                  }
                  else {
                    match.winner = match.player1.toString()
                    let message = JSON.stringify({ winner: match.player1.toString(), message: "Opposite player have left the game" })
                    ios.to(match.player1).emit('result', JSON.parse(message))
                  }
                  match.save().then((data) => {
                    console.log("Match have been saved corretely");
                  }).catch((reason) => {
                    console.log("DB error: " + reason);
                  })
                }
                else {
                  // Non esiste alcun match, il client può essere disconnesso
                }
              })
              notification.getModel().findOne({ $or: [{ sender: user.username.toString() }, { receiver: user.username.toString() }], deleted: false, type: "friendlyMatchmaking" }).then((n) => {
                if (n != null) {
                  n.inpending = false
                  n.deleted = true
                  n.save().then((data) => {
                    if (data.receiver.toString() === user.username.toString()) {
                      if (checkOnlineUser(data.sender.toString()))
                        socketIOclients[data.sender.toString()].emit("gameReady", { "gameReady": false, "message": "User disconnect" })
                    }
                    else {
                      if (checkOnlineUser(data.receiver.toString()))
                        socketIOclients[data.receiver.toString()].emit("gameRequest", { "type": "friendlyGame", "message": "User disconnect" })
                    }
                  })
                }
              })
            })
          })
        }

        // When a client disconnects, I delete it from the list of connected clients.
        for (const [k, v] of Object.entries(socketIOclients)) {
          if (v == client) {
            ios.emit('online', { username: k, isConnected: false }) // Inform that username now is disconnected
            delete socketIOclients[k]
          }
        }
        console.log("Socket.io client disconnected".red)

      })
    });
    server.listen(process.env.PORT || 8080, () => console.log(`HTTP Server started on port ${process.env.PORT || 8080}`.green));
  }
).catch(
  (err) => {
    console.log("Error Occurred during initialization".red);
    console.log(err);
  }
)

function createChatMessage(sender, text) {
  const model = message.getModel()
  let timestamp = new Date()
  timestamp.setTime(timestamp.getTime()+60*60*1000)
  const doc = new model({
    content: text,
    sender: sender,
    receiver: null,
    timestamp: timestamp.toISOString()
  })
  return doc
}

function createMessage(sender, receiver, text) {
  const model = message.getModel()
  let timestamp = new Date()
  timestamp.setTime(timestamp.getTime()+60*60*1000)
  const doc = new model({
    content: text,
    sender: sender,
    receiver: receiver,
    timestamp: timestamp.toISOString(),
    inpending: true
  })
  return doc
}

function updateStats(player, nTurns, isWinner) {
  user.getModel().findOne({ username: player }).then((p) => {
    let stats = p.statistics
    if (isWinner) {
      stats.nGamesWon++
    } else {
      stats.nGamesLost++
    }
    stats.nGamesPlayed++
    stats.nTotalMoves += Math.trunc(nTurns / 2)
    let rank = getRank(getMMR(stats), isWinner)

    stats.ranking += rank

    if (stats.ranking <= 0) {
      stats.ranking = 0
    }

    let msg = JSON.stringify({ "rank": rank })

    socketIOclients[player].emit("result", JSON.parse(msg))

    p.updateOne({ statistics: stats }).then((d) => {
      console.log("Stats updated".green)
    }).catch((reason) => {
      console.log("Error " + reason)
    })
  })
}

function getMMR(statistics: Statistics) {
  let winRate = statistics.nGamesWon / statistics.nGamesPlayed
  let avgMove = statistics.nTotalMoves / statistics.nGamesPlayed
  return winRate + winRate / avgMove
}

function getRank(mmr: number, isWinner: boolean = true): number {
  if (isWinner) {
    if (mmr >= 0.85) {
      return getRandomInt(60, 70)
    } else if (mmr >= 0.70) {
      return getRandomInt(40, 60)
    } else if (mmr >= 0.50) {
      return getRandomInt(30, 40)
    } else if (mmr >= 0.30) {
      return getRandomInt(20, 30)
    } else {
      return getRandomInt(10, 20)
    }
  } else {
    if (mmr >= 0.50) {
      return -getRandomInt(15, 25)
    } else {
      return -getRandomInt(15, 35)
    }
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

// Inserting method of player move in AI algorithm, that return a new playground
function insertMove(playground, index, player) {
  let added = false
  // Deep copy of playground because minmax algorithm modify it
  let pl = copyPlayground(playground)
  // Adding player move
  for (let k = 0; k < 6 && !added; k++) {
    if (pl[k][index] == '/') {
      pl[k][index] = player
      added = true
    }
  }
  return pl
}

// Deep copy
function copyPlayground(playground) {
  let pl = new Array(6)
  for (let k = 0; k < 6; k++) {
    pl[k] = new Array(7)
    for (let c = 0; c < 7; c++) {
      pl[k][c] = playground[k][c]
    }
  }
  return pl
}

// Check if player win this match
function checkWinner(playground, player) {
  let winCheck = false
  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < 6; i++) {
      if (playground[i][j] == player && playground[i][j + 1] == player && playground[i][j + 2] == player && playground[i][j + 3] == player) {
        winCheck = true
      }
    }
  }
  // verticalCheck
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 7; j++) {
      if (playground[i][j] == player && playground[i + 1][j] == player && playground[i + 2][j] == player && playground[i + 3][j] == player) {
        winCheck = true
      }
    }
  }
  // ascendingDiagonalCheck
  for (let i = 3; i < 6; i++) {
    for (let j = 0; j < 4; j++) {
      if (playground[i][j] == player && playground[i - 1][j + 1] == player && playground[i - 2][j + 2] == player && playground[i - 3][j + 3] == player) {
        winCheck = true
      }
    }
  }
  // descendingDiagonalCheck
  for (let i = 3; i < 6; i++) {
    for (let j = 3; j < 7; j++) {
      if (playground[i][j] == player && playground[i - 1][j - 1] == player && playground[i - 2][j - 2] == player && playground[i - 3][j - 3] == player) {
        winCheck = true
      }
    }
  }
  return winCheck
}
