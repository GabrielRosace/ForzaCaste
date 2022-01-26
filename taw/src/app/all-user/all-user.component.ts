import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { SocketioService } from '../socketio.service';
import { User } from '../User';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-all-user',
  templateUrl: './all-user.component.html',
  styleUrls: ['./all-user.component.css']
})
export class AllUserComponent implements OnInit {

  public list?: any
  public myUsername!: string
  public error?: string
  public subscriptionIn!: Subscription
  public subscriptionMsg!: Subscription
  public messagelist?: any
  public messageInpending?: any

  public badgeAllUs: number = 0
  public hideBadgeAll: boolean = false

  public userList: any[] = []
  public badgeContent: number = 0
  public badgeContentMsg: number = 0
  public hideMatBadge: boolean = false
  public hideMatBadgeMsg: boolean = false

  constructor(private us: UserHttpService, private router: Router, private sio: SocketioService) { }


  ngOnInit(): void {
    if (!this.us.get_token() || !this.us.has_moderator_role()) {
      this.router.navigate(['/'])
    }
    this.getInpendinMsg()
    this.get_userlist()
    this.us.get_username()
    this.notifyNewMsg()
  }

  delete(username: string) {
    this.us.delete_user(username).subscribe((e) => {
      this.error = "User deleted successfully"
      this.us.get_userlist().subscribe((elem: any) => {
        this.list = elem.userlist
      })
    }, () => { this.error = "Something weird happended" })
  }

  get_userlist() {
    this.subscriptionIn = this.us.get_userMessage(true).subscribe((elem: any) => {
      this.messageInpending = elem.inPendingMessages

      this.us.get_userlist().subscribe((elem: any) => {
        this.list = elem.userlist
        console.log(this.list)
        this.list.forEach((element: { [x: string]: any; }) => {
          let countMsg: number = 0
          let msgHide: boolean = true
          this.messageInpending.forEach((msg: any) => {
            if (msg.sender == element['username']) {
              //date.getUTCDay().toString()+"-"+date.getUTCMonth().toString()+"-"+date.getFullYear().toString()+" "+date.getUTCHours().toString()+":"+date.getUTCMinutes().toString()
              countMsg++
            }
          })
          if (countMsg != 0) {
            msgHide = false
          }
          if (element['username'] != this.us.get_username()) {
            this.userList.push({ id: element['_id'], username: element['username'], roles: element['roles'], badgeNum: countMsg, badgeHidden: msgHide, /*color: col */ })
          }
        })
      })
      console.log(this.userList)
    })
  }

  navigate(route: String) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false
    this.router.onSameUrlNavigation = "reload"
    this.router.navigate([route])
  }

  readMessage(myus: string, username: string) {
    this.us.readMessage(myus, username, true).subscribe()
  }

  getInpendinMsg() {
    this.subscriptionIn = this.us.get_userMessage(true).subscribe((elem: any) => {
      console.log("InpendingMsg:")
      console.log(elem.inPendingMessages)
      this.badgeAllUs = 0
      this.messageInpending = elem.inPendingMessages
      this.messageInpending.forEach((element: any) => {
        if (element.receiver == this.us.get_username()) {
          this.badgeAllUs++;
        }
      });
      console.log("badge")
      console.log(this.badgeAllUs)
      if (this.badgeAllUs == 0) {
        this.hideBadgeAll = true
      } else {
        this.hideBadgeAll = false
      }
    })
  }

  notifyNewMsg() {
    if (!this.sio.isNull()) {
      this.subscriptionMsg = this.sio.newMessage().subscribe((msg) => {
        let g = this.router.parseUrl(this.router.url).root.children.primary.segments[0].path
        let g1 = ""
        if (this.router.parseUrl(this.router.url).root.children.primary.segments[1] != undefined) {
          g1 = this.router.parseUrl(this.router.url).root.children.primary.segments[1].path
        }
        console.log(g1)
        let rec = JSON.parse(JSON.stringify(msg)).receiver
        let send = JSON.parse(JSON.stringify(msg)).sender
        let inpend = JSON.parse(JSON.stringify(msg)).inpending
        if (inpend) {
          this.getInpendinMsg()
        }
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
      })
    }
  }
}
