import mongoose = require('mongoose');

// ----------------------------------------------
// JSON schema validator using ajv
import addFormats from "ajv-formats"
const Ajv = require("ajv")
const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}

addFormats(ajv)

const validatorSchema = {
  type: "object",
  properties: {
    nGamesWon: { type: "number" },
    nGamesLost: { type: "number" },
    nGamesPlayed: { type: "number" },
    nTotalMoves: { type: "number" },
    ranking: { type: "number" }
  },
  required: ["nGamesWon", "nGamesLost", "nGamesPlayed", "nTotalMoves"],
  additionalProperties: true
}

const validate = ajv.compile(validatorSchema)
// ----------------------------------------------------


export interface Statistics extends mongoose.Document {
  nGamesWon: number,
  nGamesLost: number,
  nGamesPlayed: number,
  nTotalMoves: number,
  ranking: number,
  getGamesDrawn: () => number,
}

var statisticsSchema = new mongoose.Schema<Statistics>({
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
  nTotalMoves: {
    type: mongoose.SchemaTypes.Number,
    required: true,
    default: 0
  },
  ranking: {
    type: mongoose.SchemaTypes.Number,
    required: false,
    default: 0
  }
})

statisticsSchema.methods.getGamesDrawn = function () {
  return (this.nGamesPlayed - (this.nGamesLost + this.nGamesLost));
}

export function getSchema() { return statisticsSchema; }

// Mongoose Model
var statisticsModel;  // This is not exposed outside the model
export function getModel(): mongoose.Model<Statistics> { // Return Model as singleton
  if (!statisticsModel) {
    statisticsModel = mongoose.model('Message', getSchema())
  }
  return statisticsModel;
}

export function isStatistics(arg: any): arg is Statistics {
  return validate(arg)
}
export function fromJSONtoStatistic(arg: any): Statistics {
  if (isStatistics(arg)) {
    var _statisticModel = getModel()
    var stats = new _statisticModel(arg)
    return stats
  }
  return null
}