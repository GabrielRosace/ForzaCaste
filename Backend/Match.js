"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNewMatch = exports.getModel = exports.getSchema = void 0;
const mongoose = require("mongoose");
const message = require("./Message");
var matchSchema = new mongoose.Schema({
    inProgress: {
        type: mongoose.SchemaTypes.Boolean,
        required: true
    },
    player1: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    player2: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    winner: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    playground: {
        type: [[mongoose.SchemaTypes.String]],
        //validate: [arrayLimit, '{PATH} exceeds the limit of 7'],
        required: true
    },
    chat: {
        type: [message.getSchema()],
        required: true
    },
    nTurns: {
        type: mongoose.SchemaTypes.Number,
        required: true
    },
});
function getSchema() { return matchSchema; }
exports.getSchema = getSchema;
// Mongoose Model
var matchModel; // This is not exposed outside the model
function getModel() {
    if (!matchModel) {
        matchModel = mongoose.model('Match', getSchema());
    }
    return matchModel;
}
exports.getModel = getModel;
function createNewMatch(data) {
    var _matchmodel = getModel();
    var match = new _matchmodel(data);
    fillPlayground(match);
    return match;
}
exports.createNewMatch = createNewMatch;
function fillPlayground(match) {
    var i;
    for (i = 0; i < 42; i++)
        match.playground.push("/");
}
//# sourceMappingURL=Match.js.map