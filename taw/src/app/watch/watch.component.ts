import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppComponent } from '../app.component';
import { SocketioService } from '../socketio.service';
import { UserHttpService } from '../user-http.service';

interface Alert {
  type: string;
  message: string;
}
interface Message {
  imgUrl: string;
  from: string;
  text: string;
  time: string;
}

@Component({
  selector: 'app-watch',
  templateUrl: './watch.component.html',
  styleUrls: ['./watch.component.css']
})
export class WatchComponent implements OnInit {
  private gameStatus: Subscription;
  private result: Subscription;
  private gameChat: Subscription;

  public game: number[][] = [];
  public chat: Message[] = [];
  public alerts: any[] = [];

  public txtturno: string = "Waiting...";
  public p1: string = "";
  public p2: string = "";
  public title: string = "";
  public content: string = "";
  public visibility: string = "none";//default="none"
  public win: string = "";
  public inputtext: string = "";

  public opacity: number = 1;//default=0.5
  public rank: number = 0;
  public boss: number = 0;
  public calledcol: number = 0;
  public urturn: number=0;

  public switched: boolean = false;
  

  public gmMsg:string=""
  constructor(private app: AppComponent, private sio: SocketioService, private us: UserHttpService, private router: Router) {
    /*Initiliaze the turn */
    if (this.sio.turn == 1) {
      this.txtturno = this.sio.getP1()
      
      this.urturn=1
    }
    else {
      this.txtturno = this.sio.getP2()
      this.urturn=2
    }
    this.switched=this.sio.switched
    /*Listen the socket gameStatus if it receive a message, it add the move and switch the turn*/
    this.gameStatus = this.sio.gameStatus().subscribe(msg => {

     
      if(msg.move!=undefined){
        this.add(msg.move)
      }
      if(msg.nextTurn!=undefined){
        this.txtturno=msg.nextTurn
      }
    });
    /*Listen the socket gamechat if it receive a message, it add it to the Chat list*/
    this.gameChat=this.sio.gameChat().subscribe(msg => {

      

      if(msg.error){
        this.alerts.push({message:msg.errorMessage});
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
    /*Listen the socket result, if it receive a message it display the winner or loser, or draw */
    this.result = this.sio.result().subscribe(msg => {

     
      if(msg.winner!=undefined &&msg.winner==null){
        this.title="oh, it's a draw!"
        this.content="None win this game"
      }
      if(msg.winner!=undefined&&msg.winner!=null){
          this.title=msg.winner.toUpperCase()+ " WIN!!!"
          this.content=msg.winner.toUpperCase()+ " win this game"
      }
      if(msg.message!=undefined ){
        this.gmMsg=msg.message;
        
      }
      document.getElementById("openstats")!.click();
    });
  }

  /* When component is destroyed it will unsubscribe from the sockets */
  ngOnDestroy(): void {
    this.gameStatus.unsubscribe()
    this.result.unsubscribe()
    this.gameChat.unsubscribe()
  }

  ngOnInit(): void {
    if (!this.us.get_token()) {
      this.router.navigate(['/'])
    } else if (this.us.has_nonregmod_role()) {
      this.router.navigate(['/profile'])
    } else {
      for (var i: number = 0; i < 6; i++) {
        this.game[i] = [];
        for (var j: number = 0; j < 7; j++) {
          this.game[i][j] = 0;
        }
      }
      this.p1 = this.sio.getP1()
      
      this.p2 = this.sio.getP2()
      
      this.game = this.sio.getGame()
    }
  }
  /* Send a message to the chat */
  sendmessage(text: string) {
    if (text == "") {
      this.alerts = [];
      this.app.toastCust("You have to write something for send it")
    } else {
      this.us.sendMessageSpect(text,(this.p1=="cpu")?this.p2:this.p1).subscribe((msg) => {
        
        var response = JSON.parse(JSON.stringify(msg));
        if (response.error == false && response.error != undefined) {
          var time = new Date();
          time.setTime(time.getTime()+60*60*1000)
          this.chat.push({ imgUrl: this.us.get_avatarImgURL(), from: "me", text: text, time: time.toLocaleTimeString() });
        }
      });
    }

  }
  /* make a turn, when is over, switch the player turn */
  add(c:number){
    
    if(this.urturn==2){
      for(var i:number=5;i>=0;i--){
        if(this.game[i][c]==0){
          this.game[i][c]=(this.switched)?1:2
          this.urturn=1
          return;
        }
      }
    }else{
      for(var i:number=5;i>=0;i--){
        if(this.game[i][c]==0){
          this.game[i][c]=(this.switched)?2:1
          this.urturn=2
          return;
        }
      }
    }
  }
  /* Navigate to the home */
  closeMatch(){
      this.router.navigate(['/home'])
  }

  /* Check if there is some players's move */
  isempty(i: number) {
    if (i == 0) {
      return true;
    } else {
      return false;
    }
  }
  /* Check if there is some players's move */
  isyellow(i: number) {
    if (i == 1) {
      return true;
    } else {
      return false;
    }
  }
  /* Check if there is some players's move */
  isred(i: number) {
    if (i == 2) {
      return true;
    } else {
      return false;
    }
  }
}
