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
  selector: 'app-mod-chat',
  templateUrl: './mod-chat.component.html',
  styleUrls: ['./mod-chat.component.css']
})
export class ModChatComponent implements OnInit {
  public messagelist?: any
  public messageInpending?: any
  public singleChat: Message[] = []
  public username: string = "" //TODO tipo user
  public avatarImgURL: string = ""
  public friend: string = ""
  private tok: string = ""

  private subscriptionChat!: Subscription
  private subscriptionMsg!: Subscription
  private subSendMsg!: Subscription
  private subMsgIn!: Subscription
  private subReadMsg!: Subscription

  public hideBadgeMod: boolean = false
  public badgeContMod: number = 0
  public role: string = ""
  public type: string = ""

  constructor(private app: AppComponent, private sio: SocketioService, private us: UserHttpService, private router: Router, private activeRoute: ActivatedRoute, private cdRef: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.tok = this.us.get_token()
    console.log("Sono ngInit Friend")
    if (!this.tok) {
      // TODO aggiungi un messaggio, magari con una funzione nel servizio per non replicare codice
      this.router.navigate(['/'])
    } else {
      this.username = this.us.get_username()
      this.avatarImgURL = this.us.get_avatarImgURL()
      this.role = this.us.get_role()
      this.friend = this.activeRoute.snapshot.params['user']
      this.readMessage(this.us.get_username(), this.activeRoute.snapshot.params['user'])
      this.openChat(this.activeRoute.snapshot.params['user'])
      this.notifyNewMsg()
      console.log(this.router.parseUrl(this.router.url).root.children.primary.segments[0].path)
      //this.getNotification(false, true)
    }
  }

  ngOnDestroy(): void {
    if (this.tok) {
      this.subscriptionChat.unsubscribe()
      this.subscriptionMsg.unsubscribe()
      this.subReadMsg.unsubscribe()
      this.subMsgIn.unsubscribe()
      this.subSendMsg.unsubscribe()
    }
  }

  ngAfterViewChecked() {
    this.cdRef.detectChanges()
  }

  sendMessage(message: string) {
    if (message == "") {
      this.app.toastCust("You have to write something for send it")
    } else {
      console.log("Mesg inviato")
      this.subSendMsg = this.us.send_ModMsg(this.activeRoute.snapshot.params['user'], message).subscribe((data) => {
        let date = new Date();
        date.setTime(date.getTime()+60*60*1000)
        this.singleChat.push({ imgUrl: this.us.get_avatarImgURL(), from: "me", text: message, time: `${date.getUTCHours()}:${date.getMinutes()}:${date.getUTCSeconds()} - ${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getFullYear()}` });
      })
    }
  }


  openChat(username: string) {
    this.subscriptionChat = this.us.get_userMessage(true).subscribe((elem: any) => {
      console.log("OpenChat")
      this.messagelist = elem.allMessages
      this.messageInpending = elem.inPendingMessages
      console.log(this.messageInpending)
      console.log(this.messagelist)
      this.us.get_Otheruser(username).subscribe((user) => {
        this.messagelist.forEach((element: any) => {
          let date = new Date(element.timestamp);
          if (element.sender == username) {
            //date.getUTCDay().toString()+"-"+date.getUTCMonth().toString()+"-"+date.getFullYear().toString()+" "+date.getUTCHours().toString()+":"+date.getUTCMinutes().toString()
            this.singleChat.push({ imgUrl: user.avatarImgURL, from: user.username, text: element.content, time: `${date.getUTCHours()}:${date.getMinutes()}:${date.getUTCSeconds()} - ${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getFullYear()}` });
          } else if (element.receiver == username) {
            this.singleChat.push({ imgUrl: this.us.get_avatarImgURL(), from: "me", text: element.content, time: `${date.getUTCHours()}:${date.getMinutes()}:${date.getUTCSeconds()} - ${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getFullYear()}` });
          }
        })
      })

      this.badgeContMod = 0
      //console.log("MsgList: ")
      //console.log(this.messageInpending)
      this.messageInpending.forEach((element: any) => {
        if (element.receiver == this.us.get_username()) {
          this.badgeContMod++;
        }
      });

      console.log("badgeContent")
      console.log(this.badgeContMod)
      if (this.badgeContMod == 0) {
        this.hideBadgeMod = true
      }
    })
  }

  readMessage(myus: string, username: string) {
    this.subReadMsg = this.us.readMessage(myus, username, true).subscribe(() => {
      console.log("Read Message")
      this.us.update_badge("read mod-chat")
    })
  }

  getInpendinMsg(username: string) {
    this.subMsgIn = this.us.get_userMessage(true).subscribe((elem: any) => {
      this.messageInpending = elem.inPendingMessages
      this.badgeContMod = 0
      this.us.get_Otheruser(username).subscribe((user) => {
        this.messageInpending.forEach((element: any) => {
          let date = new Date(element.timestamp);
          if (element.sender == username) {
            //date.getUTCDay().toString()+"-"+date.getUTCMonth().toString()+"-"+date.getFullYear().toString()+" "+date.getUTCHours().toString()+":"+date.getUTCMinutes().toString()
            this.singleChat.push({ imgUrl: user.avatarImgURL, from: user.username, text: element.content, time: `${date.getUTCHours()}:${date.getMinutes()}:${date.getUTCSeconds()} - ${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getFullYear()}` });
          }
        })
        this.us.readMessage(this.us.get_username(), username, true).subscribe()
      })
    })
  }


  notifyNewMsg() {
    if (!this.sio.isNull()) {
      this.subscriptionMsg = this.sio.newMessage().subscribe((msg) => {
        this.getInpendinMsg(this.activeRoute.snapshot.params['user'])
      })
    }
  }
}
