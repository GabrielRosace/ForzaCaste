"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromJSONtoNotification = exports.getModel = exports.getSchema = exports.isNotification = void 0;
const mongoose = require("mongoose");
// ----------------------------------------------
// JSON schema validator using ajv
const ajv_formats_1 = require("ajv-formats");
const Ajv = require("ajv");
const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
(0, ajv_formats_1.default)(ajv);
const validatorSchema = {
    type: "object",
    properties: {
        type: { type: "string" },
        text: { type: "string" },
        sender: { type: "string" },
        receiver: { type: "string" },
        deleted: { type: "boolean" }
    },
    required: ["type", "sender", "deleted"],
    additionalProperties: false
};
const validate = ajv.compile(validatorSchema);
/*
export function isNotification(arg: any): arg is Notification {
    return arg && arg.text && typeof(arg.text) == 'string' && arg.type && Array.isArray(arg.tags) && arg.timestamp && arg.timestamp instanceof Date && arg.authormail && typeof(arg.authormail) == 'string' ;
}*/
var notificationSchema = new mongoose.Schema({
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
    }
});
function isNotification(arg) {
    console.log(arg && arg.sender && typeof (arg.sender) == 'string');
    return arg && arg.sender && typeof (arg.sender) == 'string';
}
exports.isNotification = isNotification;
notificationSchema.methods.isFriendRequest = function () {
    // var isFR = false;
    // if (this.type == "FriendRequest") {
    //   isFR = true;
    // }
    // return isFR;
    return this.type === "FriendRequest";
};
function getSchema() { return notificationSchema; }
exports.getSchema = getSchema;
// Mongoose Model
var notificationModel; // This is not exposed outside the model
function getModel() {
    if (!notificationModel) {
        notificationModel = mongoose.model('Notification', getSchema());
    }
    return notificationModel;
}
exports.getModel = getModel;
// export function isNotification(arg: any): arg is Notification {
//   console.log(validate(arg));
//   return validate(arg)
//   //TODO
//   }
function fromJSONtoNotification(arg) {
    if (isNotification(arg)) {
        var _NotificationModel = getModel();
        var not = new _NotificationModel(arg);
        return not;
    }
    return null;
}
exports.fromJSONtoNotification = fromJSONtoNotification;
//# sourceMappingURL=Notification.js.map