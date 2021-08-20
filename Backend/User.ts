import mongoose = require('mongoose');
import crypto = require('crypto');
import { Notification } from './Notification';
import * as notification from './Notification'
import { Statistics } from './Statistics';
import * as statistics from './Statistics'


//! Mongoose Docs:
//! This approach works, 
//! but we recommend your document interface not extend Document.
//! Using extends Document makes it difficult for Mongoose to infer which properties are present on query filters, 
//! lean documents, and other cases.

export interface User extends mongoose.Document {
  // readonly _id: mongoose.Schema.Types.ObjectId,
  username: string,
  name?: string,
  surname?: string,
  mail?: string,
  state?: string,
  avatarImgURL?: string,
  roles: string[],
  inbox?: Notification[], //? Non è più giusto che sia facoltativo? Oppure Si mette array vuoto?
  statistics?: Statistics,
  salt?: string,    // salt is a random string that will be mixed with the actual password before hashing
  digest?: string,  // this is the hashed password (digest of the password)
  setPassword: (pwd: string) => void,
  validatePassword: (pwd: string) => boolean,
  hasAdminRole: () => boolean,
  setAdmin: () => void,
  hasModeratorRole: () => boolean,
  setModerator: () => void,
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
    type: [mongoose.SchemaTypes.String],
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
  salt: {
    type: mongoose.SchemaTypes.String,
    required: false
  },
  digest: {
    type: mongoose.SchemaTypes.String,
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

userSchema.methods.hasAdminRole = function (): boolean {
  for (var roleidx in this.roles) {
    if (this.roles[roleidx] === 'ADMIN')
      return true;
  }
  return false;
}

userSchema.methods.setAdmin = function () {
  if (!this.hasAdminRole())
    this.roles.push("ADMIN");
}

userSchema.methods.hasModeratorRole = function (): boolean { //! Forse è meglio usare includes("MODERATOR")
  for (var roleidx in this.roles) {
    if (this.roles[roleidx] === 'MODERATOR')
      return true;
  }
  return false;
}

userSchema.methods.setModerator = function () {
  if (!this.hasModeratorRole())
    this.roles.push("MODERATOR");
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