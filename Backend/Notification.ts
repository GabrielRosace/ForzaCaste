import mongoose = require('mongoose');

// A notification has a type of notification, some text content and a string that identify the sender
export interface Notification extends mongoose.Document{
    type: string,
    text: string,
    sender: string,
    receiver: string,
    deleted: boolean,
    isFriendRequest: ()=>boolean,
    isNotification: () => boolean
}

/*
export function isNotification(arg: any): arg is Notification {
    return arg && arg.text && typeof(arg.text) == 'string' && arg.type && Array.isArray(arg.tags) && arg.timestamp && arg.timestamp instanceof Date && arg.authormail && typeof(arg.authormail) == 'string' ;
}*/

var notificationSchema = new mongoose.Schema<Notification>( {
    type: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    text:  {
        type: mongoose.SchemaTypes.String,
    },
    sender: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    receiver: {
        type: mongoose.SchemaTypes.ObjectId,
    },
    deleted: {
        type: mongoose.SchemaTypes.Boolean,
        required: true
    }
})

export function isNotification(arg: any): arg is Notification {
    return arg && arg.content && typeof(arg.content) == 'string' && arg.timestamp && arg.timestamp instanceof Date && arg.sender && typeof(arg.sender) == 'string' ;
}

notificationSchema.methods.isFriendRequest = function(): boolean {
    var isFR = false;
    if(this.type == "FriendRequest"){
        isFR = true;
    }
    return isFR;
}

export function getSchema() { return notificationSchema; }

// Mongoose Model
var notificationModel;  // This is not exposed outside the model
export function getModel() : mongoose.Model< mongoose.Document > { // Return Model as singleton
    if( !notificationModel ) {
        notificationModel = mongoose.model('Notification', getSchema() )
    }
    return notificationModel;
}