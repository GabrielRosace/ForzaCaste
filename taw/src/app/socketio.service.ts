import { Injectable } from '@angular/core';
import { UserHttpService } from './user-http.service';
import { io, Socket } from "socket.io-client"
import { Observable, observable } from 'rxjs';
import { NULL_EXPR } from '@angular/compiler/src/output/output_ast';

@Injectable({
  providedIn: 'root'
})
export class SocketioService {

  private socket!: Socket;
  private opponent!:string;

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
  getOpponent(){
    return this.opponent;
  }
  setOpponent(opponent:string){
    this.opponent=opponent;
  }
  gameChat():Observable<any>{

    console.log(" Created gameChat")
    return new Observable(observer => {
      this.socket.on('gameChat', msg => {
        observer.next(msg);
      });
    });
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
  /*TO REMOVE

  makemove(col:String){
    console.log(" Created makemove")
    console.log(this.us.get_username())
    this.socket.emit('move',{username:this.us.get_username(),move:col})
  }*/
  gameReady():Observable<any>{
    console.log("Created gameReady")
    return new Observable(observer => {
      this.socket.on('gameReady', msg => {
        observer.next(msg);
      });
    });
  }
  creatematchroomemit(): void {
    console.log("createMatchRoom emit")
    this.socket.emit('createMatchRoom',{username:this.us.get_username()})
  }
/*
  addFriend(receiver: String, type: String): void{
    console.log("Add friend", this.us.get_username())
    let clientMessage = JSON.stringify({error : false, username: this.us.get_username(), receiver: receiver, type: type})
    console.log(clientMessage)
    this.socket.emit('notification',JSON.parse(clientMessage))
  } */

  request(){
    return new Observable<string>(observer =>{
      this.socket.on('newNotification', msg => {
        observer.next(msg);
      });
    })
  }
  
  gameRequest(){
    return new Observable<string>(observer =>{
      this.socket.on('gameRequest', msg => {
        observer.next(msg);
      });
    })
  }

  friendReqAccepted(){
    return new Observable<string>(observer =>{
      this.socket.on('acceptedRequest', msg => {
        observer.next(msg);
      });
    })
  }

  newMessage(){
    return new Observable<string>(observer =>{
      this.socket.on('message', msg => {
        observer.next(msg);
      });
    })
  }
  friendDeleted(){
    return new Observable<string>(observer =>{
      this.socket.on('friendDeleted', msg => {
        observer.next(msg);
      });
    })
  }

  isOnline(){
    return new Observable<string>(observer =>{
      this.socket.on('online', msg => {
        observer.next(msg);
      });
    })
  }

  beingBlocked(){
    return new Observable<string>(observer =>{
      this.socket.on('friendBlocked', msg => {
        observer.next(msg);
      });
    })
  }
  isNull(){
    return this.socket == null
  }
  disconnect(): void{
    this.socket.close()
  }
}
