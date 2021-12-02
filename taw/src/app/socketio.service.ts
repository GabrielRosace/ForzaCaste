import { Injectable } from '@angular/core';
import { UserHttpService } from './user-http.service';
import { io, Socket } from "socket.io-client"
import { Observable, observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketioService {

  private socket!: Socket;

  constructor(private us: UserHttpService) {
  }

  connect() {
    this.socket = io(`${this.us.url}?jwt=${this.us.get_token()}`, {
      withCredentials: true,
      extraHeaders: {
        "enableCORS": "true"
      }
    })
  }
  result():Observable<any>{

    console.log(" Created result")
    return new Observable(observer => {
      this.socket.on('result', msg => {
        observer.next(msg);
      });
    });
  }
  gameStatus(){
    console.log(" Created gameStatus")
    return new Observable(observer => {
      this.socket.on('gameStatus', msg => {
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
  makemove(col:String){
    console.log(" Created makemove")
    console.log(this.us.get_username())
    this.socket.emit('move',{username:this.us.get_username(),move:col})
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
  disconnect(): void{
    this.socket.close()
  }
}
