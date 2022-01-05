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
  public game: number[][] = [];
  public chat: Message[] = [];
  public txtturno: string = "Waiting...";
  public p1: string = "";
  public p2: string = "";
  public title: string = "";
  public content: string = "";
  public visibility: string = "none";//default="none"
  public opacity: number = 1;//default=0.5
  public alerts: any[] = [];
  public boss: number = 0;
  public calledcol: number = 0;
  public urturn: number=0;
  public switched: boolean = false;
  public win: string = "";
  public rank: number = 0;
  public inputtext: string = "";
  private gameStatus: Subscription;
  private result: Subscription;
  private gameChat: Subscription;
  constructor(private app: AppComponent, private sio: SocketioService, private us: UserHttpService, private router: Router) {
    if (this.sio.turn == 1) {
      this.txtturno = this.sio.getP1()
      this.urturn=1
    }
    else {
      this.txtturno = this.sio.getP2()
      this.urturn=2
    }
    this.switched=this.sio.switched
    this.gameStatus = this.sio.gameStatus().subscribe(msg => {

      console.log('got a msg gameStatus: ' + JSON.stringify(msg));
      if(msg.move!=undefined){
        this.add(msg.move)
      }
      if(msg.nextTurn!=undefined){
        this.txtturno=msg.nextTurn
      }
    });
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
    this.result = this.sio.result().subscribe(msg => {

      console.log('got a msg result: ' + JSON.stringify(msg));
      if(msg.winner!=undefined){
          this.title=msg.winner.toUpperCase()+ " WIN!!!"
          this.content=msg.winner.toUpperCase()+ " win this game"
      }
      document.getElementById("openstats")!.click();
    });
  }

  /* When component is destroyed it will unsubscribe from the sockets */
  ngOnDestroy(): void {
    this.gameStatus.unsubscribe()
    this.result.unsubscribe()
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
      //this.alerts.push({ message: "you have to write something for send it" });
    } else {
      this.us.sendMessageSpect(text,(this.p1=="cpu")?this.p2:this.p1).subscribe((msg) => {
        console.log("ricevuto da sendMessage: ", msg);
        var response = JSON.parse(JSON.stringify(msg));
        if (response.error == false && response.error != undefined) {
          var time = new Date();
          this.chat.push({ imgUrl: this.us.get_avatarImgURL(), from: "me", text: text, time: time.toLocaleTimeString() });
        }
      });
    }

  }

  add(c:number){
    console.log("questo è il tuo turno: ",this.urturn)
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
  
  closeMatch(){

      this.router.navigate(['/home'])

  }
  addFriend() {
    this.us.add_friendRequest(this.p2).subscribe((data) => {
      // miss toast service
      // CASTE FIX THIS
      //this.toastN("Request Forwarded")
    })

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
