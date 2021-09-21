"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModel = exports.getSchema = exports.isNotification = void 0;
const mongoose = require("mongoose");
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
function isNotification(arg) {
    return arg && arg.content && typeof (arg.content) == 'string' && arg.timestamp && arg.timestamp instanceof Date && arg.sender && typeof (arg.sender) == 'string';
}
exports.isNotification = isNotification;
notificationSchema.methods.isFriendRequest = function () {
    var isFR = false;
    if (this.type == "FriendRequest") {
        isFR = true;
    }
    return isFR;
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
//# sourceMappingURL=Notification.js.map