import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomepageComponent } from './homepage/homepage.component';
import { NewModeratorComponent } from './new-moderator/new-moderator.component';
import { UserLoginComponent } from './user-login/user-login.component';
import { UserLogoutComponent } from './user-logout/user-logout.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserSigninComponent } from './user-signin/user-signin.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: UserLoginComponent },
  { path: 'home', component: HomepageComponent },
  { path: 'logout', component: UserLogoutComponent },
  { path: 'signin', component: UserSigninComponent },
  { path: 'profile', component: UserProfileComponent },
  { path: 'new-mod', component: NewModeratorComponent}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
