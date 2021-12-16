import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameComponent } from './game/game.component';
import { HomepageComponent } from './homepage/homepage.component';
import { NewModeratorComponent } from './new-moderator/new-moderator.component';
import { UserDeletionComponent } from './user-deletion/user-deletion.component';
import { UserLoginComponent } from './user-login/user-login.component';
import { UserLogoutComponent } from './user-logout/user-logout.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserSigninComponent } from './user-signin/user-signin.component';
import { WatchComponent } from './watch/watch.component';
import { FriendStatsComponent } from './friend-stats/friend-stats.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: UserLoginComponent },
  { path: 'home', component: HomepageComponent },
  { path: 'logout', component: UserLogoutComponent },
  { path: 'signin', component: UserSigninComponent },
  { path: 'profile', component: UserProfileComponent },
  { path: 'new-mod', component: NewModeratorComponent },
  { path: 'user-deletion', component: UserDeletionComponent },
  { path: 'game', component: GameComponent },
  { path: 'watch', component: WatchComponent },
  { path: 'friend-stats/:friend',  component: FriendStatsComponent }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
  
}
