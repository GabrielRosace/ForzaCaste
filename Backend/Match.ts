import mongoose = require('mongoose');
import * as message from './Message';

// ----------------------------------------------
// JSON schema validator using ajv
import addFormats from "ajv-formats"
const Ajv = require("ajv")
const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}

addFormats(ajv)

const validatorSchema = {
  type: "object",
  properties: {
    inProgress: { type: "boolean" },
    player1: { type: "string" },
    player2: { type: "string" },
    winner: { type: "string" },
    playground: { type: "string" }, // ! Problema
    chat: { type: "string" }, //! Problema
    nTurns: { type: "number" }
  },
  required: ["inProgress", "player1", "player2", "playground", "chat", "nTurns"],
  additionalProperties: false
}

const validate = ajv.compile(validatorSchema)
// ---------------------------------------------------

export interface Match {
  inProgress: boolean,
  player1: mongoose.Schema.Types.ObjectId,
  player2: mongoose.Schema.Types.ObjectId,
  winner: mongoose.Schema.Types.ObjectId,
  playground: String[6][7],
  chat: message.Message[],
  nTurns: Number
}

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
  playground: { //TODO controllare dimensioni campo di gioco
    type: [[mongoose.SchemaTypes.String]],//[mongoose.SchemaTypes.String],
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
})

export function getSchema() { return matchSchema; }

// Mongoose Model
var matchModel;  // This is not exposed outside the model
export function getModel(): mongoose.Model<Match> { // Return Model as singleton
  if (!matchModel) {
    matchModel = mongoose.model('Match', getSchema())
  }
  return matchModel;
}

export function createNewMatch(data): any {  //TODO modificare tipo di ritorno
  var _matchmodel = getModel();
  var match = new _matchmodel(data);
  fillPlayground(match);
  return match;
}

function fillPlayground(match) {
  var i;
  for (i = 0; i < 42; i++)
    match.playground.push("/");
}


// TODO sistemare 
// ! Non funziona.
export function isMatch(arg: any): arg is Match {
  return validate(arg)
}
export function fromJSONtoMatch(arg: any): Match {
  if (isMatch(arg)) {
    var _MatchModel = getModel()
    var match = new _MatchModel(arg)
    return match
  }
  return null
}