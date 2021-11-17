import { Injectable } from '@angular/core';
import { UserHttpService } from './user-http.service';
// import * as io from 'socket.io-client';
import { io, Socket } from "socket.io-client"
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketioService {

  private socket: Socket | undefined;

  constructor(private us: UserHttpService) { }

  connect(): Observable<any> {

    this.socket = io(this.us.url,{
      withCredentials: true,
      extraHeaders: {
        "enableCORS": "true"
      }
    });

    return new Observable((observer) => {

      // The observer object must have two functions: next and error.
      // the first is invoked by our observable when new data is available. The
      // second is invoked if an error occurred
      if (this.socket) {
        // this.socket.on('broadcast', (m) => {
        //   console.log('Socket.io message received: ' + JSON.stringify(m));
        //   observer.next(m);

        // });

        // this.socket.on('error', (err) => {
        //   console.log('Socket.io error: ' + err);
        //   observer.error(err);
        // });
        this.socket.emit('saveClient', { username: this.us.get_username() })
      }

      // When the consumer unsubscribes, clean up data ready for next subscription.
      // return {
      //   unsubscribe() {
      //     this.socket.disconnect();
      //   }
      // };

    });

  }

}
