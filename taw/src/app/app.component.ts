import { Component, OnDestroy, OnInit } from '@angular/core'
import { Router } from '@angular/router';
import { SocketioService } from './socketio.service'
import { UserHttpService } from './user-http.service'
// import { SocketioService } from './socketio.service';
import { ToastService } from './_services/toast.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent{
  title = 'taw'

  constructor(private us: UserHttpService, private socket: SocketioService, public toastService: ToastService, public router: Router) {
    
  }

  checkCurrentSession() {
    if (this.us.get_token()) {
      this.us.whoami()?.subscribe((msg:any) => {
        if (msg.hasOwnProperty("token")) {
          console.log("Token refresh")
          this.us.updateToken(msg.token)
          this.us.updateUserInfo()
          this.socket.disconnect()
          this.socket.connect()
        }
      }, (err:any) => {
        console.log(`ERROR: ${err}`)
      })
    }
  }

  updateFriendListVS(){
    console.log("ROUTING")
    console.log(this.router.url)
    if(this.router.url == "/game" || this.router.url == "/cpu"){
      this.us.update_visibleFriendList(false)
    }else{
      this.us.update_visibleFriendList(true)
    }
  }

  check(){
    this.updateFriendListVS()
    this.checkCurrentSession()
  }
  
/*
  showStandard() {
    console.log("salve")
    this.toastService.show('I am a standard toast', {
      delay: 2000,
      autohide: true
    });
  }

  showSuccess() {
    this.toastService.show('I am a success toast', {
      classname: 'bg-success text-light',
      delay: 2000 ,
      autohide: true,
      headertext: 'Toast Header'
    });
  }
  showError() {
    this.toastService.show('I am a success toast', {
      classname: 'bg-danger text-light',
      delay: 2000 ,
      autohide: true,
      headertext: 'Error!!!'
    });
  }*/

  toastCust(customTpl: string) {
    let constoptions= { positionClass:'toast-custom' };
    this.toastService.show(customTpl, {
      classname: 'bg-info text-light',
      delay: 3000,
      autohide: true,
      positionClass:'toast-custom'
    });
  }
}
