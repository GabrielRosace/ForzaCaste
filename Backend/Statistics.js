"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromJSONtoStatistic = exports.isStatistics = exports.getModel = exports.getSchema = void 0;
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
        nGamesWon: { type: "number" },
        nGamesLost: { type: "number" },
        nGamesPlayed: { type: "number" },
        nTotalMoves: { type: "number" }
    },
    required: ["nGamesWon", "nGamesLost", "nGamesPlayed", "nTotalMoves"],
    additionalProperties: false
};
const validate = ajv.compile(validatorSchema);
var statisticsSchema = new mongoose.Schema({
    nGamesWon: {
        type: mongoose.SchemaTypes.Number,
        required: true,
        default: 0
    },
    nGamesLost: {
        type: mongoose.SchemaTypes.Number,
        required: true,
        default: 0
    },
    nGamesPlayed: {
        type: mongoose.SchemaTypes.Number,
        required: true,
        default: 0
    },
    nGamesMoves: {
        type: mongoose.SchemaTypes.Number,
        required: true,
        default: 0
    },
});
statisticsSchema.methods.getGamesDrawn = function () {
    return (this.nGamesPlayed - (this.nGamesLost + this.nGamesLost));
};
function getSchema() { return statisticsSchema; }
exports.getSchema = getSchema;
// Mongoose Model
var statisticsModel; // This is not exposed outside the model
function getModel() {
    if (!statisticsModel) {
        statisticsModel = mongoose.model('Message', getSchema());
    }
    return statisticsModel;
}
exports.getModel = getModel;
function isStatistics(arg) {
    return validate(arg);
}
exports.isStatistics = isStatistics;
function fromJSONtoStatistic(arg) {
    if (isStatistics(arg)) {
        var _statisticModel = getModel();
        var stats = new _statisticModel(arg);
        return stats;
    }
    return null;
}
exports.fromJSONtoStatistic = fromJSONtoStatistic;
//# sourceMappingURL=Statistics.js.map