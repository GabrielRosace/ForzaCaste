import { Component, OnInit } from '@angular/core';
import {ChangeDetectorRef} from '@angular/core';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  public game:number[][]=[]

  constructor(private ref: ChangeDetectorRef) { }
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
  add(c:number){
    
    for(var i:number=5;i>=0;i--){
      if(this.game[i][c]==0){
        this.game[i][c]=1;
        console.log("valore: ",this.game[i][c]);
        return;
      }
    }
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
