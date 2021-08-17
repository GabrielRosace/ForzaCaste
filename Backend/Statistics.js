"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModel = exports.getSchema = void 0;
const mongoose = require("mongoose");
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
//# sourceMappingURL=Statistics.js.map