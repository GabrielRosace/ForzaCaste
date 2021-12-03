import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { registerables, Chart, ChartType } from 'chart.js';
// import { Chart, ChartConfiguration, LineController, LineElement, PointElement, LinearScale, Title} from 'chart.js' 
// import { Chart } from 'chart.js/auto';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  @ViewChild('closeModal') closeModalComponent!: ElementRef
  @ViewChild("changedimg") img!: ElementRef
  @ViewChild('rankingchart') chart!: ElementRef
  
  // public lineChartType: ChartType = 'line'
    
  public name: string = ''
  public username: string = ''
  public surname: string = ''
  public avatarImg: string = ''
  public mail: string = ''
  public role: string = ''
  private statistics: any[] = []

  public gameStats: any[] = []
  public totalGames: any

  public ranking: any[] = []
  
  constructor(private us: UserHttpService, private router: Router) {  
    Chart.register(...registerables)
  }

  ngOnInit(): void {
    
    if (!this.us.get_token()) {
      this.router.navigate(['/'])
    } else {
      this.username = this.us.get_username()
      this.avatarImg = this.us.get_avatarImgURL()
      this.mail = this.us.get_mail()
      this.role = this.us.get_role()

      // getting ranking history to create graph
      this.us.getRankingstory().subscribe((r:any) => {
        this.ranking = r.matchmakingList 
        
        // Push ranking into array to build line chart
        let arr = []
        for (let i = 0; i < this.ranking.length; i++){
          arr.push(this.ranking[i].ranking)
        }
        
        
        const data = {
          labels: new Array(arr.length).fill(''), // I don't want to see labels, so i create an array of empty string
          datasets: [{
            label: 'Ranking history',
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: arr,
          }]
        };
        const line :ChartType = 'line'
        const config = {
          type: line,
          data: data,
          option: {
            responsive: true
          }
        }

        const myChart = new Chart(this.chart.nativeElement.getContext('2d'), config)
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
            this.gameStats.push({ name: "Draw", value: y+draw, icon: "bi-emoji-neutral"})
          }
        }
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

  randomImage(username: string = this.username) {
    let sprite = "bottts"
    let random = Math.random()
    this.img.nativeElement.value = `https://avatars.dicebear.com/api/${sprite}/${username}${random}.svg`
  }
  
}
