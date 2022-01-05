import mongoose = require('mongoose');
import crypto = require('crypto');
import { Notification } from './Notification';
import * as notification from './Notification'
import { Statistics } from './Statistics';
import * as statistics from './Statistics'


export interface User extends mongoose.Document {
  username: string,
  name?: string,
  surname?: string,
  mail?: string,
  state?: string,
  avatarImgURL?: string,
  roles: string,
  inbox?: Notification[],
  statistics?: Statistics,
  friendList: [{username: string, isBlocked: boolean}],
  salt?: string,    // salt is a random string that will be mixed with the actual password before hashing
  digest?: string,  // this is the hashed password (digest of the password)
  deleted?: boolean,
  setPassword: (pwd: string) => void,
  validatePassword: (pwd: string) => boolean,
  hasModeratorRole: () => boolean,
  setModerator: () => void,
  hasNonRegisteredModRole: () => boolean,
  setNonRegisteredMod: () => void,
  hasUserRole: () => boolean,
  setUser: () => void,
  addFriend: (username: string,isBlocked: boolean) => void,
  isFriend: (username: string) => boolean,
  addNotification: (notId: Notification) => void,
  deleteFriend: (username: string) => void,
  setIsBlocked: (username: string, isBlocked: boolean) => void,

  //User management
  deleteUser: () => void
}

var userSchema = new mongoose.Schema<User>({
  // _id: {
  //   type: mongoose.Schema.Types.ObjectId  
  // },
  username: {
    type: mongoose.SchemaTypes.String,
    required: true,
    unique: true
  },
  name: {
    type: mongoose.SchemaTypes.String,
    required: false
  },
  surname: {
    type: mongoose.SchemaTypes.String,
    required: false
  },
  avatarImgURL: {
    type: mongoose.SchemaTypes.String,
    required: false
  },
  mail: {
    type: mongoose.SchemaTypes.String,
    required: false,
    // unique: true
  },
  state: {
    type: mongoose.SchemaTypes.String,
    required: false
  },
  roles: {
    type: mongoose.SchemaTypes.String,
    required: true
  },
  inbox: {
    type: [notification.getSchema()],
    required: false
  },
  statistics: {
    type: statistics.getSchema(),
    required: false,
  },
  friendList: {
    // type: [mongoose.SchemaTypes.String],
    type: [{username: "string", isBlocked: "boolean"}],
    required: false,
  },
  salt: {
    type: mongoose.SchemaTypes.String,
    required: false
  },
  digest: {
    type: mongoose.SchemaTypes.String,
    required: false
  },
  deleted: {
    type: mongoose.SchemaTypes.Boolean,
    required: false
  }
})

// Here we add some methods to the user Schema

userSchema.methods.setPassword = function (pwd: string) {

  this.salt = crypto.randomBytes(16).toString('hex'); // We use a random 16-bytes hex string for salt

  // We use the hash function sha512 to hash both the password and salt to
  // obtain a password digest 
  // 
  // From wikipedia: (https://en.wikipedia.org/wiki/HMAC)
  // In cryptography, an HMAC (sometimes disabbreviated as either keyed-hash message 
  // authentication code or hash-based message authentication code) is a specific type 
  // of message authentication code (MAC) involving a cryptographic hash function and 
  // a secret cryptographic key.
  //
  var hmac = crypto.createHmac('sha512', this.salt);
  hmac.update(pwd);
  this.digest = hmac.digest('hex'); // The final digest depends both by the password and the salt
}

userSchema.methods.validatePassword = function (pwd: string): boolean {

  // To validate the password, we compute the digest with the
  // same HMAC to check if it matches with the digest we stored
  // in the database.
  //
  var hmac = crypto.createHmac('sha512', this.salt);
  hmac.update(pwd);
  var digest = hmac.digest('hex');
  return (this.digest === digest);
}

// userSchema.methods.hasAdminRole = function (): boolean {
//   // for (var roleidx in this.roles) {
//   //   if (this.roles[roleidx] === 'ADMIN')
//   //     return true;
//   // }
//   // return false;
//   // return this.roles.includes("ADMIN")
//   return this.roles === "ADMIN"
// }


userSchema.methods.hasModeratorRole = function (): boolean {
  // for (var roleidx in this.roles) {
  //   if (this.roles[roleidx] === 'MODERATOR')
  //     return true;
  // }
  // return false;
  return this.roles === "MODERATOR"
}

userSchema.methods.hasNonRegisteredModRole = function (): boolean {
  return this.roles === "NONREGMOD"
}

userSchema.methods.hasUserRole = function (): boolean {
  return this.roles === "USER"
}

// userSchema.methods.setAdmin = function () {
//   if (!this.hasAdminRole()) {
//     // this.roles = []
//     // this.roles.push("ADMIN");
//     this.roles = "ADMIN"
//   }
// }

userSchema.methods.setModerator = function () {
  if (!this.hasModeratorRole()) {
    //   this.roles = []
    //   this.roles.push("MODERATOR")
    this.roles = "MODERATOR"
  }
}

userSchema.methods.setNonRegisteredMod = function () {
  if (!this.hasNonRegisteredModRole()) {
    // this.roles = []
    // this.roles.push("NONREGMOD")
    this.roles = "NONREGMOD"
  }
}

userSchema.methods.setUser = function () {
  if (!this.hasUserRole()) {
    // this.roles = []
    // this.roles.push("USER")
    this.roles = "USER"
  }
}

userSchema.methods.deleteUser = function () {
  this.deleted = true
}

// userSchema.methods.addFriend = function (username: string) {
//   this.friendList.push(username);
// }
userSchema.methods.addFriend = function (username: string, isBlocked: boolean) {
  this.friendList.push({ username: username, isBlocked: isBlocked });
}

userSchema.methods.isFriend = function (username: string){
  for( var i = 0; i < this.friendList.length; i++){     
    if ( this.friendList[i].username === username) { 
      return true;
    }
  }
  return false;
}

userSchema.methods.addNotification = function (notId: Notification) {
  this.inbox.push(notId);
}

userSchema.methods.deleteFriend = function (username: string){
  for( var i = 0; i < this.friendList.length; i++){ 
    if ( this.friendList[i].username === username) { 
      this.friendList.splice(i, 1); 
    }
  }
}

userSchema.methods.setIsBlocked = function (username: string, isBlocked: boolean){
  for( var i = 0; i < this.friendList.length; i++){ 
    if (this.friendList[i].username === username) { 
      this.friendList[i].isBlocked = isBlocked;
    }
  }
}
export function getSchema() { return userSchema; }

// Mongoose Model
var userModel;  // This is not exposed outside the model
export function getModel(): mongoose.Model<User> { // Return Model as singleton
  if (!userModel) {
    userModel = mongoose.model('User', getSchema())
  }
  return userModel;
}

export function newUser(data): User {
  var _usermodel = getModel();
  var user = new _usermodel(data);

  return user;
}



//* Qui può servire una funzione per cambiare lo stato dello User e che salvi il cambiamento