import { Injectable } from '@angular/core';
import { UserHttpService } from './user-http.service';
import { io, Socket } from "socket.io-client"
import { Observable, observable } from 'rxjs';

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

  creatematchroom() {
    console.log("Created createMatchRoom")
    return new Observable(observer => {
      this.socket.on('createMatchRoom', msg => {
        observer.next(msg);
      });
    });
  }
  move(){
    console.log(" Created move")
    return new Observable(observer => {
      this.socket.on('move', msg => {
        observer.next(msg);
      });
    });
  }
  lobby(){
    console.log("Created lobby")
    return new Observable(observer => {
      this.socket.on('lobby', msg => {
        observer.next(msg);
      });
    });
  }
  creatematchroomemit(): void {
    console.log("createMatchRoom emit")
    this.socket.emit('createMatchRoom',{username:this.us.get_username()})
  }
  saveClient(): void {
    console.log("Save Client")
    this.socket.emit('saveClient',{username:this.us.get_username()})
  }

  addFriend(receiver: String, type: String): void{
    console.log("Add friend")
    this.socket.emit('notification',{username:this.us.get_username(), receiver, type})
  } 

  request(){
    return new Observable<string>(observer =>{
      this.socket.on('friendNot', msg => {
        observer.next(msg);
      });
    })
  }
  leaveClient(): void{
    console.log("Non ancora implementato")
  }
}
