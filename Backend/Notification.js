"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModel = exports.getSchema = void 0;
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
        required: true
    },
    sender: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    }
});
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