import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';
import { SocketioService } from '../socketio.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {

  public username: string = ''
  public friendlist: any[] = []
  constructor(private sio: SocketioService,private us: UserHttpService, private router: Router) { }

  ngOnInit(): void {

    if (!this.us.get_token()) {
      this.router.navigate(['/'])
    }else if (this.us.has_nonregmod_role()) {
      this.router.navigate(['/profile'])
    } else {
      this.sio.lobby().subscribe(msg => {
        console.log('got a msg: ' + msg);
      });
      this.sio.move().subscribe(msg => {
        console.log('got a msg: ' + msg);
      });
      this.username = this.us.get_username()
      this.us.get_friendlist().subscribe((u) => {
        this.friendlist = []
        console.log()
        u.friendlist.forEach((element: { [x: string]: any; }) => {
          console.log(1)
          this.friendlist.push({ id: element['_id'], username: element['username'], isBlocked: element['isBlocked'] })
          console.log(this.friendlist);
        });
        console.log(this.friendlist);
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
