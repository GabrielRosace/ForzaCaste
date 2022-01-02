import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';
import { SocketioService } from '../socketio.service';
import { Subscription } from 'rxjs';
import { ToastService } from '../_services/toast.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {
  public username: string = ''
  public friendlist: any[] = []
  public gameReady: Subscription
  private enterGameWatchMode!: Subscription;
  public foundwatch: boolean = true

  constructor(private toast: ToastService, private sio: SocketioService, private us: UserHttpService, private router: Router) {
    /* Subscribe to a socket's listener, the lobby, for knwo if i find a match */
    this.gameReady = this.sio.gameReady().subscribe(msg => {
      console.log('got a msg lobby: ' + JSON.stringify(msg));
      if (msg.gameReady) {
        //rimuove il backdrop dei modal (bug di bootstrap)
        this.sio.setP2(msg.opponentPlayer)
        Array.from(document.getElementsByClassName('modal-backdrop')).forEach((item) => {
          item.parentElement?.removeChild(item);
        });
        this.router.navigate(['game']);
      }
      if (msg.gameReady != undefined && !msg.gameReady) {
        //chiudere il modal
        Array.from(document.getElementsByClassName('modal-backdrop')).forEach((item) => {
          item.parentElement?.removeChild(item);
        });
        this.toastN("Friendly match refused")
      }
    });
  }

  ngOnDestroy(): void {
    /* Delete the subscription from the socket's listener */
    this.gameReady.unsubscribe();
  }


  ngOnInit(): void {
    // if (!this.us.get_token()) {
    //   this.router.navigate(["/"])
    //   this.us.userRole = ''
    // } else {
    //   this.us.get_update().subscribe((msg) => {
    //     msg = msg.text
    //     if (msg == "Update user") {
    //       console.log(`Update user ${this.us.userRole}`)
    //       if (this.us.has_nonregmod_role()) {
    //         this.router.navigate(['/profile'])
    //       } else {
    //         console.log("OU")
    //         this.username = this.us.get_username()
    //         this.us.get_friendlist().subscribe((u) => {
    //           this.friendlist = []
    //           // console.log()
    //           u.friendlist.forEach((element: { [x: string]: any; }) => {
    //             // console.log(1)
    //             this.friendlist.push({ id: element['_id'], username: element['username'], isBlocked: element['isBlocked'] })
    //             console.log(this.friendlist);
    //           });
    //           console.log(this.friendlist);
    //         })
    //         // this.router.navigate(['/'])
    //         this.username = this.us.get_username()
    //       }
    //     }
    //   }, (err) => {
    //     console.log(err)
    //   })
    // }

    if (!this.us.get_token()) {
      this.router.navigate(['/'])
    } else if (this.us.has_nonregmod_role()) {
      this.router.navigate(['/profile'])
    } else {
      this.username = this.us.get_username()
      this.us.get_friendlist().subscribe((u) => {
        this.friendlist = []
        // console.log()
        u.friendlist.forEach((element: { [x: string]: any; }) => {
          // console.log(1)
          this.friendlist.push({ id: element['_id'], username: element['username'], isBlocked: element['isBlocked'] })
          // console.log(this.friendlist);
        });
        // console.log(this.friendlist);
      })
    }


  }

  toastN(msg: string) {
    this.toast.show(msg, {
      classname: 'bg-info text-light',
      delay: 7000,
      autohide: true
    });
  }
  /* Call the function for creata a matchmaking */
  findmatch() {
    this.us.create_matchmaking().subscribe(
      (u) => {
        console.log(u);
        this.sio.creatematchroomemit();

      }
    )
  }
  findMatchWatchFriend(friend: string) {
    let game: number[][] = []

    this.foundwatch = true

    for (var i: number = 0; i < 6; i++) {
      game[i] = [];
      for (var j: number = 0; j < 7; j++) {
        game[i][j] = 0;
      }
    }
    this.enterGameWatchMode = this.sio.enterGameWatchMode().subscribe(msg => {
      console.log('got a msg enterGameWatchMode: ' + JSON.stringify(msg));
      const rplayground = msg.playground
      if (rplayground != undefined) {
        let x = 5, y = 0
        for (var i: number = 0; i < 6; i++) {
          y = 0
          for (var j: number = 0; j < 7; j++) {
            if (rplayground[i][j] == "X") {
              game[x][y] = 1;
            }
            if (rplayground[i][j] == "O") {
              game[x][y] = 2;
            }

            y++
          }
          x--
        }
      }
      this.sio.setGame(game)
      Array.from(document.getElementsByClassName('modal-backdrop')).forEach((item) => {
        item.parentElement?.removeChild(item);
      });
      this.enterGameWatchMode.unsubscribe()
      if (this.sio.getP1() == msg.playerTurn) {
        this.sio.turn = 1
      } else {
        this.sio.turn = 2
      }
      this.router.navigate(['watch']);
    });
    this.us.get_GameinProgress().subscribe(
      (u) => {
        console.log(JSON.stringify(u));

        if (u.matches.length >= 1) {
          let game = 0
          for (var i: number = 0; i < u.matches.length; i++) {
            if (u.matches[i].player1 == friend) {
              this.sio.setP1(friend)
              this.sio.setP2(u.matches[i].player2)
              this.sio.switched = false
              game++
            }
            if (u.matches[i].player2 == friend) {
              this.sio.setP1(u.matches[i].player2)
              this.sio.setP2(friend)
              this.sio.switched = true
              game++
            }
          }
          if (game < 1) {
            this.foundwatch = false
            this.enterGameWatchMode.unsubscribe()
          } else {
            this.us.watchPeople(this.sio.getP1()).subscribe((msg) => {
              console.log(msg)

            })
          }

        } else {
          this.foundwatch = false
          this.enterGameWatchMode.unsubscribe()
        }
      }
    )
  }
  createCPUGame(lv:number){
    this.us.lv
    this.us.createCPUgame().subscribe((msg)=>{
      console.log(JSON.stringify(msg))
      this.router.navigate(['cpu']);
    })
  }
  findMatchWatch() {
    let game: number[][] = []

    this.foundwatch = true

    for (var i: number = 0; i < 6; i++) {
      game[i] = [];
      for (var j: number = 0; j < 7; j++) {
        game[i][j] = 0;
      }
    }
    this.enterGameWatchMode = this.sio.enterGameWatchMode().subscribe(msg => {
      console.log('got a msg enterGameWatchMode: ' + JSON.stringify(msg));
      const rplayground = msg.playground
      if (rplayground != undefined) {
        let x = 5, y = 0
        for (var i: number = 0; i < 6; i++) {
          y = 0
          for (var j: number = 0; j < 7; j++) {
            if (rplayground[i][j] == "X") {
              game[x][y] = 1;
            }
            if (rplayground[i][j] == "O") {
              game[x][y] = 2;
            }

            y++
          }
          x--
        }
      }
      this.sio.setGame(game)
      Array.from(document.getElementsByClassName('modal-backdrop')).forEach((item) => {
        item.parentElement?.removeChild(item);
      });
      this.enterGameWatchMode.unsubscribe()
      if (this.sio.getP1() == msg.playerTurn) {
        this.sio.turn = 1
      } else {
        this.sio.turn = 2
      }
      this.router.navigate(['watch']);
    });
    this.us.get_GameinProgress().subscribe(
      (u) => {
        console.log(JSON.stringify(u));
        const game = this.randomNumber(0, u.matches.length - 1)
        const player = this.randomNumber(1, 2)
        console.log(" my game", game, " player", player)
        if (u.matches.length >= 1) {
          const selectgame = u.matches[game]
          if (player == 1) {
            this.sio.setP1(selectgame.player1)
            this.sio.setP2(selectgame.player2)
            this.sio.switched = false
          } else {
            this.sio.setP1(selectgame.player2)
            this.sio.setP2(selectgame.player1)
            this.sio.switched = true
          }
          this.us.watchPeople(this.sio.getP1()).subscribe((msg) => {
            console.log(msg)

          })
        } else {
          this.foundwatch = false
          this.enterGameWatchMode.unsubscribe()
        }
      }
    )
  }

  /* Create random number - USELESS */
  randomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  inviteFriendToMatch(username: string) {
    console.log("Opposite Player: " + username)
    this.us.create_friendlymatchmaking(username).subscribe((data) => {
      this.toastN("Request Forwarded")
    })
  }

  /* Navigate to one route */
  navigate(route: String) {
    this.router.navigate([route])
  }

}
