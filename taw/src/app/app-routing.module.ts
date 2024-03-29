import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameComponent } from './game/game.component';
import { HomepageComponent } from './homepage/homepage.component';
import { NewModeratorComponent } from './new-moderator/new-moderator.component';
import { AllUserComponent } from './all-user/all-user.component';
import { UserLoginComponent } from './user-login/user-login.component';
import { UserLogoutComponent } from './user-logout/user-logout.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserSigninComponent } from './user-signin/user-signin.component';
import { WatchComponent } from './watch/watch.component';
import { FriendStatsComponent } from './friend-stats/friend-stats.component';
import { FriendChatComponent } from './friend-chat/friend-chat.component';
import { CpuComponent } from './cpu/cpu.component';
import { ModChatComponent } from './mod-chat/mod-chat.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: UserLoginComponent },
  { path: 'home', component: HomepageComponent },
  { path: 'logout', component: UserLogoutComponent },
  { path: 'signin', component: UserSigninComponent },
  { path: 'profile', component: UserProfileComponent },
  { path: 'new-mod', component: NewModeratorComponent },
  { path: 'all-user', component: AllUserComponent },
  { path: 'game', component: GameComponent },
  { path: 'watch', component: WatchComponent },
  { path: 'cpu', component: CpuComponent },
  { path: 'user-stats/:friend',  component: FriendStatsComponent },
  { path: 'friend-chat/:friend',  component: FriendChatComponent },
  { path: 'mod-chat/:user',  component: ModChatComponent },
  {path: '**', redirectTo:'/login', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
  
}
