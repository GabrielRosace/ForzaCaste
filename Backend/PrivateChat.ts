import mongoose = require('mongoose');

import {Message} from './Message';
import * as message from './Message';



export interface PrivateChat extends Message {
    user1: string
    user2: string,
    msg: Message[]
}

var privateChatSchema = new mongoose.Schema<PrivateChat>( {
    user1: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    user2:  {
        type: mongoose.SchemaTypes.String,
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