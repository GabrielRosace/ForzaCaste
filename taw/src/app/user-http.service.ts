import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable, Subject } from 'rxjs'
import { tap } from 'rxjs/operators'
import jwt_decode from 'jwt-decode'
import { isUser, User } from './User';

interface TokenData {
  username: string,
  roles: string,
  mail: string,
  id: string,
  state: string,
  avatarImgURL: string
}


@Injectable()
export class UserHttpService {

  private token = ''
  public url = 'http://localhost:8080' //TODO cambiare indirizzo
  private subjectName = new Subject<any>()


  send_update(message: string) {
    this.subjectName.next({ text: message })
  }

  get_update(): Observable<any> {
    return this.subjectName.asObservable()
  }

  constructor(private http: HttpClient) {
    console.log("User service instantiated")

    this.token = localStorage.getItem('app_token') || ''


    if (this.token.length < 1) {
      console.log("No token found in local storage")
    } else {
      console.log("JWT loaded from local storage")
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
        if (remember) {
          localStorage.setItem('app_token', this.token)
        }
      })
    )
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
    localStorage.setItem('app_token', this.token)
    this.send_update("User logged out")
  }

  whoami() {
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`
      })
    }
    let response;
    try {
      response = this.http.get(`${this.url}/whoami`,options)
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
    return (jwt_decode(this.token) as TokenData).avatarImgURL
  }

  get_mail() {
    return (jwt_decode(this.token) as TokenData).mail
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
  get_friendlist():Observable<any> {
    const options = {
      headers: new HttpHeaders({
        'authorization': `Bearer ${this.get_token()}`,
      })
    }
    return this.http.get(`${this.url}/friend`,options)
  }

  has_moderator_role():boolean {
    return this.get_role() === 'MODERATOR'
  }

  has_nonregmod_role():boolean {
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
}
