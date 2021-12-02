import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SocketioService } from '../socketio.service';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-user-logout',
  templateUrl: './user-logout.component.html',
  styleUrls: ['./user-logout.component.css']
})
export class UserLogoutComponent implements OnInit {

  constructor(private us: UserHttpService, private router: Router, private socket: SocketioService) { }

  ngOnInit(): void {
    this.socket.disconnect()
    this.us.logout()
    this.router.navigate(["/"])
  }

}
