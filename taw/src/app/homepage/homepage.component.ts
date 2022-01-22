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
  private subscriptionMsg!: Subscription;
  private enterGameWatchMode!: Subscription;

  public onlineUser?: any

  public friendlist: any[] = []
  public friendPlaying: any[] = []
  public username: string = ''
  public foundwatch: boolean = true
  public matchmaking: boolean = false;

  constructor(private toast: ToastService, private sio: SocketioService, private us: UserHttpService, private router: Router) {
    this.notifyOnline()
  }

  ngOnDestroy(): void {
    if(this.subscriptionMsg!=undefined){
      this.subscriptionMsg.unsubscribe()
    }
    
  }



  ngOnInit(): void {

    if (!this.us.get_token()) {
      this.navigate("/")
    } else if (this.us.has_nonregmod_role()) {
      this.navigate("/profile")
    } else {
      this.username = this.us.get_username()
      this.getUsOnline()
      this.updateFriendList()
    }


  }
  updateFriendList(){
    this.us.get_friendlist().subscribe((u) => {
      this.friendlist = []
      u.friendlist.forEach((element: { [x: string]: any; }) => {
        let sos = this.onlineUser.find((data: any) => { return data == element['username'] })
        var col
        var online
        if (sos == element['username']) {
          col = "#88D498"
          online=true
        } else {
          col = "#A4A5AE"
          online=false
        }
        this.friendlist.push({ id: element['_id'], username: element['username'], isBlocked: element['isBlocked'],online:online,color: col })
      });

    })
    
  }
  closeWatch():void{
    this.matchmaking=false
    this.enterGameWatchMode.unsubscribe()
  }
  closeMatch(): void {
    this.us.delete_match().subscribe((data) => {
      console.log(data)
      this.matchmaking = false
    })
  }
  toastN(msg: string) {
    this.toast.show(msg, {
      classname: 'bg-info text-light',
      delay: 7000,
      autohide: true
    });
  }
  /* Call the function for create a matchmaking */
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
      
      this.navigate('watch');
    });
    this.us.get_usersOnline().subscribe((data: any) => {
      console.log(JSON.stringify(data))
      let found = false
      data.onlineuser.forEach((element: { [x: string]: any; }) => {
        console.log(JSON.stringify(element))
        if (JSON.parse(JSON.stringify(element)) == friend) {
          console.log("sono dentro")
          found = true
          this.matchmaking = true
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
                  this.matchmaking = false
                  this.foundwatch = false
                  this.enterGameWatchMode.unsubscribe()
                  this.toastN(friend + " is not playing with anyone")
                } else {
                  this.us.watchPeople(this.sio.getP1()).subscribe((msg) => {
                    console.log(msg)

                  })
                }

              } else {
                this.matchmaking = false
                this.foundwatch = false
                this.enterGameWatchMode.unsubscribe()
                this.toastN(friend + " is not playing with anyone")
              }
            }
          )
        }




      });
      if (!found) {
        this.toastN("You can't watch " + friend + " if he is offline")
      }
    })

  }
  getFriendplaying(){
    this.friendPlaying=[]
    this.updateFriendList()
    this.us.get_GameinProgress().subscribe((u)=>{
      //u.matches[i].player1
      
      for (var i: number = 0; i < u.matches.length; i++){
        console.log("sono qui dentro")
        this.friendlist.forEach((data:any)=>{
          if(data.username == u.matches[i].player1 ){
            this.friendPlaying.push(data['username'])
          }
          if(data.username == u.matches[i].player2 ){
            this.friendPlaying.push(data['username'])
          }
        })
      }
      
    })
    console.log(this.friendPlaying)

  }

  createCPUGame(lv: number) {
    this.us.lv = lv
    console.log("livello difficolta: " + this.us.lv)
    this.us.createCPUgame().subscribe((msg) => {
      console.log(JSON.stringify(msg))
      this.navigate('cpu');
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
      this.navigate('watch');
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
    this.us.get_usersOnline().subscribe((data: any) => {
      console.log(JSON.stringify(data))
      let found = false
      data.onlineuser.forEach((element: { [x: string]: any; }) => {
        if (JSON.parse(JSON.stringify(element)) == username) {
          found = true
          this.matchmaking = true
          console.log("Opposite Player: " + username)
          this.us.create_friendlymatchmaking(username).subscribe((data) => {
            this.toastN("Request Forwarded")
          })
        }

      });
      if (!found) {
        this.matchmaking = false
        this.toastN("You can't play with " + username + " if he is offline")
      }
    })

  }
  notifyOnline() {
    if (!this.sio.isNull()) {
      this.subscriptionMsg = this.sio.isOnline().subscribe((msg) => {
        this.getUsOnline()

        let usern = JSON.parse(JSON.stringify(msg)).username
        let conn = JSON.parse(JSON.stringify(msg)).isConnected

        this.friendlist.forEach((element: { [x: string]: any; }) => {

          if (element['username'] == usern) {
            if (conn) {
              element['color'] = "#88D498"
              element['online']=true
            } else {
              element['online']=false
              element['color'] = "#A4A5AE"
            }
          }
        })
       
      })
    }
  }
  getUsOnline() {
    let online = this.us.get_usersOnline().subscribe((elem: any) => {
      console.log("Online")
      console.log(elem.onlineuser)
      this.onlineUser = elem.onlineuser
    })
  }

  /* Navigate to one route */
  navigate(route: String) {
    document.getElementById("closepfriend")!.click();
    document.getElementById("closepstrange")!.click();
    document.getElementById("closewfriend")!.click();
    document.getElementById("closewstrange")!.click();
    this.router.navigate([route])
  }

}
