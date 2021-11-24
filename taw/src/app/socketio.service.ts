import { Injectable } from '@angular/core';
import { UserHttpService } from './user-http.service';
import { io, Socket } from "socket.io-client"

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


  saveClient(): void {
    console.log("Save Client")
    this.socket.emit('saveClient',{username:this.us.get_username()})
  }


  leaveClient(): void{
    console.log("Non ancora implementato")
  }
}
