import mongoose = require('mongoose');
import  * as message from './Message';

export interface Match {
    inProgress: boolean,
    player1: mongoose.Schema.Types.ObjectId,
    player2: mongoose.Schema.Types.ObjectId,
    winner: mongoose.Schema.Types.ObjectId,
    playground: String[6][7],
    chat: message.Message[],
    nTurns: Number
}

var matchSchema = new mongoose.Schema( {
    inProgress: {
        type: mongoose.SchemaTypes.Boolean,
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
export function getModel() : mongoose.Model< mongoose.Document > { // Return Model as singleton
    if( !matchModel ) {
        matchModel = mongoose.model('Match', getSchema() )
    }
    return matchModel;
}

export function createNewMatch( data ) : any {  //TODO modificare tipo di ritorno
    var _matchmodel = getModel();
    var match = new _matchmodel( data );
    fillPlayground(match);
    return match;
}

function fillPlayground(match){
    var i;
    for(i = 0 ; i < 42 ; i++)
        match.playground.push("/");
}