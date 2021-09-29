"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromJSONtoMatch = exports.isMatch = exports.createNewMatch = exports.getModel = exports.getSchema = void 0;
const mongoose = require("mongoose");
const message = require("./Message");
// ----------------------------------------------
// JSON schema validator using ajv
const ajv_formats_1 = require("ajv-formats");
const Ajv = require("ajv");
const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
ajv_formats_1.default(ajv);
const validatorSchema = {
    type: "object",
    properties: {
        inProgress: { type: "boolean" },
        player1: { type: "string" },
        player2: { type: "string" },
        winner: { type: "string" },
        playground: { type: "string" },
        chat: { type: "string" },
        nTurns: { type: "number" }
    },
    required: ["inProgress", "player1", "player2", "playground", "chat", "nTurns"],
    additionalProperties: false
};
const validate = ajv.compile(validatorSchema);
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
// TODO sistemare 
// ! Non funziona.
function isMatch(arg) {
    return validate(arg);
}
exports.isMatch = isMatch;
function fromJSONtoMatch(arg) {
    if (isMatch(arg)) {
        var _MatchModel = getModel();
        var match = new _MatchModel(arg);
        return match;
    }
    return null;
}
exports.fromJSONtoMatch = fromJSONtoMatch;
//# sourceMappingURL=Match.js.map