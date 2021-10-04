import mongoose = require('mongoose');

// ----------------------------------------------
// JSON schema validator using ajv
import addFormats from "ajv-formats"
const Ajv = require("ajv")
const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}

addFormats(ajv)

const validatorSchema = { //TODO aggiungere altri nullable se ce ne sono
  type: "object",
  properties: {
    type: { type: "string" },
    text: { type: "string", nullable: true },
    sender: { type: "string" },
    receiver: { type: "string", nullable: true },
    deleted: { type: "boolean" }
  },
  required: ["type", "sender", "deleted"],
  additionalProperties: true
}

const validate = ajv.compile(validatorSchema)
// ----------------------------------------------------


// A notification has a type of notification, some text content and a string that identify the sender
export interface Notification extends mongoose.Document {
  type: string,
  text: string,
  sender: string,
  receiver: string,
  deleted: boolean,
  state: boolean,
  isFriendRequest: () => boolean,
  isNotification: () => boolean
}

/*
export function isNotification(arg: any): arg is Notification {
    return arg && arg.text && typeof(arg.text) == 'string' && arg.type && Array.isArray(arg.tags) && arg.timestamp && arg.timestamp instanceof Date && arg.authormail && typeof(arg.authormail) == 'string' ;
}*/

var notificationSchema = new mongoose.Schema<Notification>({
  type: {
    type: mongoose.SchemaTypes.String,
    required: true
  },
  text: {
    type: mongoose.SchemaTypes.String,
  },
  sender: {
    type: mongoose.SchemaTypes.String,
    required: true
  },
  receiver: {
    type: mongoose.SchemaTypes.String,
  },
  deleted: {
    type: mongoose.SchemaTypes.Boolean,
    required: true
  },
  state: {
    type: mongoose.SchemaTypes.Boolean,
    required: false
  }
})

// export function isNotification(arg: any): arg is Notification {
//   console.log(arg && arg.sender && typeof (arg.sender) == 'string');

//   return arg && arg.sender && typeof (arg.sender) == 'string';
// }

notificationSchema.methods.isFriendRequest = function (): boolean {
  // var isFR = false;
  // if (this.type == "FriendRequest") {
  //   isFR = true;
  // }
  // return isFR;
  return this.type === "FriendRequest"
}

export function getSchema() { return notificationSchema; }

// Mongoose Model
var notificationModel;  // This is not exposed outside the model
export function getModel(): mongoose.Model<Notification> { // Return Model as singleton
  if (!notificationModel) {
    notificationModel = mongoose.model('Notification', getSchema())
  }
  return notificationModel;
}

export function isNotification(arg: any): arg is Notification {

  if (!validate(arg)) {
    console.log("Notification Validator Error ".red)
    console.log(validate.errors)
    return false
  }
  return true
}

export function fromJSONtoNotification(arg: any): Notification {
  if (isNotification(arg)) {
    var _NotificationModel = getModel()
    var not = new _NotificationModel(arg)
    return not
  }
  return null
}