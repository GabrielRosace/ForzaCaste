import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { ToastService } from '../_services/toast.service';

import { UserHttpService } from '../user-http.service';
import { AppModule } from '../app.module';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  @ViewChild('closeModal') closeModalComponent!: ElementRef
  @ViewChild("changedimg") img!: ElementRef
  @ViewChild('rankingchart') chart!: ElementRef


  public name: string = ''
  public username: string = ''
  public surname: string = ''
  public avatarImg: string = ''
  public mail: string = ''
  public role: string = ''
  private statistics: any[] = []

  public lineChartData: any[] = [];
  public lineChartLabels: any[] = [];
  public lineChartOptions = {
    responsive: true,
  };
  public lineChartLegend = true;
  public lineChartType:ChartType = 'line';
  public lineChartPlugins = [];

  public showPassword:boolean = false


  public gameStats: any[] = []
  public totalGames: any

  public ranking: any[] = []

  constructor(private app: AppComponent,private us: UserHttpService, private router: Router, private toast: ToastService) {
    
  }

  ngOnInit(): void {

    if (!this.us.get_token()) {
      this.router.navigate(['/'])
    } else {
      this.username = this.us.get_username()
      this.avatarImg = this.us.get_avatarImgURL()
      this.mail = this.us.get_mail()
      this.role = this.us.get_role()

      if (!this.us.has_nonregmod_role()) {
        // getting ranking history to create graph
        this.us.getRankingstory().subscribe((r: any) => {
          this.ranking = r.matchmakingList

          // Push ranking into array to build line chart
          let arr = []
          for (let i = 0; i < this.ranking.length; i++) {
            arr.push(this.ranking[i].ranking)
          }

          this.lineChartLabels = new Array(arr.length).fill('')
          this.lineChartData = [{ data: arr, label: "Ranking" }]
        })

        // getting user information to show statistics
        this.us.get_user().subscribe((u) => {
          this.name = u.name
          this.surname = u.surname

          this.statistics = []

          // calculate number of play finished with draw
          let draw = 0
          // Pushing interesting stats to be showed
          for (let [x, y] of Object.entries(u.statistics)) {
            if (x == "nGamesWon") {
              this.gameStats.push({ name: "Win", value: y, icon: "bi-emoji-smile" })
              draw -= y
            } else if (x == "nGamesLost") {
              this.gameStats.push({ name: "Lost", value: y, icon: "bi-emoji-frown" })
              draw -= y
            } else if (x == "nGamesPlayed") {
              this.gameStats.push({ name: "Draw", value: y + draw, icon: "bi-emoji-neutral" })
            }
          }
        })
      }
    }

  }

  updateUserInfo(name: string, surname: string, mail: string, img: string, password: string, oldpassword:string) {
    this.us.updateUser(name, surname, mail, img, password, oldpassword).subscribe(() => {
      this.us.logout()
      this.app.toastCust("Please, login again")
      this.closeModalComponent.nativeElement.click()
      this.us.logout()
      this.router.navigate(['/'])
    }, e => {
      this.app.toastCust("Wrong password, retry")
    })
    return false
  }

  randomImage(username: string = this.username) {
    let sprite = "bottts"
    let random = Math.random()
    this.img.nativeElement.value = `https://avatars.dicebear.com/api/${sprite}/${username}${random}.svg`
  }

  showPsw() {
    this.showPassword = !this.showPassword
  }

}
