import mongoose = require('mongoose');


// ? Forse non serve che venga salvato sul db perchè è già dentro a User

export interface Statistics extends mongoose.Document{
    nGamesWon: number,
    nGamesLost: number,
    nGamesPlayed: number,
    nTotalMoves: number,
    getGamesDrawn: () => number,
}

var statisticsSchema = new mongoose.Schema<Statistics>( {
    nGamesWon:  {
        type: mongoose.SchemaTypes.Number,
        required: true,
        default: 0 
    },
    nGamesLost:  {
        type: mongoose.SchemaTypes.Number,
        required: true,
        default: 0 
    },
    nGamesPlayed:  {
        type: mongoose.SchemaTypes.Number,
        required: true,
        default: 0 
    },
    nGamesMoves:  {
        type: mongoose.SchemaTypes.Number,
        required: true,
        default: 0 
    },
})

statisticsSchema.methods.getGamesDrawn = function(){
    return (this.nGamesPlayed - (this.nGamesLost + this.nGamesLost));
}

export function getSchema() { return statisticsSchema; }

// Mongoose Model
var statisticsModel;  // This is not exposed outside the model
export function getModel() : mongoose.Model< mongoose.Document > { // Return Model as singleton
    if( !statisticsModel ) {
        statisticsModel = mongoose.model('Message', getSchema() )
    }
    return statisticsModel;
}