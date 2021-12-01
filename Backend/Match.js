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
(0, ajv_formats_1.default)(ajv);
const validatorSchema = {
    type: "object",
    properties: {
        inProgress: { type: "boolean" },
        player1: { type: "string" },
        player2: { type: "string" },
        winner: { type: "string", nullable: true },
        playground: { type: "array" },
        chat: { type: "array", nullable: true },
        nTurns: { type: "number" },
        winnerPoints: { type: "number", nullable: true },
        loserPoints: { type: "number", nullable: true }
    },
    required: ["inProgress", "player1", "player2", "playground", "chat", "nTurns"],
    additionalProperties: true
};
const validate = ajv.compile(validatorSchema);
var matchSchema = new mongoose.Schema({
    inProgress: {
        type: mongoose.SchemaTypes.Boolean,
        required: true
    },
    player1: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    player2: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    winner: {
        type: mongoose.SchemaTypes.String,
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
    winnerPoints: {
        type: mongoose.SchemaTypes.Number,
        required: false
    },
    loserPoints: {
        type: mongoose.SchemaTypes.Number,
        required: false
    }
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
    // fillPlayground(match);
    return match;
}
exports.createNewMatch = createNewMatch;
// function fillPlayground(match) {
//   var i;
//   for (i = 0; i < 42; i++)
//     match.playground.push("/");
// }
function isMatch(arg) {
    if (!validate(arg)) {
        console.log("Match Validator Error ".red);
        console.log(validate.errors);
        return false;
    }
    return true;
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