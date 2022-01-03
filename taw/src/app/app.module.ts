import { NgModule, OnDestroy, OnInit } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {MatBadgeModule} from '@angular/material/badge';
import {MatIconModule} from '@angular/material/icon';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

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
import { ToastComponent } from './toast/toast.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { WatchComponent } from './watch/watch.component';
import { FriendStatsComponent } from './friend-stats/friend-stats.component';
import { NgChartsModule } from 'ng2-charts';
import { FriendChatComponent } from './friend-chat/friend-chat.component';
import { CpuComponent } from './cpu/cpu.component';
import { ModChatComponent } from './mod-chat/mod-chat.component';

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
    WatchComponent,
    FriendStatsComponent,
    FriendChatComponent,
    CpuComponent,
    ModChatComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FontAwesomeModule,
    NgbModule,
    MatBadgeModule,
    MatIconModule,
    BrowserAnimationsModule,
    NgChartsModule
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
