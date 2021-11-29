import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';
import { SocketioService } from '../socketio.service';
import { Subscription } from 'rxjs';

interface Alert {
  type: string;
  message: string;
}
@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  public game:number[][]=[]
  public txtturno:string="Waiting..."
  public visibility:string="none"
  public opacity: number=0.5;
  public alerts: any[]=[];
  public boss:number=0;
  public calledcol:number=0;
  public urturn:boolean=false;
  private move: Subscription
  private lobby: Subscription
  constructor(private sio: SocketioService,private us: UserHttpService, private router: Router) { 
    this.lobby=this.sio.lobby().subscribe(msg => {
      console.log('got a msg lobby: ' + msg);
    });
    this.move=this.sio.move().subscribe(msg => {
      console.log('got a msg move from game: ' + JSON.stringify(msg));
      var response=JSON.parse(JSON.stringify(msg));
      if(response.error==false){
        if(this.urturn){
          this.add(this.calledcol,0);
        }
      }
      if(response.error==true){
        this.alerts.push({message:response.errorMessage})
      }
      if(response.move>=0||response.move<=6){
        if(!this.urturn){
          this.add(response.move,1);
        }
      }
      if(response.yourTurn==true){
        this.visibility="";
        this.opacity=1;
        this.txtturno="It's your turn";
        this.boss=1;
        this.urturn=true;
      }
      if(response.yourTurn==false){
        this.visibility="none";
        this.opacity=0.5;
        this.txtturno="It's turn of your opponent";
        this.boss=2;
        this.urturn=false
      }
    });
  }
  ngOnDestroy(): void {
    this.move.unsubscribe();
    this.lobby.unsubscribe();
  }
  randomNumber(min:number, max:number) {
    return Math.floor(Math.random() * (max - min) + min);
  }
  ngOnInit(): void {
    
    for(var i: number = 0; i < 6; i++) {
      this.game[i] = [];
      for(var j: number = 0; j< 7; j++) {
          this.game[i][j] = 0;
      }
      
      
  }
  }
  close(alert: Alert) {
    this.alerts.splice(this.alerts.indexOf(alert), 1);
  }
  add(c:number,who:number){
    if(who==0){
      for(var i:number=5;i>=0;i--){
        if(this.game[i][c]==0){
          this.game[i][c]=this.boss;
          console.log("valore: ",this.game[i][c]);
          this.visibility="none";
          this.opacity=0.5;
          this.txtturno="It's turn of your opponent";
          this.urturn=false
          return;
        }
      }
    }else{
      for(var i:number=5;i>=0;i--){
        if(this.game[i][c]==0){
          this.game[i][c]=this.boss==2?1:2;
          console.log("valore: ",this.game[i][c]);
          this.visibility="";
          this.opacity=1;
          this.txtturno="It's your turn";
          this.urturn=true;
          return;
        }
      }
    }
  }
  makemove(col:number){
    this.sio.makemove(String(col));
    this.calledcol=col;
  }
  
  isempty(i:number){
    if(i==0){
      return true;
    }else{
      return false;
    }
  }
  isyellow(i:number){
    if(i==1){
      return true;
    }else{
      return false;
    }
  }
  isred(i:number){
    if(i==2){
      return true;
    }else{
      return false;
    }
  }

}
