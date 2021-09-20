"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModel = exports.getSchema = void 0;
const mongoose = require("mongoose");
const message = require("./Message");
var privateChatSchema = new mongoose.Schema({
    user1: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    user2: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    msg: {
        type: [message.getSchema()],
        required: false
    }
});
function getSchema() { return privateChatSchema; }
exports.getSchema = getSchema;
// Mongoose Model
var privateChatModel; // This is not exposed outside the model
function getModel() {
    if (!privateChatModel) {
        privateChatModel = mongoose.model('PrivateChat', getSchema());
    }
    return privateChatModel;
}
exports.getModel = getModel;
//# sourceMappingURL=PrivateChat.js.map