import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';
import { SocketioService } from '../socketio.service';

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
  constructor(private sio: SocketioService,private us: UserHttpService, private router: Router) { 
    this.us.friendGame=false
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
    this.closeMatch()
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
  closeMatch(){
    if(this.us.friendGame){
      if(this.win){
        this.us.lv=undefined

      }else{
      this.us.delete_match().subscribe((data) => {
        console.log(data)
        this.us.lv=undefined
      })}
    }else{
      if(this.win){
        this.us.lv=undefined
        this.router.navigate(['/home'])
      }else{
      this.us.delete_match().subscribe((data) => {
        console.log(data)
        this.us.lv=undefined
        this.router.navigate(['/home'])
      })}
    }
    
  }
  askSuggestion(){
    if(this.win){
      this.title="Error suggestion"
      this.content="Someone have already win"
      document.getElementById("openstats")!.click();
    }
    this.us.askSuggestion().subscribe((msg)=>{
      console.log(JSON.stringify(msg))
      if(msg.error){
        this.title="Error suggestion"
      this.content=msg.errormessage
      }else{
        this.suggestion="AI suggest to add to collumn: "+(msg.move["0"]+1);
      }
    })
  }
  /* make a turn, when is over, switch the player turn */
  add(c:number){
    this.us.moveCPUgame(c).subscribe((msg)=>{
      let stopme=false
      let stopcpu=false
      console.log(JSON.stringify(msg))
      if(msg.error!=undefined){
        if(msg.error){
          this.alerts.push({message:msg.errormessage});
        }else{
        }
      }
      for(var i:number=5;i>=0;i--){
        if(!stopme){
          if(this.game[i][c]==0){
            this.game[i][c]=1;
            console.log("valore: ",this.game[i][c]);
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
            console.log("valore: ",this.game[i][colonna]);
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
        this.content=username+ " win this game angaist "+p2
      }else{
        this.title=p2+ " WIN!!!"
        this.content=p2+ " win this game angaist "+username
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
