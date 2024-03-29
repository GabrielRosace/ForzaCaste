import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-user-signin',
  templateUrl: './user-signin.component.html',
  styleUrls: ['./user-signin.component.css']
})
export class UserSigninComponent implements OnInit {
  
  public showPassword:boolean = false
  public errmessage: string = ''
  @ViewChild("img") img!: ElementRef
  @ViewChild('password') psw!: ElementRef
  @ViewChild('checkpassword') checkpsw!: ElementRef
  @ViewChild('btnConfirm') btnConfirm!: ElementRef

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

  randomImage(username: string) {
    let sprite = "bottts"
    let random = Math.random()
    this.img.nativeElement.value = `https://avatars.dicebear.com/api/${sprite}/${username}${random}.svg`
  }

  showPsw() {
    this.showPassword = !this.showPassword
  }

  checkPassword() {
    if (this.checkpsw.nativeElement.value == this.psw.nativeElement.value) {
      this.btnConfirm.nativeElement.disabled = false
    } else {
      this.btnConfirm.nativeElement.disabled = true
    }
  }

}
