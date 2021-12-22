import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { registerables, Chart, ChartType } from 'chart.js';
// import { Chart, ChartConfiguration, LineController, LineElement, PointElement, LinearScale, Title} from 'chart.js' 
// import { Chart } from 'chart.js/auto';
import { UserHttpService } from '../user-http.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-friend-stats',
  templateUrl: './friend-stats.component.html',
  styleUrls: ['./friend-stats.component.css']
})
export class FriendStatsComponent implements OnInit {
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

  public gameStats: any[] = []
  public totalGames: any

  public ranking: any[] = []

  constructor(private us: UserHttpService, private router: Router, private activeRoute: ActivatedRoute) {
    Chart.register(...registerables)
  }

  ngOnInit(): void {
    // Aggiungi in user-http.service.ts un metodo get_user ma con username passato get_user(username)
    if (!this.us.get_token()) {
      this.router.navigate(['/'])
    } else {
      console.log("Friend-stats: " + this.activeRoute.snapshot.params['friend'])
      this.us.get_friend(this.activeRoute.snapshot.params['friend']).subscribe((u) => {
        this.username = u.username
        this.avatarImg = u.avatarImgURL
        this.mail = u.mail
        this.role = u.role

        if (!this.us.has_nonregmod_role()) {
          // getting ranking history to create graph
          this.us.getFriendRankingHistory(u.username).subscribe((r: any) => {
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
        }
      })
    }
  }
}

