import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';
import { SocketioService } from '../socketio.service';
import { Subscription } from 'rxjs';

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
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  public game:number[][]=[];
  public chat:Message[]=[];
  public txtturno:string="Waiting...";
  public visibility:string="none";//default="none"
  public opacity: number=0.5;//default=0.5
  public alerts: any[]=[];
  public boss:number=0;
  public calledcol:number=0;
  public urturn:boolean=false;
  private move: Subscription;
  private gameReady: Subscription;
  private result: Subscription;
  private gameChat: Subscription;
  public win:string="";
  public rank!:number;
  public inputtext:string="";
  public opponent:string="Unknown"
  public title: string = "";
  public content: string = "";
  public suggestion:string="Ask for some suggestion";
  public suggestedcollum:number=-1
  constructor(private sio: SocketioService,private us: UserHttpService, private router: Router) { 
    this.us.friendGame=false
    this.gameChat=this.sio.gameChat().subscribe(msg => {

      console.log('got a msg gameChat: ' + JSON.stringify(msg));

      if(msg.error){
        this.alerts.push({message:msg.errorMessage});
      }

      if(msg.sender.length>0){
        var img:string="https://static.educalingo.com/img/it/800/mondo.jpg";
        this.us.get_Otheruser(msg.sender).subscribe(fmsg=>{
          console.log('from photo: ' + JSON.stringify(fmsg));
          img=fmsg.avatarImgURL;
          var frm:string=msg.sender;
          var time:string=new Date(msg.timestamp).toLocaleTimeString();
          var txt:string=msg.content;
          this.chat.push({imgUrl:img,from:frm,text:txt,time:time});
          console.log('ur message parsed: ' + JSON.stringify({imgUrl:img,from:frm,text:txt,time:time}));
        });

        

      }
    });

    this.result=this.sio.result().subscribe(msg => {

      console.log('got a msg result: ' + JSON.stringify(msg));
      var response=JSON.parse(JSON.stringify(msg));
      console.log(msg.winner)
      //console.log(JSON.parse(msg))

      if(msg.winner){
        console.log("Hai vinto")
        this.win="Nice! You Win!";
      }
      if(msg.winner==null){
        console.log("Pareggio")
        this.win="oh, it's a draw!";
      }
      if(msg.winner!=undefined && !msg.winner){
        console.log("Hai perso")
        this.win="oh you looose :(";
      }

      this.rank=(response.rank!=undefined)?response.rank:0
      this.visibility="none";
      this.opacity=0.5;

      document.getElementById("openstats")!.click();

    });
    this.gameReady=this.sio.gameReady().subscribe(msg => {
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
      this.alerts=[];
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
  /* When component is destroyed it will unsubscribe from the sockets */
  ngOnDestroy(): void {
    this.move.unsubscribe();
    this.result.unsubscribe();
    this.gameReady.unsubscribe();
    this.gameChat.unsubscribe();
    this.deleteMatch();
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
      this.opponent=this.sio.getP2()
    }
    
  }

  /* remove alert from the alters list, then from the view */
  close(alert: Alert) {
    this.alerts.splice(this.alerts.indexOf(alert), 1);
  }

  /* make a turn, when is over, switch the player turn */
  add(c:number,who:number){
    this.suggestedcollum=-1
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
  /* Call the function for make a move */
  makemove(col:number){
    this.us.makemove(col).subscribe((msg)=>{
      console.log("ricevuto da make move: ",msg);
    });
    this.calledcol=col;
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
  askSuggestion(){
    if(this.rank!=undefined){
      this.title="Error suggestion"
      this.content="Someone have already win"
      document.getElementById("opensugg")!.click();
    }
    this.us.askSuggestion().subscribe((msg)=>{
      console.log(JSON.stringify(msg))
      if(msg.error){
        this.title="Error suggestion"
      this.content=msg.errormessage
      }else{
        this.suggestion="AI suggest to add to collumn: "+(msg.move["0"]+1);
        this.suggestedcollum=msg.move["0"]
      }
    }, (err) => {
      console.log(err)
      this.title="Error suggestion"
      this.content = err.error.errormessage
      document.getElementById("openstats")!.click();
    })
  }
  
  isTosuggest(collumn:number){
    
    if(collumn==this.suggestedcollum){
      console.log(collumn)
      return "#F56476"
    }else{
      return "transparent"
    }
  }

  deleteMatch(){
    this.us.delete_match().subscribe((data) => {
    })
  }
  closeMatch(){
    if(this.us.friendGame){
      if(this.rank==undefined){
        this.deleteMatch()
      }
    }else{
      if(this.rank==undefined){
        this.deleteMatch()
        this.router.navigate(['/home'])
      }else{
        this.router.navigate(['/home'])
      }
    }
  }
  addFriend(){
    this.us.add_friendRequest(this.opponent).subscribe((data) => {
      // miss toast service
      // CASTE FIX THIS
      //this.toastN("Request Forwarded")
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
