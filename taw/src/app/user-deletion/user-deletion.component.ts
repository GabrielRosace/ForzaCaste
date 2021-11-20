import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../User';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-user-deletion',
  templateUrl: './user-deletion.component.html',
  styleUrls: ['./user-deletion.component.css']
})
export class UserDeletionComponent implements OnInit {

  public list?: any
  public myUsername?: string
  public error?: string

  constructor(private us: UserHttpService,private router:Router) { }

  ngOnInit(): void {
    this.get_userlist()
    this.us.get_username()
  }

  delete(username: string) {
    this.us.delete_user(username).subscribe((e) => {
      this.error="User deleted successfully"
      this.us.get_userlist().subscribe((elem:any) => {
        this.list = elem.userlist
      })
    },()=>{this.error="Something weird happended"})
  }

  get_userlist() {
    this.us.get_userlist().subscribe((elem:any) => {
      this.list = elem.userlist
    })
  }

}
