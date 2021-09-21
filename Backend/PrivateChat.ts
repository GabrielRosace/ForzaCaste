import mongoose = require('mongoose');

import {Message} from './Message';
import * as message from './Message';



export interface PrivateChat extends Message {
    user1: mongoose.Schema.Types.ObjectId,
    user2: mongoose.Schema.Types.ObjectId,
    msg: Message[]
}

var privateChatSchema = new mongoose.Schema<PrivateChat>( {
    user1: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    user2:  {
        type: mongoose.SchemaTypes.ObjectId,
        required: true 
    },
    msg: {
        type: [message.getSchema()],
        required: false
    }
})

export function getSchema() { return privateChatSchema; }

// Mongoose Model
var privateChatModel;  // This is not exposed outside the model
export function getModel() : mongoose.Model< PrivateChat > { // Return Model as singleton
    if( !privateChatModel ) {
        privateChatModel = mongoose.model('PrivateChat', getSchema() )
    }
    return privateChatModel;
}