
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
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
  public friend: string = ""
  public avatarImgURL: string = ""
  private tok: string = ""
  public imBlock!: boolean
  private subscriptionName!: Subscription
  public subscriptionMsg!: Subscription
  public subscriptionBlck!: Subscription
  public badgeContentMsg: number = 0
  public hideMatBadgeMsg: boolean = false
  public role: string = ""
  public type: string = ""

  constructor(private toast: ToastService, private sio: SocketioService, private us: UserHttpService, private router: Router, private activeRoute: ActivatedRoute, private cdRef: ChangeDetectorRef) {

   /*
    this.subscriptionName = this.us.get_userMessage().subscribe((elem: any) => {
      console.log("OpenChat")
      let username = this.activeRoute.snapshot.params['friend']
      this.messagelist = elem.allMessages
      this.messageInpending = elem.inPendingMessages
      this.us.get_friend(username).subscribe((friend) => {
        this.messagelist.forEach((element: any) => {
          let date = new Date(element.timestamp);
          if (element.sender == username) {
            //date.getUTCDay().toString()+"-"+date.getUTCMonth().toString()+"-"+date.getFullYear().toString()+" "+date.getUTCHours().toString()+":"+date.getUTCMinutes().toString()
            this.singleChat.push({ imgUrl: friend.avatarImgURL, from: friend.username, text: element.content, time: date.toUTCString() });
          } else if (element.receiver == username) {
            this.singleChat.push({ imgUrl: this.us.get_avatarImgURL(), from: "me", text: element.content, time: date.toUTCString() });
          }
        })
        /*
        let date = new Date(element.timestamp);
        if (element.sender == username) {
          this.us.readMessage(this.us.get_username(), username)
          this.singleChat.push({ imgUrl: friend.avatarImgURL, from: friend.username, text: element.content, time: date.toUTCString() });
        } else if (element.receiver == username) {
          this.us.readMessage(username, this.us.get_username())
          this.singleChat.push({ imgUrl: this.us.get_avatarImgURL(), from: "me", text: element.content, time: date.toUTCString()});
        }
      })

      this.badgeContentMsg = 0
      //console.log("MsgList: ")
      //console.log(this.messageInpending)
      this.messageInpending.forEach((element: any) => {
        if (element.receiver == this.us.get_username()) {
          this.badgeContentMsg++;
        }
      });

      //console.log("badgeContent")
      //console.log(this.badgeContentMsg)
      if (this.badgeContentMsg == 0) {
        this.hideMatBadgeMsg = true
      }
    })*/
  }

  ngOnInit(): void {
    this.tok = this.us.get_token()
    console.log("Sono ngInit Friend")
    if (!this.tok) {
      // TODO aggiungi un messaggio, magari con una funzione nel servizio per non replicare codice
      this.router.navigate(['/']) 
    }else{
      this.username = this.us.get_username()
      this.avatarImgURL = this.us.get_avatarImgURL()
      this.role = this.us.get_role()
      this.friend = this.activeRoute.snapshot.params['friend']
      this.imBlocked()
      this.readMessage(this.us.get_username(), this.activeRoute.snapshot.params['friend'])
      this.openChat(this.activeRoute.snapshot.params['friend'])
      this.notifyNewMsg()
      this.notifyBlocked()
      console.log(this.router.parseUrl(this.router.url).root.children.primary.segments[0].path)
      //this.getNotification(false, true)
    }
  }

  ngOnDestroy(): void {
    if(this.tok){
      this.subscriptionName.unsubscribe()
      this.subscriptionMsg.unsubscribe()
    }
  }
  
  ngAfterViewChecked(){
    this.cdRef.detectChanges()
  }

  sendMessage(message: string) {
    this.us.send_chatMsg(this.activeRoute.snapshot.params['friend'], message).subscribe((data) => {
      let date = new Date();
      this.singleChat.push({ imgUrl: this.us.get_avatarImgURL(), from: "me", text: message, time: `${date.getUTCHours()}:${date.getMinutes()}:${date.getUTCSeconds()} - ${date.getUTCDate()}/${date.getUTCMonth()+1}/${date.getFullYear()}` });
    })
  }

  imBlocked() {
    this.us.get_friend(this.activeRoute.snapshot.params['friend']).subscribe((friend) => {
      let fr: any
      friend.friendList.filter((u: any) => {
        if (u.username == this.us.get_username()) {
          fr = u.isBlocked
        }
      })
      console.log("Blocked: ")
      //this.imBlock = fr.isBlocked
      console.log(fr)
      this.imBlock = fr
    })
  }

  openChat(username: string) {
    this.subscriptionName = this.us.get_userMessage().subscribe((elem: any) => {
      console.log("OpenChat")
      this.messagelist = elem.allMessages
      this.messageInpending = elem.inPendingMessages
      this.us.get_friend(username).subscribe((friend) => {
        this.messagelist.forEach((element: any) => {
          let date = new Date(element.timestamp);
          if (element.sender == username) {
            //date.getUTCDay().toString()+"-"+date.getUTCMonth().toString()+"-"+date.getFullYear().toString()+" "+date.getUTCHours().toString()+":"+date.getUTCMinutes().toString()
            this.singleChat.push({ imgUrl: friend.avatarImgURL, from: friend.username, text: element.content, time: `${date.getUTCHours()}:${date.getMinutes()}:${date.getUTCSeconds()} - ${date.getUTCDate()}/${date.getUTCMonth()+1}/${date.getFullYear()}` });
            console.log(`${date.getUTCHours()}:${date.getMinutes()}:${date.getUTCSeconds()} - ${date.getUTCDate()}/${date.getUTCMonth()+1}/${date.getFullYear()}`) //! Date parsing
          } else if (element.receiver == username) {
            this.singleChat.push({ imgUrl: this.us.get_avatarImgURL(), from: "me", text: element.content, time: `${date.getUTCHours()}:${date.getMinutes()}:${date.getUTCSeconds()} - ${date.getUTCDate()}/${date.getUTCMonth()+1}/${date.getFullYear()}` });
          }
        })
        /*
        let date = new Date(element.timestamp);
        if (element.sender == username) {
          this.us.readMessage(this.us.get_username(), username)
          this.singleChat.push({ imgUrl: friend.avatarImgURL, from: friend.username, text: element.content, time: date.toUTCString() });
        } else if (element.receiver == username) {
          this.us.readMessage(username, this.us.get_username())
          this.singleChat.push({ imgUrl: this.us.get_avatarImgURL(), from: "me", text: element.content, time: date.toUTCString()});
        }*/
      })

      this.badgeContentMsg = 0
      //console.log("MsgList: ")
      //console.log(this.messageInpending)
      this.messageInpending.forEach((element: any) => {
        if (element.receiver == this.us.get_username()) {
          this.badgeContentMsg++;
        }
      });

      //console.log("badgeContent")
      //console.log(this.badgeContentMsg)
      if (this.badgeContentMsg == 0) {
        this.hideMatBadgeMsg = true
      }
    })
  }

  readMessage(myus: string, username: string) {
    this.us.readMessage(myus, username, false).subscribe(() => {
      this.us.update_badge("read friend-chat")
    })
  }

  getInpendinMsg(username: string) {
    this.subscriptionName = this.us.get_userMessage().subscribe((elem: any) => {
      this.messageInpending = elem.inPendingMessages
      this.badgeContentMsg = 0
      this.us.get_friend(username).subscribe((friend) => {
        this.messageInpending.forEach((element: any) => {
          let date = new Date(element.timestamp);
          if (element.sender == username) {
            //date.getUTCDay().toString()+"-"+date.getUTCMonth().toString()+"-"+date.getFullYear().toString()+" "+date.getUTCHours().toString()+":"+date.getUTCMinutes().toString()
            this.singleChat.push({ imgUrl: friend.avatarImgURL, from: friend.username, text: element.content, time: `${date.getUTCHours()}:${date.getMinutes()}:${date.getUTCSeconds()} - ${date.getUTCDate()}/${date.getUTCMonth()+1}/${date.getFullYear()}` });
          }
        })
        this.us.readMessage(this.us.get_username(), username, false).subscribe()
      })
    })
  }

  notifyBlocked() {
    if (!this.sio.isNull()) {
      this.sio.beingBlocked().subscribe((msg) => {
        this.imBlock = JSON.parse(JSON.stringify(msg)).blocked
      })
    }
  }

  notifyNewMsg() {
    if (!this.sio.isNull()) {
      this.subscriptionMsg = this.sio.newMessage().subscribe((msg) => {
        this.getInpendinMsg(this.activeRoute.snapshot.params['friend'])
      })
    }
  }
}
