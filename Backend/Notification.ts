import mongoose = require('mongoose');

// ----------------------------------------------
// JSON schema validator using ajv
import addFormats from "ajv-formats"
const Ajv = require("ajv")
const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}

addFormats(ajv)

const validatorSchema = {
  type: "object",
  properties: {
    type: { type: "string" },
    text: { type: "string", nullable: true },
    sender: { type: "string" },
    receiver: { type: "string", nullable: true },
    deleted: { type: "boolean" },
    state: { type: "boolean", nullable: true },
    ranking: {type: "number"}
  },
  required: ["type", "sender", "deleted"],
  additionalProperties: true
}

const validate = ajv.compile(validatorSchema)
// ----------------------------------------------------


// A notification has a type of notification, some text content and a string that identify the sender
export interface Notification extends mongoose.Document {
  _id: mongoose.Types.ObjectId,
  type: string,
  text?: string,
  sender: string,
  receiver?: string,
  deleted: boolean,
  inpending: boolean, //It's used to show if a request has already been displayed
  ranking?: number,
  isFriendRequest: () => boolean,
  isNotification: () => boolean
}

var notificationSchema = new mongoose.Schema<Notification>({
  _id: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true
  },
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
  inpending: {
    type: mongoose.SchemaTypes.Boolean,
    required: true,
    default: true
  },
  ranking: {
    type: mongoose.SchemaTypes.Number,
    required: false
  }
})

notificationSchema.methods.isFriendRequest = function (): boolean {
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