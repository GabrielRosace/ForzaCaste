import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';
import { SocketioService } from '../socketio.service';
import { AppComponent } from '../app.component';

interface Alert {
  type: string;
  message: string;
}
interface Message {
  imgUrl: string;
  from: string;
  text:string;
  time:string;
}

@Component({
  selector: 'app-cpu',
  templateUrl: './cpu.component.html',
  styleUrls: ['./cpu.component.css']
})
export class CpuComponent implements OnInit {
  public game:number[][]=[];
  public visibility:string="none";//default="none"
  public opacity: number=0.5;//default=0.5
  public alerts: any[]=[];
  public lv:string="";
  public title: string = "";
  public content: string = "";
  public suggestion:string="Ask for some suggestion";
  public win:boolean=false
  public suggestedcollum:number=-1
  constructor(private app: AppComponent, private sio: SocketioService,private us: UserHttpService, private router: Router) { 
    this.us.friendGame=false
    /*Understand which level is selected */
    if(this.us.lv!=undefined){

      if(this.us.lv==2){
        this.lv="Easy"
      }
      if(this.us.lv==5){
        this.lv="Medium"
      }
      if(this.us.lv==7){
        this.lv="Hard"
      }

      this.visibility="";
      this.opacity=1;
    }
    
  }
  /* When component is destroyed it will unsubscribe from the sockets */
  ngOnDestroy(): void {
    this.deleteMatch()
  }
  /* Create random number - USELESS */
  randomNumber(min:number, max:number) {
    return Math.floor(Math.random() * (max - min) + min);
  }
  /* When components load, it will load the gameboard */
  ngOnInit(): void {
    if (!this.us.get_token()) {
      this.router.navigate(['/'])
    } else if (this.us.has_nonregmod_role()) {
      this.router.navigate(['/profile'])
    } else {
      for(var i: number = 0; i < 6; i++) {
        this.game[i] = [];
        for(var j: number = 0; j< 7; j++) {
            this.game[i][j] = 0;
        }
      }
    }
    
  }

  /* remove alert from the alters list, then from the view */
  close(alert: Alert) {
    this.alerts.splice(this.alerts.indexOf(alert), 1);
  }
    deleteMatch(){
    this.us.delete_match().subscribe((data) => {
    })
  }
  /* Call the function in http for close the match with the cpu and navigate to the home */
  closeMatch(){
    if(this.us.friendGame){
      if(this.win){
        this.us.lv=undefined

      }else{
      this.us.delete_match().subscribe((data) => {

        this.us.lv=undefined
      })}
    }else{
      if(this.win){
        this.us.lv=undefined
        this.router.navigate(['/home'])
      }else{
      this.us.delete_match().subscribe((data) => {

        this.us.lv=undefined
        this.router.navigate(['/home'])
      })}
    }
    
  }
  /*Return the color of the column if it has to be selected*/
  isTosuggest(collumn:number){
    
    if(collumn==this.suggestedcollum){

      return "#F56476"
    }else{
      return "transparent"
    }
  }
/*Call the http function for ask a suggestion and make it visible to the user */
  askSuggestion(){
    if(this.win){
      this.title="Error suggestion"
      this.content="Someone have already win"
      document.getElementById("opensugg")!.click();
    }
    this.us.askSuggestion().subscribe((msg)=>{

      if(msg.error){
        this.title="Error suggestion"
      this.content=msg.errormessage
      }else{
        this.suggestion="AI suggest to add to collumn: "+(msg.move["0"]+1);
        this.suggestedcollum=msg.move["0"]
      }
    }, (err) => {

      this.title="Error suggestion"
      this.content = err.error.errormessage
      document.getElementById("opensugg")!.click();
    })
  }
  /* make a turn, when is over, switch the player turn */
  add(c:number){
    this.suggestedcollum=-1
    this.us.moveCPUgame(c).subscribe((msg)=>{
      let stopme=false
      let stopcpu=false

      if(msg.error!=undefined){
        if(msg.error){
          this.app.toastCust(msg.errormessage)
          //this.alerts.push({message:msg.errormessage});
        }else{
        }
      }
      for(var i:number=5;i>=0;i--){
        if(!stopme){
          if(this.game[i][c]==0){
            this.game[i][c]=1;

            this.visibility="none";
            this.opacity=0.5;
            stopme=true
          }
        }
        
      }
      const colonna=msg.cpu
      for(var i:number=5;i>=0;i--){
        if(!stopcpu){
          if(this.game[i][colonna]==0){
            this.game[i][colonna]=2;
            this.visibility="";
            this.opacity=1;
            stopcpu=true
          }
        }
      
    }
    if(msg.winner!=undefined){
      this.win=true
      this.visibility="none";
      this.opacity=0.5;
      
      let username=this.us.get_username()
      let p2="CPU"
      if(msg.winner==username){
        this.title=username.toUpperCase()+ " WIN!!!"
        this.content=username+ " win this game against "+p2
      }else{
        this.title=p2+ " WIN!!!"
        this.content=p2+ " win this game against "+username
      }
      
      document.getElementById("openstats")!.click();
    }
    })
  }
  /* Check if there is some players's move */
  isempty(i:number){
    if(i==0){
      return true;
    }else{
      return false;
    }
  }
  /* Check if there is some players's move */
  isyellow(i:number){
    if(i==1){
      return true;
    }else{
      return false;
    }
  }
  /* Check if there is some players's move */
  isred(i:number){
    if(i==2){
      return true;
    }else{
      return false;
    }
  }

}
