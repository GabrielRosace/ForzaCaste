import { NgModule, OnDestroy, OnInit } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UserLoginComponent } from './user-login/user-login.component';

// Services
import { UserHttpService } from './user-http.service';
import { HttpClientModule } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HomepageComponent } from './homepage/homepage.component';
import { UserLogoutComponent } from './user-logout/user-logout.component';
import { UserSigninComponent } from './user-signin/user-signin.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { NewModeratorComponent } from './new-moderator/new-moderator.component';
import { SocketioService } from './socketio.service';
import { UserDeletionComponent } from './user-deletion/user-deletion.component';
import { GameComponent } from './game/game.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastComponent } from './toast/toast.component';
import {MatBadgeModule} from '@angular/material/badge';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { WatchComponent } from './watch/watch.component';

@NgModule({
  declarations: [
    AppComponent,
    UserLoginComponent,
    HomepageComponent,
    UserLogoutComponent,
    UserSigninComponent,
    SidebarComponent,
    UserProfileComponent,
    NewModeratorComponent,
    UserDeletionComponent,
    GameComponent,
    ToastComponent,
    WatchComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FontAwesomeModule,
    NgbModule,
    MatBadgeModule,
    BrowserAnimationsModule
  ],
  providers: [
    { provide: UserHttpService, useClass: UserHttpService }
  ],
  bootstrap: [AppComponent]
})
export class AppModule{
  constructor(private socket: SocketioService) {
    
  }
  
}
