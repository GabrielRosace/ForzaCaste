
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserHttpService } from '../user-http.service';
import { Socket } from 'socket.io-client';
import { SocketioService } from '../socketio.service';
import { AppComponent } from '../app.component';
import { ToastService } from '../_services/toast.service';
import { MatBadgeModule } from '@angular/material/badge';
import { ActivatedRoute } from '@angular/router';

interface Message {
  imgUrl: string;
  from: string;
  text: string;
  time: string;
}

@Component({
  selector: 'app-friend-chat',
  templateUrl: './friend-chat.component.html',
  styleUrls: ['./friend-chat.component.css']
})
export class FriendChatComponent implements OnInit {
  public messagelist?: any
  public messageInpending?: any
  public singleChat: Message[] = []
  public username: string = "" //TODO tipo user
  public avatarImgURL: string = ""
  private tok: string = ""
  private subscriptionName!: Subscription
  public subscriptionMsg!: Subscription
  public role: string = ""
  public type: string = ""

  constructor(private toast: ToastService, private sio: SocketioService, private us: UserHttpService, private activeRoute: ActivatedRoute) {
    /*
    this.subscriptionName = this.us.get_update().subscribe((msg) => {
      // Update username and icon of logged user
      msg = msg.text
      if (msg == "User logged out") {
        this.tok = ''
        this.username = ''
        this.avatarImgURL = ''
        console.log("Primo if")
      } else if (msg == "User logged in") {
        this.tok = this.us.get_token()
        this.username = this.us.get_username()
        this.openChat(this.activeRoute.snapshot.params['friend'])
        console.log("SECONDO if")
        this.notifyNewMsg()
      } else if (msg == "Update user") {
        this.avatarImgURL = this.us.get_avatarImgURL()
        this.openChat(this.activeRoute.snapshot.params['friend'])
        console.log("Terzo if")
        this.notifyNewMsg()
        //this.getNotification(false, true)
      }
    })*/
  }

  ngOnInit(): void {
    this.tok = this.us.get_token()
    if (this.tok) {
      this.username = this.us.get_username()
      this.avatarImgURL = this.us.get_avatarImgURL()
      this.role = this.us.get_role()
      this.openChat(this.activeRoute.snapshot.params['friend'])
      this.notifyNewMsg()
      //this.getNotification(false, true)
    } else {
      this.username = ''
      this.avatarImgURL = ''
    }
  }

  ngOnDestroy(): void {
    this.subscriptionName.unsubscribe()
    this.subscriptionMsg.unsubscribe()
  }

  sendMessage(message: string){
    this.us.send_chatMsg(this.activeRoute.snapshot.params['friend'], message).subscribe((data) => {
      var time = new Date();
      this.singleChat.push({ imgUrl: this.us.get_avatarImgURL(), from: "me", text: message, time: time.toLocaleTimeString() });
    })
  }

  openChat(username: string) {
    this.subscriptionName = this.us.get_userMessage().subscribe((elem: any) => {
      this.messagelist = elem.allMessages
      this.messageInpending = elem.inPendingMessages
      this.us.get_friend(username).subscribe((friend) => {
        this.messagelist.forEach((element: any) => {
          var date = new Date(element.timestamp);
          if (element.sender == username) {
            //date.getUTCDay().toString()+"-"+date.getUTCMonth().toString()+"-"+date.getFullYear().toString()+" "+date.getUTCHours().toString()+":"+date.getUTCMinutes().toString()
            this.singleChat.push({ imgUrl: friend.avatarImgURL, from: friend.username, text: element.content, time: date.toUTCString()});
          } else if (element.receiver == username) {
            this.singleChat.push({ imgUrl: this.us.get_avatarImgURL(), from: "me", text: element.content, time:  date.toUTCString()});
          }
        })
          /*
          var date = new Date(element.timestamp);
          if (element.sender == username) {
            this.us.readMessage(this.us.get_username(), username)
            this.singleChat.push({ imgUrl: friend.avatarImgURL, from: friend.username, text: element.content, time: date.toUTCString() });
          } else if (element.receiver == username) {
            this.us.readMessage(username, this.us.get_username())
            this.singleChat.push({ imgUrl: this.us.get_avatarImgURL(), from: "me", text: element.content, time: date.toUTCString()});
          }*/
      })
    })
    this.us.readMessage(this.us.get_username(), username).subscribe()
  }

  notifyNewMsg(){
    if (!this.sio.isNull()){
      this.subscriptionMsg = this.sio.newMessage().subscribe((msg) => {
        this.singleChat = []
        this.openChat(this.activeRoute.snapshot.params['friend'])
      })
    }
  }
}
