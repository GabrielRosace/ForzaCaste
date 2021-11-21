import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  @ViewChild('closeModal') closeModalComponent!: ElementRef
  
    
  public name: string = ''
  public username: string = ''
  public surname: string = ''
  public avatarImg: string = ''
  public mail: string = ''
  public role: string = ''
  public statistics: any[] = []
  
  constructor(private us: UserHttpService, private router: Router) {  }

  ngOnInit(): void {
    
    if (!this.us.get_token()) {
      this.router.navigate(['/'])
    } else {
      this.username = this.us.get_username()
      this.avatarImg = this.us.get_avatarImgURL()
      this.mail = this.us.get_mail()
      this.role = this.us.get_role()
  
      this.us.get_user().subscribe((u) => {
        this.name = u.name
        this.surname = u.surname
  
        this.statistics = []
  
        for (let [x, y] of Object.entries(u.statistics)) {
          this.statistics.push({ name: x, value:y })
        }
        this.statistics.pop()
      })  
    }

  }

  updateUserInfo(name:string,surname:string,mail:string,img:string,password:string) {
    this.us.updateUser(name, surname, mail, img, password).subscribe(() => {
      this.us.logout()
      this.closeModalComponent.nativeElement.click()
      this.router.navigate(['/'])
    })
    return false
  }
  
}
