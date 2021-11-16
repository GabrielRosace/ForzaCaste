import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {

  constructor(private us:UserHttpService,private router:Router) { }

  ngOnInit(): void {
    if (!this.us.get_token()) {
      this.router.navigate(['/'])
    }
  }

}
