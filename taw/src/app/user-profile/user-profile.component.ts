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

  public ranking: any[] = []
  
  constructor(private us: UserHttpService, private router: Router) {  }

  ngOnInit(): void {
    
    if (!this.us.get_token()) {
      this.router.navigate(['/'])
    } else {
      this.username = this.us.get_username()
      this.avatarImg = this.us.get_avatarImgURL()
      this.mail = this.us.get_mail()
      this.role = this.us.get_role()

      this.us.getRankingstory().subscribe((r:any) => {
        this.ranking = r.matchmakingList
      })
  
      this.us.get_user().subscribe((u) => {
        this.name = u.name
        this.surname = u.surname
  
        this.statistics = []
  
        let draw = 0
        for (let [x, y] of Object.entries(u.statistics)) {
          let icon = ''
          if (x == "nGamesWon") {
            x = "Win"
            draw = y
            icon = 'bi-emoji-smile'
          } else if (x == "nGamesLost") {
            x = "Lost"
            draw-=y
            icon = 'bi-emoji-frown'
            this.statistics.push({name: "Draw", value:draw, icon: "bi-emoji-neutral"})
          } else if (x == "nTotalMoves") {
            x = "Total moves"
            icon = 'bi-arrows-move'
          } else if (x == "nGamesPlayed") {
            x = "Games played"
            icon = 'bi-joystick'
          }
          this.statistics.push({ name: x, value:y, icon: icon })
        }
        this.statistics.pop()
        this.statistics.pop()
        let play=this.statistics.pop()
        this.statistics.pop()
        this.statistics.push(play)
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
