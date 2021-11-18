import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-user-signin',
  templateUrl: './user-signin.component.html',
  styleUrls: ['./user-signin.component.css']
})
export class UserSigninComponent implements OnInit {

  public errmessage: string = ''

  constructor(private us: UserHttpService, private router: Router) { }

  ngOnInit(): void {
  }

  signin(username: string, password: string, name: string, surname: string, mail: string, avatarImgURL: string) {
    this.us.signin(username, password, name, surname, mail, avatarImgURL).subscribe((d) => {
      this.errmessage = ''
      this.router.navigate(['/'])
    }, (err) => {
      console.log(`Signin error: ${JSON.stringify(err)}`);
      this.errmessage = err.message
    })

    return false
  }

}