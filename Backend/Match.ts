import mongoose = require('mongoose');
import { Message } from './Message';

export interface Match {
    inProgress: boolean,
    player1: mongoose.Schema.Types.ObjectId,
    player2: mongoose.Schema.Types.ObjectId,
    winner: mongoose.Schema.Types.ObjectId,
    playground: String[][],
    chat: Message[],
    nTurns: Number
}

var matchSchema = new mongoose.Schema( {
    inProgress: {
        type: mongoose.SchemaTypes.boolean,
        required: true
    },
    player1:  {
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
        type: [[mongoose.SchemaTypes.String]],//[mongoose.SchemaTypes.String],
        //validate: [arrayLimit, '{PATH} exceeds the limit of 7'],
        required: true
    },
    chat: {
        type: [mongoose.SchemaTypes.Message],
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
export function getModel() : mongoose.Model< mongoose.Document > { // Return Model as singleton
    if( !matchModel ) {
        matchModel = mongoose.model('Message', getSchema() )
    }
    return matchModel;
}