import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserHttpService } from '../user-http.service';
import { Socket } from 'socket.io-client';
import { SocketioService } from '../socketio.service';
import { AppComponent } from '../app.component';
import { ToastService } from '../_services/toast.service';
import { MatBadgeModule } from '@angular/material/badge';
import { ignoreElements } from 'rxjs/operators';
import { isNgContainer } from '@angular/compiler';
import { ActivatedRoute } from '@angular/router';





@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {

  public username: string = ""
  public avatarImgURL: string = ""
  private tok: string = ""


  public gameReady!: Subscription
  private subscriptionName: Subscription
  private subscriptionReq!: Subscription
  private subscriptionNot!: Subscription
  private subscriptionMsg!: Subscription
  private subscriptionIn!: Subscription
  private subscriptionChat!: Subscription
  private subscriptionRoute!: Subscription

  public errMsg: string = ""

  public badgeContent: number = 0
  public badgeContentMsg: number = 0
  public hideMatBadge: boolean = false
  public hideMatBadgeMsg: boolean = false
  public badgeContMod: number = 0
  public hideBadgeMod: boolean = false

  public badgeAllUs: number = 0
  public hideBadgeAll: boolean = false

  public friendUsername: string = ""
  public list?: any
  public messagelist?: any
  public messageInpending?: any

  public messageInMod?: any
  public modlist: any[] = []

  public friendListVis: boolean = true

  public onlineUser?: any
  //private subsctiptionNot: Subscription
  public role: string = ""
  public type: string = ""
  public friendlist: any[] = []
  public notification: any[] = []
  public msg: string = ""
  public btnVal: any[] = []

  constructor(private app: AppComponent, private toast: ToastService, private sio: SocketioService, private us: UserHttpService, private router: Router, private activeRoute: ActivatedRoute) {
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
        this.notifyFriendReqAccepted()
        this.notifyFriendDeleted()
        this.notifyNewMsg()
        this.getNotification(false, true)
        this.getInpendinMsg()
        this.getInpendingMsgMod()
        this.getFriendlist()
        this.getUsOnline()
        this.notifyOnline()
        this.foundGame()
        this.username = this.us.get_username()
      } else if (msg == "Update user") {
        this.avatarImgURL = this.us.get_avatarImgURL()
        this.notifyGameReq()
        this.notifyFriendReq()
        this.notifyFriendDeleted()
        this.notifyFriendReqAccepted()
        this.notifyNewMsg()
        this.notifyOnline()
        this.foundGame()
        //this.getNotification(false, true)
      }
    })
    this.subscriptionChat = this.us.get_badge().subscribe((msg) => {
      console.log("Chat get_badge")
      msg = msg.text
      if(msg == "read friend-chat"){
        this.getInpendinMsg()
      }else if(msg == "read mod-chat"){
        this.getInpendingMsgMod()
      }
    })
    this.subscriptionRoute = this.us.get_visibleFriendList().subscribe((msg) => {
      console.log("Visible FriendList")
      console.log(msg.value)
      this.friendListVis = msg.value
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
    /* Delete the subscription from the socket's listener */
    this.subscriptionName.unsubscribe()
    this.subscriptionReq.unsubscribe()
    this.subscriptionNot.unsubscribe()
    this.subscriptionMsg.unsubscribe()
    this.gameReady.unsubscribe();
    this.subscriptionChat.unsubscribe()
  }

  setName(username: string) {
    this.friendUsername = username
  }

  setErr(){
    this.errMsg = ""
  }

  get_userlist() {
    this.us.get_userlist().subscribe((elem: any) => {
      console.log(elem)
      this.list = elem.userlist.filter((u: any) => { return u.username != this.us.get_username() })
    })
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
  /*
    toastN(msg: string) {
      this.toast.show(msg, {
        classname: 'bg-info text-light',
        delay: 3000,
        autohide: true
      });
    }*/

  getNotification(makeNotificationRead: boolean, inpending?: boolean) {
    this.subscriptionNot = this.us.get_notification(makeNotificationRead, inpending).subscribe((u) => {
      this.notification = []
      //console.log("inpending: "+inpending)
      u.notification.forEach((element: { [x: string]: any; }) => {
        //console.log(1)
        if (!(element['type'] == 'randomMatchmaking') && !(element['type'] == 'friendMessage')) {
          let msg
          if (element['type'] == 'friendlyMatchmaking') {
            msg = "New Friendly Matchmaking from " + element['sender']
          } else if (element['type'] == 'friendRequest') {
            msg = "New Friend Request from " + element['sender']
          }
          this.notification.push({ id: element['_id'], sender: element['sender'], type: element['type'], msg: msg })
          //console.log(this.notification);
          if (inpending == true) {
            this.badgeContent++
          }
        }
      });

      if (makeNotificationRead) {
        this.badgeContent = 0
      }

      if (this.badgeContent != 0) {
        this.hideMatBadge = false
      } else {
        this.hideMatBadge = true
      }
      //console.log(this.notification);
      console.log("badgeContent: " + this.badgeContent)
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
    console.log("GetFriendlist")
    //this.messageInpending = this.getInpendinMsg()
    this.getInpendinMsg()
    let g = this.router.url
    console.log(g)
    //console.log(this.messageInpending)
    this.us.get_friendlist().subscribe((u) => {
      this.friendlist = []
      u.friendlist.forEach((element: { [x: string]: any; }) => {
        let countMsg: number = 0
        let msgHide: boolean = true
        let col
        this.us.get_friend(element['username']).subscribe((friend) => {
          this.messageInpending.forEach((msg: any) => {
            if (msg.sender == element['username']) {
              //date.getUTCDay().toString()+"-"+date.getUTCMonth().toString()+"-"+date.getFullYear().toString()+" "+date.getUTCHours().toString()+":"+date.getUTCMinutes().toString()
              countMsg++
              //console.log(this.num)
            }
          })
          /*
          let sos = this.onlineUser.filter((data: any) => {
            if (data.username == friend.username) {
              return true
            } else {
              return false
            }
          })*/
          //console.log(this.onlineUser)
          let sos = this.onlineUser.find((data: any) => { return data == element['username'] })
          //console.log("Sos")
          //console.log(sos)
          if (sos == element['username']) {
            col = "#88D498"
          } else {
            col = "#A4A5AE"
          }
          //console.log(countMsg)
          if (countMsg != 0) {
            msgHide = false
          }
          if (element['isBlocked']) {
            this.friendlist.push({ id: element['_id'], username: element['username'], isBlocked: "bi bi-person-check-fill", badgeNum: countMsg, badgeHidden: msgHide, color: col })
          } else {
            this.friendlist.push({ id: element['_id'], username: element['username'], isBlocked: "bi bi-person-x-fill", badgeNum: countMsg, badgeHidden: msgHide, color: col })
          }
        })
      });
    })
  }

  getModeratorList() {
    this.us.get_userlist().subscribe((elem: any) => {
      this.modlist = []
      this.list = elem.userlist
      console.log(this.list)
      this.list.forEach((element: { [x: string]: any; }) => {
        var countMsg: number = 0
        var msgHide: boolean = true
        this.messageInMod.forEach((msg: any) => {
          if (msg.sender == element['username']) {
            //date.getUTCDay().toString()+"-"+date.getUTCMonth().toString()+"-"+date.getFullYear().toString()+" "+date.getUTCHours().toString()+":"+date.getUTCMinutes().toString()
            countMsg++
            //console.log(this.num)
          }
        })
        if (countMsg != 0) {
          msgHide = false
        }
        if (element['roles'] == "MODERATOR" && element['username'] != this.us.get_username()) {
          this.modlist.push({ id: element['_id'], username: element['username'], badgeNum: countMsg, badgeHidden: msgHide, /*color: col */ })
        }
      })
      console.log(this.modlist)
    })
  }

  getUsOnline() {
    let online = this.us.get_usersOnline().subscribe((elem: any) => {
      console.log("Online")
      console.log(elem.onlineuser)
      this.onlineUser = elem.onlineuser
    })
  }
  //Used to send a new friendRequest
  addFriend(receiver: string, type: string) {
    console.log("receiver: ", receiver)
    this.errMsg = ""
    this.us.add_friendRequest(receiver).subscribe((data) => {
      this.app.toastCust("Request Forwarded")
      //this.toastN("Request Forwarded")
    }, (err) => {
      let msg = JSON.parse(JSON.stringify(err)).error
      console.log(`Login error: ${JSON.stringify(err)}`)
      this.errMsg = msg["errormessage"]
    })
  }

  deleteFriend(friend: string) {
    console.log("friend: ", friend)
    this.us.delete_friend(friend).subscribe((data) => {
      this.app.toastCust("Friend deleted")
      //this.toastN("Friend deleted")
      this.getFriendlist()
    })
  }


  notifyFriendReq() {
    if (!this.sio.isNull()) {
      this.subscriptionReq = this.sio.request().subscribe(msg => {
        this.msg = JSON.parse(JSON.stringify(msg)).type
        let user = JSON.parse(JSON.stringify(msg)).sender
        console.log(JSON.parse(JSON.stringify(msg)).type)
        //console.log('got a msg: ' + msg);
        if (msg) {
          this.app.toastCust("New " + this.msg + " by " + user)
          //this.toastN("New " + this.msg + " by " + user)
          //console.log('got a msg: ' + msg);
        }
        this.badgeContent = 0
        this.getNotification(false, true)
        this.getNotification(false)
      });
    }
  }

  blockUnblock(username: string, block: string) {
    let index = this.friendlist.findIndex((obj => obj.username == username))
    console.log(this.friendlist[index])
    if (block == "bi bi-person-check-fill") {
      this.us.block_unblock_friend(username, false).subscribe((data) => {
        //this.btnVal = "Block"
        this.friendlist[index].isBlocked = "bi bi-person-x-fill"
        this.app.toastCust("FRIEND UNBLOCKED")
        //this.toastN("FRIEND UNBLOCKED")
      })
    } else if (block == "bi bi-person-x-fill") {
      this.us.block_unblock_friend(username, true).subscribe((data) => {
        //his.btnVal = "UnBlocked"
        this.friendlist[index].isBlocked = "bi bi-person-check-fill"
        this.app.toastCust("FRIEND BLOCKED")
        //this.toastN("FRIEND BLOCKED")
      })
    }
  }
  foundGame(){
     /* Subscribe to a socket's listener, the lobby, for knwo if i find a match */
     this.gameReady = this.sio.gameReady().subscribe(msg => {
      console.log('got a msg lobby: ' + JSON.stringify(msg));
      if (msg.gameReady) {
        //rimuove il backdrop dei modal (bug di bootstrap)
        this.sio.setP2(msg.opponentPlayer)
        Array.from(document.getElementsByClassName('modal-backdrop')).forEach((item) => {
          item.parentElement?.removeChild(item);
        });
        this.router.navigate(['game']);
      }
      if (msg.gameReady != undefined && !msg.gameReady) {
        document.getElementById("closepfriend")!.click();
        document.getElementById("closepstrange")!.click();
        document.getElementById("closewfriend")!.click();
        document.getElementById("closewstrange")!.click();
        //chiudere il modal
        Array.from(document.getElementsByClassName('modal-backdrop')).forEach((item) => {
          item.parentElement?.removeChild(item);
        });
        this.app.toastCust("Friendly match refused")
      }
    });
  }
  notifyGameReq() {
    if (!this.sio.isNull()) {
      this.subscriptionReq = this.sio.gameRequest().subscribe(msg => {
        this.msg = JSON.parse(JSON.stringify(msg)).type
        let user = JSON.parse(JSON.stringify(msg)).player
        console.log(JSON.parse(JSON.stringify(msg)).type)
        //console.log('got a msg: ' + msg);
        if (msg) {
          this.app.toastCust("New " + this.msg + " by " + user)
          //this.toastN("New " + this.msg + " by " + user)
          //console.log('got a msg: ' + msg);
        }
        this.badgeContent = 0
        this.getNotification(false, true)
        this.getNotification(false)
      });
    }
  }

  notifyFriendReqAccepted() {
    if (!this.sio.isNull()) {
      this.subscriptionReq = this.sio.friendRequYN().subscribe(msg => {
        //this.msg = JSON.parse(JSON.stringify(msg)).type
        let user = JSON.parse(JSON.stringify(msg)).newFriend
        //console.log(JSON.parse(JSON.stringify(msg)).type)
        console.log('user: ' + user);
        if (msg) {
          if (user) {
            this.app.toastCust("You are now friend with " + user)
          } else {
            this.app.toastCust("Your friend request has been rejected")
          }
          //this.toastN("You are now friend with " + user)
          //console.log('got a msg: ' + msg);
        }
        this.getFriendlist()
      });
    }
  }

  notifyFriendDeleted() {
    if (!this.sio.isNull()) {
      this.subscriptionReq = this.sio.friendDeleted().subscribe(msg => {
        this.msg = JSON.parse(JSON.stringify(msg)).deletedFriend
        //let user = JSON.parse(JSON.stringify(msg)).newFriend
        //console.log(JSON.parse(JSON.stringify(msg)).type)
        console.log('msg Deleted Friend: ' + this.msg[0]);
        if (msg) {
          this.app.toastCust("The friend " + this.msg + " has removed you from the friendlist.")
          //this.toastN("The friend " + this.msg + " has removed you from the friendlist.")
          //console.log('got a msg: ' + msg);
        }
        this.getFriendlist()
      });
    }
  }

  //Is used to add a new friend in the friendlist, when the friendRequest is accepted 
  addFriendToFriendlist(sender: string, accepted: boolean) {
    console.log("sender: ", sender)
    this.us.add_friend(sender, accepted).subscribe((data) => {
      if(accepted){
        this.app.toastCust("Request Accepted")
      }else{
        this.app.toastCust("Request Rejected")
      }
      //this.toastN("Request Accepted")
      this.getFriendlist()
    })
  }
  //Is used to add a new friend in the friendlist, when the friendRequest is accepted 
  async acceptGamerequest(sender: string) {
    console.log("sender: ", sender)
    if (!this.sio.isNull()) {
      this.us.friendGame=true
      await this.router.navigate(['/home'])
      this.us.acceptFriendgame(sender,true).subscribe((msg)=>{
      })


    }
  }
  denyGamerequest(sender: string) {
    console.log("sender: ", sender)
    if (!this.sio.isNull()) {
      this.us.acceptFriendgame(sender, false).subscribe((msg) => { })
    }
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
      /*
      console.log("GetInpending: ")
      console.log(this.messageInpending)
      this.us.get_friend(username).subscribe((friend) => {
        this.messageInpending.forEach((element: any) => {
          if (element.sender == username) {
            //date.getUTCDay().toString()+"-"+date.getUTCMonth().toString()+"-"+date.getFullYear().toString()+" "+date.getUTCHours().toString()+":"+date.getUTCMinutes().toString()
            console.log("Sono gabbriel")
            numb++
            //console.log(this.num)
          }
        })
      })*/
    })
    //return this.messageInpending
  }

  getInpendingMsgMod() {
    this.subscriptionIn = this.us.get_userMessage(true).subscribe((elem: any) => {
      console.log("InpendingMsgMod:")
      console.log(elem.inPendingMessages)
      this.badgeContMod = 0
      this.messageInMod = elem.inPendingMessages
      this.messageInMod.forEach((element: any) => {
        if (element.receiver == this.us.get_username()) {
          this.badgeContMod++;
        }
      });
      console.log("badgeMod")
      console.log(this.badgeContMod)
      if(this.us.has_moderator_role()){
        this.badgeAllUs = this.badgeContMod
        this.badgeContMod = 0
      }
      if(this.badgeAllUs == 0){
        this.hideBadgeAll = true
      }else{
        this.hideBadgeAll = false
      }
      if (this.badgeContMod == 0) {
        this.hideBadgeMod = true
      } else {
        this.hideBadgeMod = false
      }
    })
  }

  readMessage(myus: string, username: string, modMessage: boolean) {
    console.log(this.router.parseUrl(this.router.url))
    this.us.readMessage(myus, username, modMessage).subscribe()
  }

  /*
    getFriendListEnorme() {
      this.subscriptionIn = this.us.get_userMessage().subscribe((elem: any) => {
        //console.log(elem.inPendingMessages)
        this.badgeContentMsg = 0
        this.messageInpending = elem.inPendingMessages
        this.us.get_friendlist().subscribe((u) => {
          this.friendlist = []
          u.friendlist.forEach((element: { [x: string]: any; }) => {
            let countMsg: number = 0
            let msgHide: boolean = true
            let col
            this.us.get_friend(element['username']).subscribe((friend) => {
              this.messageInpending.forEach((msg: any) => {
                if (msg.sender == element['username']) {
                  countMsg++
                }
                if (msg.receiver == this.us.get_username() && msg.sender == element['username']) {
                  this.badgeContentMsg++;
                }
              })
              //console.log(countMsg)
              //console.log(this.onlineUser)
              let sos = this.onlineUser.find((data: any) => { return data == element['username'] })
              //console.log("Sos")
              //console.log(sos)
              if (sos == element['username']) {
                col = "yellow"
              } else {
                col = "red"
              }
              if (countMsg != 0) {
                msgHide = false
              }
              if (element['isBlocked']) {
                this.friendlist.push({ id: element['_id'], username: element['username'], isBlocked: "bi bi-person-check-fill", badgeNum: countMsg, badgeHidden: msgHide, color: col })
              } else {
                this.friendlist.push({ id: element['_id'], username: element['username'], isBlocked: "bi bi-person-x-fill", badgeNum: countMsg, badgeHidden: msgHide, color: col })
              }
              if (this.badgeContentMsg == 0) {
                this.hideMatBadgeMsg = true
              } else {
                this.hideMatBadgeMsg = false
              }
            })
          });
        })
      })
    }*/
  notifyNewMsg() {
    if (!this.sio.isNull()) {
      //let g = this.router.parseUrl(this.router.url).root.children.primary.segments[0].path
      //if (g) {
      this.subscriptionMsg = this.sio.newMessage().subscribe((msg) => {
        console.log("Notify New Msg")
        console.log(msg)
        let isAModMessage = JSON.parse(JSON.stringify(msg)).isAModMessage
        let rec = JSON.parse(JSON.stringify(msg)).receiver
        let send = JSON.parse(JSON.stringify(msg)).sender
        let inpend = JSON.parse(JSON.stringify(msg)).inpending
        if (isAModMessage) {
          let g = this.router.parseUrl(this.router.url).root.children.primary.segments[0].path
          let g1 = ""
          if (this.router.parseUrl(this.router.url).root.children.primary.segments[1] != undefined) {
            g1 = this.router.parseUrl(this.router.url).root.children.primary.segments[1].path
          }
          //console.log("NotifyNewMsg")
          console.log(g1)
          if ("mod-chat" != g || g1 != send) {

            //console.log("NotifyNewMsg")
            if (inpend) {
              this.getInpendingMsgMod()
            }
            //console.log(g)
            //console.log(inpend)
            this.modlist.forEach((element: { [x: string]: any; }) => {
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
        } else {
          let g = this.router.parseUrl(this.router.url).root.children.primary.segments[0].path
          let g1 = ""
          if (this.router.parseUrl(this.router.url).root.children.primary.segments[1] != undefined) {
            g1 = this.router.parseUrl(this.router.url).root.children.primary.segments[1].path
          }
          //console.log("NotifyNewMsg")
          console.log(g1)
          if ("friend-chat" != g || g1 != send) {

            //console.log("NotifyNewMsg")
            if (inpend) {
              this.getInpendinMsg()
            }
            //console.log(g)
            //console.log(inpend)
            this.friendlist.forEach((element: { [x: string]: any; }) => {
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
            //this.getFriendlist()
            /*
            this.friendlist.forEach((element: { [x: string]: any; }) => {
              let countMsg: number = 0
              let msgHide: boolean = true
              let col
              this.us.get_friend(element['username']).subscribe((friend) => {
                this.messageInpending.forEach((msg: any) => {
                  if (msg.sender == element['username']) {
                    countMsg++
                  }
                  if (msg.receiver == this.us.get_username() && msg.sender == element['username']) {
                    this.badgeContentMsg++;
                  }
                })
                //console.log(countMsg)
                console.log(this.onlineUser)
                let sos = this.onlineUser.find((data: any) => { return data == element['username'] })
                console.log("Sos")
                console.log(sos)
                if (sos == element['username']) {
                  col = "yellow"
                } else {
                  col = "red"
                }
                if (countMsg != 0) {
                  msgHide = false
                }
                if (element['isBlocked']) {
                  this.friendlist.push({ id: element['_id'], username: element['username'], isBlocked: "bi bi-person-check-fill", badgeNum: countMsg, badgeHidden: msgHide, color: col })
                } else {
                  this.friendlist.push({ id: element['_id'], username: element['username'], isBlocked: "bi bi-person-x-fill", badgeNum: countMsg, badgeHidden: msgHide, color: col })
                }
                if (this.badgeContentMsg == 0) {
                  this.hideMatBadgeMsg = true
                } else {
                  this.hideMatBadgeMsg = false
                }
              })
            })*/
            //})
            //this.getFriendListEnorme()
          }
        }
      })
      // }
    }
  }



  notifyOnline() {
    if (!this.sio.isNull()) {
      this.subscriptionMsg = this.sio.isOnline().subscribe((msg) => {
        this.getUsOnline()

        let usern = JSON.parse(JSON.stringify(msg)).username
        let conn = JSON.parse(JSON.stringify(msg)).isConnected
        //console.log("NotifyOnline")
        //console.log(this.onlineUser)
        this.friendlist.forEach((element: { [x: string]: any; }) => {
          //console.log(element['username'])
          //console.log(usern)
          if (element['username'] == usern) {
            if (conn) {
              console.log("ONLINE")
              this.app.toastCust(usern + " è online.")
              //this.toastN(usern+" è online.")
              element['color'] = "#88D498"
            } else {
              console.log("OFFFLINE")
              this.app.toastCust(usern + " è offline.")
              //this.toastN(usern+" è offline.")
              element['color'] = "#A4A5AE"
            }
          }
          //console.log(element['color'])
        })
        /*
        this.us.get_friendlist().subscribe((elem) => {
          
          elem.friendlist.forEach((element: { [x: string]: any; }) => {
            console.log(element['username'])
            console.log(usern)
            if(element['username'] == usern){
              if(conn){
                element['color'] = "yellow"
                element['username'] = "Gigio"
              }else{
                element['color'] = "red"
              }
            }
            console.log(element['color'])
          })*/
        /*
        let sis = elem.find((data: any) => { return data.username == msg })
        console.log("uSERNAD")
        console.log(sis)
      })*/
      })
    }
  }

  navigate(route: String) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false
    this.router.onSameUrlNavigation = "reload"
    this.router.navigate([route])
  }

}
