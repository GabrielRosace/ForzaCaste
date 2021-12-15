import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserHttpService } from '../user-http.service';
import { Socket } from 'socket.io-client';
import { SocketioService } from '../socketio.service';
import { AppComponent } from '../app.component';
import { ToastService } from '../_services/toast.service';
import { MatBadgeModule } from '@angular/material/badge';


@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {

  public username: string = "" //TODO tipo user
  public avatarImgURL: string = ""
  private tok: string = ""
  private subscriptionName: Subscription
  private subscriptionReq!: Subscription;
  private subscriptionNot!: Subscription
  public badgeContent : number = 0;
  public hideMatBadge : boolean = false;
  //private subsctiptionNot: Subscription
  public role: string = ""
  public type: string = ""
  public friendlist: any[] = []
  public notification: any[] = []
  public msg: string = ""
  public btnVal: any[] = []

  constructor(private toast: ToastService, private sio: SocketioService, private us: UserHttpService, private router: Router) {
    this.subscriptionName = this.us.get_update().subscribe((msg) => {
      // Update username and icon of logged user
      msg = msg.text
      if (msg == "User logged out") {
        this.tok = ''
        this.username = ''
        this.avatarImgURL = ''
      } else if (msg == "User logged in") {
        this.tok = this.us.get_token()
        this.notifyFriendReq()
        this.notifyGameReq()
        this.getNotification(false, true)
        this.username = this.us.get_username()
      } else if (msg == "Update user") {
        this.avatarImgURL = this.us.get_avatarImgURL()
        this.notifyGameReq()
        this.notifyFriendReq()
        //this.getNotification(false, true)
      }
    })
    /*
        this.us.get_friendlist().subscribe((u) => {
          this.friendlist = []
          console.log()
          u.friendlist.forEach((element: { [x: string]: any; }) => {
            console.log(1)
            this.friendlist.push({ id: element['_id'], username: element['username'], isBlocked: element['isBlocked'] })
            console.log(this.friendlist);
          });
          console.log(this.friendlist);
        })*/

    /*
    this.subsctiptionNot =  this.us.get_notification().subscribe((u) => {
      this.notification = []
      console.log()
      u.notification.forEach((element: { [x: string]: any; }) => {
        console.log(1)
        this.notification.push({ id: element['_id'], username: element['sender'], type: element['type'] })
        console.log(this.notification);
      });
      console.log(this.notification);
    })*/
  }

  ngOnInit(): void {
    this.tok = this.us.get_token()
    if (this.tok) {
      this.username = this.us.get_username()
      this.avatarImgURL = this.us.get_avatarImgURL()
      this.role = this.us.get_role()
      //this.getNotification(false, true)
    } else {
      this.username = ''
      this.avatarImgURL = ''
    }
  }

  ngOnDestroy(): void {
    this.subscriptionName.unsubscribe()
    this.subscriptionReq.unsubscribe()
    this.subscriptionNot.unsubscribe()
  }

  has_moderator_role(): boolean {
    if (this.tok) {
      return this.us.has_moderator_role()
    }
    return false
  }

  has_nonregmod_role(): boolean {
    if (this.tok) {
      return this.us.has_nonregmod_role()
    }
    return false
  }

  toastN(msg: string) {
    this.toast.show(msg, {
      classname: 'bg-info text-light',
      delay: 3000,
      autohide: true
    });
  }

  getNotification(makeNotificationRead: boolean, inpending?: boolean) {
    this.subscriptionNot = this.us.get_notification(makeNotificationRead, inpending).subscribe((u) => {
      this.notification = []
      console.log("inpending: "+inpending)
      u.notification.forEach((element: { [x: string]: any; }) => {
        //console.log(1)
        if (!(element['type'] == 'randomMatchmaking')) {
          this.notification.push({ id: element['_id'], sender: element['sender'], type: element['type'] })
          //console.log(this.notification);
          if(inpending == true){
            this.badgeContent++
          }else{
            this.badgeContent = 0
          }
        }
      });
      if(this.badgeContent != 0){
        this.hideMatBadge = false
      }else{
        this.hideMatBadge = true
      }
      console.log(this.notification);
      console.log("badgeContent: "+this.badgeContent)
    })
  }

  isFriendReq(type: string): boolean {
    if (type == 'friendRequest') {
      return true
    } else {
      return false
    }
  }

  getFriendlist() {
    this.us.get_friendlist().subscribe((u) => {
      this.friendlist = []
      console.log()
      u.friendlist.forEach((element: { [x: string]: any; }) => {
        console.log(1)
        if(element['isBlocked']){
          this.friendlist.push({ id: element['_id'], username: element['username'], isBlocked: "UnBlock" })
        }else{
          this.friendlist.push({ id: element['_id'], username: element['username'], isBlocked: "Block" })
        }
        console.log(this.friendlist);
      });
      console.log(this.friendlist);
    })
  }

  //Used to send a new friendRequest
  addFriend(receiver: string, type: string) {
    console.log("receiver: ", receiver)
    this.us.add_friendRequest(receiver).subscribe((data) => {
      this.toastN("Request Forwarded")
    })
  }

  deleteFriend(friend: string) {
    console.log("friend: ", friend)
    this.us.delete_friend(friend).subscribe((data) => {
      this.toastN("Friend deleted")
    })
  }


  notifyFriendReq() {
    if (!this.sio.isNull()){
      this.subscriptionReq = this.sio.request().subscribe(msg => {
        this.msg = JSON.parse(JSON.stringify(msg)).type
        let user = JSON.parse(JSON.stringify(msg)).sender
        console.log(JSON.parse(JSON.stringify(msg)).type)
        //console.log('got a msg: ' + msg);
        if (msg) {
          this.toastN("New "+this.msg+" by "+user)
          //console.log('got a msg: ' + msg);
        }
        this.badgeContent = 0
        this.getNotification(false, true)
      });
    }
  }

  blockUnblock( username: string, block: string){
    let index = this.friendlist.findIndex((obj => obj.username == username))
    console.log(this.friendlist[index])
    if(block == "UnBlock"){
      this.us.block_unblock_friend(username, false).subscribe((data) => {
        //this.btnVal = "Block"
        this.friendlist[index].isBlocked = "Block"
        this.toastN("FRIEND UNBLOCKED")
      })
    }else if(block == "Block"){
      this.us.block_unblock_friend(username, true).subscribe((data) => {
        //his.btnVal = "UnBlocked"
        this.friendlist[index].isBlocked = "UnBlock"
        this.toastN("FRIEND BLOCKED")
      })
    }
  }

  notifyGameReq(){
    if (!this.sio.isNull()){
      this.subscriptionReq = this.sio.gameRequest().subscribe(msg => {
        this.msg = JSON.parse(JSON.stringify(msg)).type
        let user = JSON.parse(JSON.stringify(msg)).player
        console.log(JSON.parse(JSON.stringify(msg)).type)
        //console.log('got a msg: ' + msg);
        if (msg) {
          this.toastN("New "+this.msg+" by "+user)
          //console.log('got a msg: ' + msg);
        }
        this.badgeContent = 0
        this.getNotification(false, true)
      });
    }
  }
  //Is used to add a new friend in the friendlist, when the friendRequest is accepted 
  addFriendToFriendlist(sender: string, accepted: boolean) {
    console.log("sender: ", sender)
    this.us.add_friend(sender, accepted).subscribe((data) => {
      this.toastN("Request Accepted")
    })
  }

  navigate(route: String) {
    this.router.navigate([route])
  }

}
