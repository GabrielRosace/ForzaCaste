import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Socket } from 'socket.io-client';
import { SocketioService } from '../socketio.service';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css']
})
export class UserLoginComponent implements OnInit {


  public errmessage: string = ''
  public showPassword:boolean = false

  constructor(private sio: SocketioService, private us: UserHttpService, private router: Router) {
  }

  ngOnInit(): void {
    if (this.us.get_token()) {
      let response = this.us.whoami()
      if (response) {
        response.subscribe((username:any) => {
          console.log(`Hello, ${username}`)

          // Register client to socket.io
          this.sio.connect()

          this.router.navigate(["/home"])
        }, (err:any) => {
          console.log("Your token is expired!")
          this.us.logout()
          this.router.navigate(["/login"])
        })
      } else {
        console.log("Your token is expired!")
        this.us.logout()
        this.router.navigate(["/login"])
      }
    }
  }

  showPsw() {
    this.showPassword = !this.showPassword
  }

  login(username: string, password: string, remember: boolean) {
    this.us.login(username, password, remember).subscribe((d) => {

      this.errmessage = ''

      this.us.send_update("User logged in") // Notify to subscriber that jwt change

      // Register client to socket.io
      this.sio.connect()

      if (this.us.has_nonregmod_role()) {
        this.router.navigate(['/profile'])
      } else {  
        this.router.navigate(['/home'])
      }

    }, (err) => {
      console.log(err)
      this.errmessage = "Login failed, please check your credentials"
      this.us.logout()
    })
    return false // prevent form to reload page
  }
}
