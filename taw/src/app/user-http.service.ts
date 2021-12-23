import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable, Subject } from 'rxjs'
import { tap } from 'rxjs/operators'
import jwt_decode from 'jwt-decode'
import { isUser, User } from './User';
import { Router } from '@angular/router';

interface TokenData {
  username: string,
  roles: string,
  // mail: string,
  id: string,
  // state: string,
  // avatarImgURL: string
}


@Injectable()
export class UserHttpService {

  private token = ''
  public url = 'http://localhost:8080' //TODO cambiare indirizzo
  private subjectName = new Subject<any>()
  // public userRole: string = ''
  private img: string = ''
  private mail: string = ''

  private rememberToken: boolean = false


  send_update(message: string) {
    this.subjectName.next({ text: message })
  }

  get_update(): Observable<any> {
    return this.subjectName.asObservable()
  }

  constructor(private http: HttpClient,private router:Router) {
    console.log("User service instantiated")

    this.token = localStorage.getItem('app_token') || ''


    if (this.token.length < 1) {
      console.log("No token found in local storage")
      // this.router.navigate(['login'])
      this.send_update("No token found in local storage")
    } else {
      this.updateUserInfo()
      console.log("JWT loaded from local storage")
    }
  }

  updateUserInfo() {
    this.get_user().subscribe((u) => {
      this.mail = u.mail
      this.img = u.avatarImgURL
      // this.userRole = u.role
      this.send_update("Update user")
    })
  }


  updateToken(payload: string) {
    if (this.rememberToken) {
      localStorage.setItem('app_token', payload)
    } else {
      sessionStorage.setItem('app_token', payload)
    }
    this.token = payload

    if (payload == '') {
      this.rememberToken? localStorage.clear():sessionStorage.clear()
    }
  }

  login(username: string, password: string, remember: boolean): Observable<any> {
    console.log(`Login: ${username} ${password}`)

    const basicAuth = btoa(`${username}:${password}`)

    const options = {
      headers: new HttpHeaders({
        authorization: `Basic: ${basicAuth}`,
        'cache-control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded',
      })
    }

    return this.http.get(`${this.url}/login`, options,).pipe(
      tap((data: any) => {
        this.token = data.token
        this.rememberToken = remember
        this.updateToken(this.token)
        this.updateUserInfo()
      })
    )
  }


