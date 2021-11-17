import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css']
})
export class UserLoginComponent implements OnInit {


  public errmessage: string = ''

  constructor(private us: UserHttpService, private router: Router) { }

  ngOnInit(): void {
    if (this.us.get_token()) {
      let response = this.us.whoami()
      if (response) {
        response.subscribe((username) => {
          console.log(`Hello, ${username}`)
          this.router.navigate(["/home"])
        }, (err) => {
          console.log("Your token is expired!")
          this.us.logout()
          this.router.navigate(["/login"])
        })
      } else {
        console.log("Your token is expired!")
        this.us.logout()
        this.router.navigate(["/login"])
      }
    }
  }

  login(username: string, password: string, remember: boolean) {
    this.us.login(username, password, remember).subscribe((d) => {
      // console.log(`User service token: ${this.us.get_token()}`)

      this.errmessage = ''

      this.us.send_update("User logged in") // Notify to subscriber that jwt change

      if (this.us.has_nonregmod_role()) {
        // console.log("Bisogna bloccare le info e fargli cambiare tutto") //TODO
        this.router.navigate(['/profile'])
        // this.modalFirstLoginComponent.nativeElement.click()
      } else {
        this.router.navigate(['/home'])
      }

    }, (err) => {
      console.log(`Login error: ${JSON.stringify(err)}`)
      this.errmessage = err.message
      this.us.logout()
      this.router.navigate(['/'])
    })
    return false // prevent form to reload page
  }

}
