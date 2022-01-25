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
  /* When component is destroyed it will unsubscribe from the sockets */
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

  /*Update the friendList with who is online or not */
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
  /*Close the request for watching a game */
  closeWatch():void{
    this.matchmaking=false
    this.enterGameWatchMode.unsubscribe()
  }
  /*Close the request for matchmaking */
  closeMatch(): void {
    this.us.delete_match().subscribe((data) => {

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
        this.sio.creatematchroomemit();

      }
    )
  }
  /*Watch a game that a friend is playing */
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
      let found = false
      data.onlineuser.forEach((element: { [x: string]: any; }) => {

        if (JSON.parse(JSON.stringify(element)) == friend) {
          found = true
          this.matchmaking = true
          this.us.get_GameinProgress().subscribe(
            (u) => {


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
                    this.sio.setP1(u.matches[i].player1)
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
  /*Get the list of friends that is playing and put it in a List */
  getFriendplaying(){
    this.friendPlaying=[]
    this.updateFriendList()
    this.us.get_GameinProgress().subscribe((u)=>{
      //u.matches[i].player1
      
      for (var i: number = 0; i < u.matches.length; i++){

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

  }
/*Create a match vs the CPU and navigate to the gameboard */
  createCPUGame(lv: number) {
    this.us.lv = lv
    this.us.createCPUgame().subscribe((msg) => {
      this.navigate('cpu');
    })
  }
  /*Find a game thats is in progress and try to enter, and select randomly which user to view
  When a game is found, it will redirect to the watch page */
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

        const game = this.randomNumber(0, u.matches.length - 1)
        const player = this.randomNumber(1, 2)

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
/*Invite a friend for a match, and start to wait the player, if the friend refuse it stop */
  inviteFriendToMatch(username: string) {
    this.us.get_usersOnline().subscribe((data: any) => {

      let found = false
      data.onlineuser.forEach((element: { [x: string]: any; }) => {
        if (JSON.parse(JSON.stringify(element)) == username) {
          found = true
          this.matchmaking = true

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
  /*Start the listener for know when a friend go online or offline*/
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
  /*Get the users that is online and put them on a list */
  getUsOnline() {
    let online = this.us.get_usersOnline().subscribe((elem: any) => {
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
