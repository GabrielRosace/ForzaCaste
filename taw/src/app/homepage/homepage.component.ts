import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {

  public username: string = ''
  public friendlist: any[] = []
  constructor(private us:UserHttpService,private router:Router) { }

  ngOnInit(): void {
    if(this.us.has_nonregmod_role()){
      this.router.navigate(['/profile'])
    }
    if (!this.us.get_token()) {
      this.router.navigate(['/'])
    }else{
      this.username = this.us.get_username()
      
      this.us.get_friendlist().subscribe((u) => {
        this.friendlist = []
        console.log()
        u.friendlist.forEach((element: { [x: string]: any; }) => {
            console.log(1)
            this.friendlist.push({id: element['_id'],username: element['username'], isBlocked: element['isBlocked']})
            console.log(this.friendlist);
          });
        console.log(this.friendlist);
        
      }) 
    }
  }

}
