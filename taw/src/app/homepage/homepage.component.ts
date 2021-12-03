import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';
import { SocketioService } from '../socketio.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {

  public username: string = ''
  public friendlist: any[] = []
  public lobby:Subscription
  constructor(private sio: SocketioService,private us: UserHttpService, private router: Router) { 
    this.lobby=this.sio.lobby().subscribe(msg => {
      console.log('got a msg lobby: ' + msg);
      if(msg=='true'){
        //rimuove il backdrop dei modal (bug di bootstrap)
        Array.from(document.getElementsByClassName('modal-backdrop')).forEach((item) => {
          item.parentElement?.removeChild(item);
          });
        this.router.navigate(['game']);
      }
      
    });
  }
  ngOnDestroy(): void{
    this.lobby.unsubscribe();
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
    }else if (this.us.has_nonregmod_role()) {
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
  findmatch(){
    this.us.create_matchmaking().subscribe(
      (u)=>{
        console.log(u);
        this.sio.creatematchroomemit();
        
      }
    )
  }
  navigate(route: String) {
    this.router.navigate([route])
  }

}
