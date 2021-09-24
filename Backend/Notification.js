"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromJSONtoNotification = exports.isNotification = exports.getModel = exports.getSchema = void 0;
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
        text: { type: "string", nullable: true },
        sender: { type: "string" },
        receiver: { type: "string", nullable: true },
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
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    receiver: {
        type: mongoose.SchemaTypes.ObjectId,
    },
    deleted: {
        type: mongoose.SchemaTypes.Boolean,
        required: true
    }
});
// export function isNotification(arg: any): arg is Notification {
//   return arg && arg.content && typeof (arg.content) == 'string' && arg.timestamp && arg.timestamp instanceof Date && arg.sender && typeof (arg.sender) == 'string';
// }
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
function isNotification(arg) {
    console.log(validate(arg));
    return validate(arg);
    //TODO
}
exports.isNotification = isNotification;
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