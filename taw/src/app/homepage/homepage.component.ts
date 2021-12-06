import { Component, OnInit } from '@angular/core';
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
  public gameReady:Subscription

  constructor(private toast: ToastService, private sio: SocketioService,private us: UserHttpService, private router: Router) { 
    /* Subscribe to a socket's listener, the lobby, for knwo if i find a match */
    this.gameReady=this.sio.gameReady().subscribe(msg => {
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

  toastN(msg: string) {
    this.toast.show(msg, {
      classname: 'bg-info text-light',
      delay: 7000,
      autohide: true
    });
  }
  /* Call the function for creata a matchmaking */
  findmatch(){
    this.us.create_matchmaking().subscribe(
      (u)=>{
        console.log(u);
        this.sio.creatematchroomemit();
        
      }
    )
  }

  inviteFriendToMatch(username: string){
    console.log("Opposite Player: "+ username)
    this.us.create_friendlymatchmaking(username).subscribe((data) => {
      this.toastN("Request Forwarded")
    })
  }
  
  /* Navigate to one route */
  navigate(route: String) {
    this.router.navigate([route])
  }

}
