import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css']
})
export class UserLoginComponent implements OnInit {

  public errmessage:string = ''

  constructor(private us: UserHttpService, private router: Router) { }

  ngOnInit(): void {
    if (this.us.get_token()) {
      this.router.navigate(["/home"])
    }
  }

  login(username: string, password: string, remember: boolean) {
    this.us.login(username, password, remember).subscribe((d) => {
      // console.log(`User service token: ${this.us.get_token()}`)

      this.errmessage = ''
      
      this.us.send_update("User logged in") // Notify to subscriber that jwt change
      
      if (this.us.has_nonregmod_role()) {
        console.log("Bisogna bloccare le info e fargli cambiare tutto") //TODO
      } else {
        this.router.navigate(['/home'])
      }
      
    }, (err) => {
      console.log(`Login error: ${JSON.stringify(err)}`)
      this.errmessage = err.message
    })
    return false // prevent form to reload page
  }

}