  getRankingstory() {
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`
      })
    }
    return this.http.get(`${this.url}/rankingstory`,options)
  }

  getFriendRankingHistory(friend: string){
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`
      })
    }
    return this.http.get(`${this.url}/rankingstory/${friend}`,options)
  }

  signin(username: string, password: string, name: string, surname: string, mail: string, avatarImgURL: string) {
    console.log(`Creation of user ${username}`);

    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }

    const body = {
      username: username,
      password: password,
      name: name,
      surname: surname,
      mail: mail,
      avatarImgURL: avatarImgURL
    }

    return this.http.post(`${this.url}/users`, body, options)

  }

  updateUser(name:string, surname: string, mail: string, img: string, password: string):Observable<any>{
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`
      })
    }

    const body = {
      username: this.get_username(),
      name:name,
      surname: surname,
      mail: mail,
      avatarImgURL: img,
      password: password
    }

    return this.http.put(`${this.url}/users`,body,options)
  }

  
  logout() {
    console.log("Logging out")
    this.token = ''
    this.img = ''
    this.mail = ''
    this.updateToken(this.token)
    this.send_update("User logged out")
  }

  whoami(): any {
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`
      })
    }
    let response;
    try {
      return response = this.http.get(`${this.url}/whoami`, options)
    } catch (error) {
      console.log(error);
    }
    return response;
  }
  
  get_token() {
    return this.token
  }

  get_username() {
    return (jwt_decode(this.token) as TokenData).username
  }

  get_avatarImgURL() {
    return this.img
  }

  get_mail() {
    return this.mail
  }

  get_role() {
    return (jwt_decode(this.token) as TokenData).roles
  }

  get_user(): Observable<User> {
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`,
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      })
    }
    return this.http.get<User>(`${this.url}/users/${this.get_username()}`, options)
  }

  get_friend(friend: string): Observable<User> {
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`,
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      })
    }
    return this.http.get<User>(`${this.url}/users/${friend}`, options)
  }

  get_friendlist():Observable<any> {
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`,
      })
    }
    return this.http.get(`${this.url}/friend`,options)
  }

  get_notification(makeNotificationRead: boolean, inpending?: boolean):Observable<any> {
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`,
      }),
    }/*
    const query = {
      inpending: inpending,
      makeNotificationRea: makeNotificationRea,
    }*/
    if(inpending != undefined){
      return this.http.get(`${this.url}/notification?inpending=${inpending}&makeNotificationRead=${makeNotificationRead}`,options)
    }else{
      return this.http.get(`${this.url}/notification?makeNotificationRead=${makeNotificationRead}`,options)
    }
  }

  add_friendRequest(receiver: string){
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`,
      })
    }
    const body = {
      type: "friendRequest",
      receiver: receiver,
    }
    return this.http.post(`${this.url}/notification`,body,options)
  }

  create_matchmaking(){
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`
      })
    }
    const body = {
      type: "randomMatchmaking",
    }
    return this.http.post(`${this.url}/game`,body,options)

  }

  create_friendlymatchmaking(username: string){
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`
      })
    }
    const body = {
      type: "friendlyMatchmaking",
      oppositePlayer: username,
    }
    return this.http.post(`${this.url}/game`,body,options)

  }

  block_unblock_friend(username: string, block: boolean){
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`
      })
    }
    const body = {
      username: username,
      isBlocked: block,
    }
    return this.http.put(`${this.url}/friend`,body,options)
  }

  has_moderator_role():boolean {
    // return this.userRole === 'MODERATOR'
    return this.get_role() === 'MODERATOR'
  }

  has_nonregmod_role():boolean {
    // return this.userRole === 'NONREGMOD'
    return this.get_role() === 'NONREGMOD'
  }

  create_new_mod(username: string, password: string) {
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`
      })
    }

    const body = {
      username: username,
      password: password
    }


    return this.http.post(`${this.url}/users/mod`,body,options)
  }

  delete_user(username: string) {
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`
      })
    }
    return this.http.delete(`${this.url}/users/${username}`,options)
  }

  add_friend(sender: string, accepted: boolean){
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`
      })
    }
    const body = {
      sender: sender,
      accepted: accepted,
    }

    return this.http.put(`${this.url}/notification`,body,options)
  }

  delete_friend(username: string) {
    console.log("Friend 2: "+username)
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`
      })
    }
    return this.http.delete(`${this.url}/friend/${username}`,options)
    
  }

  get_userlist() {
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`
      })
    }
    return this.http.get(`${this.url}/users`,options)
  }

  makemove(col: number) {
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`
      })
    }
    const body = {
      move: String(col)
    }
    return this.http.post(`${this.url}/move`,body,options)
  }

  sendMessage(text: string) {
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`
      })
    }
    const body = {
      player: this.get_username(),
      message:text
    }
    return this.http.post(`${this.url}/gameMessage`,body,options)
  }

  get_userMessage(){
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`
      })
    }
    return this.http.get(`${this.url}/message`,options)
  }
  
  send_chatMsg(receiver: string, message: string){
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`
      })
    }
    const body = {
      receiver: receiver,
      message: message
    }
    return this.http.post(`${this.url}/message`,body,options)
  }

  readMessage(receiver: string, sender: string){
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`
      })
    }
    const body = {
      username: receiver,
      sender: sender
    }
    return this.http.put(`${this.url}/message`,body,options)
  }
  get_usersOnline(){
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`,
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      })
    }
    return this.http.get(`${this.url}/users/online`, options)
  }
  get_Otheruser(username:string): Observable<User> {
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`,
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      })
    }
    return this.http.get<User>(`${this.url}/users/${username}`, options)
  }
}

