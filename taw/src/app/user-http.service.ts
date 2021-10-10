import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable, Subject } from 'rxjs'
import { tap } from 'rxjs/operators'
import jwt_decode from 'jwt-decode'

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
    this.subjectName.next({text:message})
  }

  get_update():Observable<any> {
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
        // console.log(JSON.stringify(data))
        this.token = data.token
        if (remember) {
          localStorage.setItem('app_token', this.token)
        }
      })
    )

  }

  logout() {
    console.log("Logging out")
    this.token = ''
    localStorage.setItem('app_token', this.token)
    this.send_update("User logged out") 
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
}
