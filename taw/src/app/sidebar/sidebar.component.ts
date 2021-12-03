import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserHttpService } from '../user-http.service';
import { Socket } from 'socket.io-client';
import { SocketioService } from '../socketio.service';
import { AppComponent } from '../app.component';
import { ToastService } from '../_services/toast.service';


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
  private subscriptionReq: Subscription
  public role: string = ""
  public friendlist: any[] = []
  public msg: string = ""

  constructor(private toast: ToastService, private sio: SocketioService, private us: UserHttpService,private router:Router) {
    this.subscriptionName = this.us.get_update().subscribe((msg) => {
      // Update username and icon of logged user
      msg = msg.text

      if (msg == "User logged out") {
        this.tok = ''
        this.username = ''
        this.avatarImgURL = ''
      } else if (msg == "User logged in") {
        this.tok = this.us.get_token()
        this.username = this.us.get_username()
      } else if (msg == "Update user") {
        this.avatarImgURL = this.us.get_avatarImgURL()
      }
    })

    this.subscriptionReq = this.sio.request().subscribe(msg => {
      this.msg =JSON.parse(JSON.stringify(msg)).message
      console.log('got a msg: ' + msg);
      if(msg){
        this.toastN(msg)
        console.log('got a msg: ' + msg);
      }
    });

    this.us.get_friendlist().subscribe((u) => {
      this.friendlist = []
      console.log()
      u.friendlist.forEach((element: { [x: string]: any; }) => {
        console.log(1)
        this.friendlist.push({ id: element['_id'], username: element['username'], isBlocked: element['isBlocked'] })
        console.log(this.friendlist);
      });
      console.log(this.friendlist);
    })
  }

  ngOnInit(): void {
    this.tok = this.us.get_token()
    if (this.tok) {
      this.username = this.us.get_username()
      this.avatarImgURL = this.us.get_avatarImgURL()
      this.role = this.us.get_role()
    } else {
      this.username = ''
      this.avatarImgURL = ''
    }
  }

  ngOnDestroy(): void {
    this.subscriptionName.unsubscribe()
    this.subscriptionReq.unsubscribe()
  }

  has_moderator_role(): boolean{
    if (this.tok) {
      return this.us.has_moderator_role()
    }
    return false
  }

  has_nonregmod_role(): boolean{
    if (this.tok) {
      return this.us.has_nonregmod_role()
    }
    return false
  }

  toastN(msg: string) {
    this.toast.show(msg, {
      classname: 'bg-info text-light',
      delay: 7000,
      autohide: true
    });
  }

  request(){
    console.log()
    this.sio.request().subscribe()
  }

  addFriend(receiver: string, type: string){
    console.log("receiver: ", receiver)
    this.us.add_friendRequest(receiver).subscribe((data) => {
      this.toastN("Request Forwarded")
    })
  }

  navigate(route: String) {
    this.router.navigate([route])
  }

}
