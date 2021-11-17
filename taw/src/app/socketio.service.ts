import { Injectable } from '@angular/core';
import { UserHttpService } from './user-http.service';
// import * as io from 'socket.io-client';
import { io, Socket } from "socket.io-client"
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketioService {

  private socket: Socket

  constructor(private us: UserHttpService) {
    this.socket = io(this.us.url, {
      withCredentials: true,
      extraHeaders: {
        "enableCORS": "true"
      }
    })
  }

  connect():void {

    // return new Observable((observer) => {


    //   if (this.socket) {
    //     this.socket.emit('saveClient', { username: this.us.get_username() })
    //   }

    //   // When the consumer unsubscribes, clean up data ready for next subscription.
    //   // return {
    //   //   unsubscribe() {
    //   //     this.socket.disconnect();
    //   //   }
    //   // };

    // });
    this.socket.emit('saveClient',{username:this.us.get_username()})
  }

}
