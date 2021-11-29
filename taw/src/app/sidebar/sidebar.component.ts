import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserHttpService } from '../user-http.service';
import { Socket } from 'socket.io-client';
import { SocketioService } from '../socketio.service';


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
  public role: string = ""
  public msg: string = ""

  constructor(private sio: SocketioService, private us: UserHttpService,private router:Router) {
    this.subscriptionName = this.us.get_update().subscribe((msg) => {
      // Update username and icon of logged user
      this.ngOnInit()
      
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
    this.sio.request().subscribe(msg => {
      this.msg = msg;
      console.log('got a msg: ' + msg);
    });
  }

  ngOnDestroy(): void {
    this.subscriptionName.unsubscribe()
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

  request(){
    this.sio.request().subscribe()
  }
  addFriend(receiver: String, type: String){
    this.sio.addFriend( receiver, type);
  }

  navigate(route: String) {
    this.router.navigate([route])
  }

}
