import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SocketioService } from '../socketio.service';
import { UserHttpService } from '../user-http.service';

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
  selector: 'app-watch',
  templateUrl: './watch.component.html',
  styleUrls: ['./watch.component.css']
})
export class WatchComponent implements OnInit {
  public game:number[][]=[];
  public chat:Message[]=[];
  public txtturno:string="Waiting...";
  public visibility:string="none";//default="none"
  public opacity: number=1;//default=0.5
  public alerts: any[]=[];
  public boss:number=0;
  public calledcol:number=0;
  public urturn:boolean=false;
  public win:string="";
  public rank:number=0;
  public inputtext:string="";
  constructor(private sio: SocketioService,private us: UserHttpService, private router: Router) { 
    
  }

  ngOnInit(): void {
    for(var i: number = 0; i < 6; i++) {
      this.game[i] = [];
      for(var j: number = 0; j< 7; j++) {
          this.game[i][j] = 0;
      }
    }
  }  
    /* Send a message to the chat */
    sendmessage(text:string){
      if(text==""){
        this.alerts=[];
        this.alerts.push({message:"you have to write something for send it"});
      }else{
        this.us.sendMessage(text).subscribe((msg)=>{
          console.log("ricevuto da sendMessage: ",msg);
          var response=JSON.parse(JSON.stringify(msg));
          if(response.error==false&&response.error!=undefined){
            var time = new Date();
            this.chat.push({imgUrl:this.us.get_avatarImgURL(),from:"me",text:text,time:time.toLocaleTimeString()});
          }
        });
      }
  
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
