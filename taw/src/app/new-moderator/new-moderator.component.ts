import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-new-moderator',
  templateUrl: './new-moderator.component.html',
  styleUrls: ['./new-moderator.component.css']
})
export class NewModeratorComponent implements OnInit {

  public errmessage: string = ''
  public typeErr: string = ''

  constructor(private us:UserHttpService,private router:Router) { }

  ngOnInit(): void {
    if (!this.us.get_token()) {
      // TODO aggiungi un messaggio, magari con una funzione nel servizio per non replicare codice
      this.router.navigate(['/']) 
    }
  }


  createMod(username: string, password: string) {
    this.us.create_new_mod(username, password).subscribe((data) => {
      this.errmessage = 'New moderator added, share credential to help him join the game'
      this.typeErr = 'primary'
    }, (erro) => {
      this.errmessage = erro.message
      this.typeErr = 'danger'
    })
    return false
  }
}
