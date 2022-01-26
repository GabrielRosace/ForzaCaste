import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';
import { SocketioService } from '../socketio.service';
import { Subscription } from 'rxjs';
import { AppComponent } from '../app.component';
import { ToastService } from '../_services/toast.service';

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
  private move: Subscription;
  private gameReady: Subscription;
  private result: Subscription;
  private gameChat: Subscription;

  public game:number[][]=[];
  public chat:Message[]=[];
  public alerts: any[]=[];

  public txtturno:string="Waiting...";
  public visibility:string="none";//default="none"
  public opacity: number=0.5;//default=0.5
  
  public boss:number=0;
  public calledcol:number=0;
  public rank!:number;
  public suggestedcollum:number=-1

  public urturn:boolean=false;
  public isFriend:boolean=true

  public win:string="";
  public inputtext:string="";
  public opponent:string="Unknown"
  public title: string = "";
  public content: string = "";
  public suggestion:string="Ask for some suggestion";
  public gmMsg:string=""
  
  
  
  

  constructor(private toast: ToastService,private app:AppComponent, private sio: SocketioService,private us: UserHttpService, private router: Router) {
      this.us.get_friendlist().subscribe((u) => {

        u.friendlist.forEach((element: { [x: string]: any; }) => {
          if(element['username']==this.opponent){
            this.isFriend= false
          }

        });

      })
    this.us.friendGame=false
    /*Listen the socket gamechat if it receive a message, it add it to the Chat list*/
    this.gameChat=this.sio.gameChat().subscribe(msg => {

      if(msg.error){
        this.app.toastCust(msg.errorMessage)
        //this.alerts.push({message:msg.errorMessage});
      }

      if(msg.sender.length>0){
        var img:string="https://static.educalingo.com/img/it/800/mondo.jpg";
        this.us.get_Otheruser(msg.sender).subscribe(fmsg=>{
          img=fmsg.avatarImgURL;
          var frm:string=msg.sender;
          var time:string=new Date(msg.timestamp).toLocaleTimeString();
          var txt:string=msg.content;
          this.chat.push({imgUrl:img,from:frm,text:txt,time:time});
        });



      }
    });
    /*Listen the socket result, if it receive a message, check who win, and close the match,and display the winner or loser, or draw with rank */
    this.result=this.sio.result().subscribe(msg => {


      var response=JSON.parse(JSON.stringify(msg));


      if(msg.winner){

        this.win="Nice! You Win!";
      }
      if(msg.winner!=undefined &&msg.winner==null){

        this.win="oh, it's a draw!";
      }
      if(msg.winner!=undefined && !msg.winner){

        this.win="oh you looose :(";
      }
      if(msg.message!=undefined ){
        this.gmMsg=msg.message;
      }

      this.rank=(response.rank!=undefined)?response.rank:0
      this.visibility="none";
      this.opacity=0.5;

      document.getElementById("openstats")!.click();

    });

    this.gameReady=this.sio.gameReady().subscribe(msg => {
    });

    /*
    Listen to the socket move, if it receive a message, it validate the move that the user made and add the opponent move
    */
    this.move=this.sio.move().subscribe(msg => {
      var response=JSON.parse(JSON.stringify(msg));
      if(response.error==false){
        if(this.urturn){
          this.add(this.calledcol,0);
        }
      }
      this.alerts=[];
      if(response.error==true){
        this.app.toastCust(response.errorMessage)
        //this.alerts.push({message:response.errorMessage})
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
    this.closeMatch();
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
    });
    this.calledcol=col;
  }

  /* Send a message to the chat */
  sendmessage(text:string){
    if(text==""){
      this.alerts=[];
      this.app.toastCust("You have to write something for send it")
      //this.alerts.push({message:"you have to write something for send it"});
    }else{
      this.us.sendMessage(text).subscribe((msg)=>{

        var response=JSON.parse(JSON.stringify(msg));
        if(response.error==false&&response.error!=undefined){
          var time = new Date();
          time.setTime(time.getTime()+60*60*1000)
          this.chat.push({imgUrl:this.us.get_avatarImgURL(),from:"me",text:text,time:time.toLocaleTimeString()});
        }
      });
    }

  }
  /*Call the http function for ask a suggestion and make it visible to the user */
  askSuggestion(){
    if(this.rank!=undefined){
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
  /*Return the color of the column if it has to be selected*/
  isTosuggest(collumn:number){

    if(collumn==this.suggestedcollum){
      return "#F56476"
    }else{
      return "transparent"
    }
  }
  /*Call the http function for delete the match*/
  deleteMatch(){
    this.us.delete_match().subscribe((data) => {
    })
  }
  /* Call the function in http for close the match with the player and navigate to the home */
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
  /*Call the http function for add the opponent as friend */
  addFriend(){
    this.us.add_friendRequest(this.opponent).subscribe((data) => {
      this.toastN("Request Forwarded")
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

  toastN(msg: string) {
    this.toast.show(msg, {
      classname: 'bg-info text-light',
      delay: 7000,
      autohide: true
    });
  }

}
