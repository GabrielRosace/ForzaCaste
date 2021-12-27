import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { SocketioService } from '../socketio.service';
import { User } from '../User';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-user-deletion',
  templateUrl: './user-deletion.component.html',
  styleUrls: ['./user-deletion.component.css']
})
export class UserDeletionComponent implements OnInit {

  public list?: any
  public myUsername!: string
  public error?: string
  public subscriptionIn!: Subscription
  public subscriptionMsg!: Subscription
  public messagelist?: any
  public messageInpending?: any

  public userList: any[] = []
  public badgeContent: number = 0
  public badgeContentMsg: number = 0
  public hideMatBadge: boolean = false
  public hideMatBadgeMsg: boolean = false

  constructor(private us: UserHttpService, private router: Router, private sio: SocketioService) { }

  
  ngOnInit(): void {
    if (!this.us.get_token() || !this.us.has_moderator_role()) {
      // TODO aggiungi un messaggio, magari con una funzione nel servizio per non replicare codice
      this.router.navigate(['/']) 
    }
    this.getInpendinMsg()
    this.get_userlist()
    this.us.get_username()
  }

  delete(username: string) {
    this.us.delete_user(username).subscribe((e) => {
      this.error = "User deleted successfully"
      this.us.get_userlist().subscribe((elem: any) => {
        this.list = elem.userlist
      })
    }, () => { this.error = "Something weird happended" })
  }

  get_userlist(){
    this.subscriptionIn = this.us.get_userMessage().subscribe((elem: any) => {
      console.log("InpendingMsg:")
      console.log(elem.inPendingMessages)
      this.badgeContentMsg = 0
      this.messageInpending = elem.inPendingMessages

      this.us.get_userlist().subscribe((elem: any) => {
        this.list = elem.userlist
        console.log(this.list)
        this.list.forEach((element: { [x: string]: any; }) => {
          var countMsg: number = 0
          var msgHide: boolean = true
          var col
          this.messageInpending.forEach((msg: any) => {
            if (msg.sender == element['username']) {
              //date.getUTCDay().toString()+"-"+date.getUTCMonth().toString()+"-"+date.getFullYear().toString()+" "+date.getUTCHours().toString()+":"+date.getUTCMinutes().toString()
              countMsg++
              //console.log(this.num)
            }
          })
          /*
          var sos = this.onlineUser.find((data: any) => { return data == element['username'] })
          if (sos == element['username']) {
            col = "#88D498"
          } else {
            col = "#A4A5AE"
          }*/
          if (countMsg != 0) {
            msgHide = false
          }
          this.userList.push({ id: element['_id'], username: element['username'], badgeNum: countMsg, badgeHidden: msgHide, /*color: col */})
        })
      })
    })
  }

  navigate(route: String) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false
    this.router.onSameUrlNavigation = "reload"
    this.router.navigate([route])
  }

  readMessage(myus: string, username: string){
      this.us.readMessage(myus, username).subscribe()
    }

  getInpendinMsg() {
      this.subscriptionIn = this.us.get_userMessage().subscribe((elem: any) => {
        console.log("InpendingMsg:")
        console.log(elem.inPendingMessages)
        this.badgeContentMsg = 0
        this.messageInpending = elem.inPendingMessages
        this.messageInpending.forEach((element: any) => {
          if (element.receiver == this.us.get_username()) {
            this.badgeContentMsg++;
          }
        });
        console.log("badge")
        console.log(this.badgeContentMsg)
        if (this.badgeContentMsg == 0) {
          this.hideMatBadgeMsg = true
        } else {
          this.hideMatBadgeMsg = false
        }
      })
  }

  notifyNewMsg() {
    if (!this.sio.isNull()) {
      //var g = this.router.parseUrl(this.router.url).root.children.primary.segments[0].path
      //if (g) {
      this.subscriptionMsg = this.sio.newMessage().subscribe((msg) => {
        var g = this.router.parseUrl(this.router.url).root.children.primary.segments[0].path
        var g1 = ""
        if(this.router.parseUrl(this.router.url).root.children.primary.segments[1] != undefined){
          g1 = this.router.parseUrl(this.router.url).root.children.primary.segments[1].path
        }
        //console.log("NotifyNewMsg")
        console.log(g1)
        var rec = JSON.parse(JSON.stringify(msg)).receiver
        var send = JSON.parse(JSON.stringify(msg)).sender
        var inpend = JSON.parse(JSON.stringify(msg)).inpending
        if ("friend-chat" != g || g1 != send) {
        
          //console.log("NotifyNewMsg")
          if (inpend) {
            this.getInpendinMsg()
          }
          //console.log(g)
          //console.log(inpend)
          this.userList.forEach((element: { [x: string]: any; }) => {
            if (inpend) {
              if (element['username'] == send) {
                element['badgeNum']++
              }
              if (element['badgeNum'] != 0) {
                element['badgeHidden'] = false
              } else {
                element['badgeHidden'] = true
              }
            }
          })
        }
      })
      // }
    }
  }
}
