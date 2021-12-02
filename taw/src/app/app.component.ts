import { Component, OnDestroy, OnInit } from '@angular/core'
import { SocketioService } from './socketio.service'
import { UserHttpService } from './user-http.service'
// import { SocketioService } from './socketio.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent{
  title = 'taw'

  constructor(private us: UserHttpService, private socket: SocketioService) {
    
  }

  checkCurrentSession() {
    if (this.us.get_token()) {
      this.us.whoami()?.subscribe((msg:any) => {
        if (msg.hasOwnProperty("token")) {
          console.log("Token refresh")
          this.us.updateToken(msg.token)
          this.socket.disconnect()
          this.socket.connect()
        }
      }, (err:any) => {
        console.log(`ERROR: ${err}`)
      })
    }
  }

}
