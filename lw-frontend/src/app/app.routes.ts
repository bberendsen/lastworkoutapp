import { Routes } from '@angular/router';
import { HomescreenComponent } from './homescreen/homescreen-component';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { SettingsComponent } from './settings/settings.component';
import { AccountComponent } from './settings/account/account.component';
import { OnboardingComponent } from './onboarding/onboarding.component';
import { OnboardingTeamComponent } from './onboarding/onboarding-team/onboarding-team.component';
import { TeamsListComponent } from './teams/teams-list.component';
import { TeamDetailComponent } from './teams/team-detail.component';
import { TeamCreateComponent } from './teams/team-create.component';
import { TeamEditComponent } from './teams/team-edit.component';
import { UserProfileComponent } from './users/user-profile.component';
import { LoginComponent } from './auth/login/login.component';
import { LiveFeedComponent } from './live-feed/live-feed.component';
import { ResetPasswordRequestComponent } from './auth/password-reset/reset-password-request.component';
import { ResetPasswordVerifyComponent } from './auth/password-reset/reset-password-verify.component';
import { ResetPasswordNewComponent } from './auth/password-reset/reset-password-new.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/homescreen',
    pathMatch: 'full'
  },
  { 
    path: 'homescreen', 
    component: HomescreenComponent,
    canActivate: [authGuard],
    pathMatch: 'full'
  },
  {
    path: 'users/:userId',
    component: UserProfileComponent,
    canActivate: [authGuard],
    pathMatch: 'full',
  },
  {
    path: 'leaderboard',
    component: LeaderboardComponent,
    canActivate: [authGuard],
    pathMatch: 'full'
  },
  {
    path: 'statistics',
    component: StatisticsComponent,
    canActivate: [authGuard],
    pathMatch: 'full'
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [authGuard],
    pathMatch: 'full'
  },
  {
    path: 'settings/account',
    component: AccountComponent,
    canActivate: [authGuard],
    pathMatch: 'full'
  },
  {
    path: 'teams/create',
    component: TeamCreateComponent,
    canActivate: [authGuard],
    pathMatch: 'full',
  },
  {
    path: 'teams/:id/edit',
    component: TeamEditComponent,
    canActivate: [authGuard],
    pathMatch: 'full',
  },
  {
    path: 'teams/:id',
    component: TeamDetailComponent,
    canActivate: [authGuard],
    pathMatch: 'full',
  },
  {
    path: 'teams',
    component: TeamsListComponent,
    canActivate: [authGuard],
    pathMatch: 'full',
  },
  {
    path: 'live-feed',
    component: LiveFeedComponent,
    canActivate: [authGuard],
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    pathMatch: 'full'
  },
  {
    path: 'reset-password',
    component: ResetPasswordRequestComponent,
    pathMatch: 'full',
  },
  {
    path: 'reset-password/verify',
    component: ResetPasswordVerifyComponent,
    pathMatch: 'full',
  },
  {
    path: 'reset-password/new',
    component: ResetPasswordNewComponent,
    pathMatch: 'full',
  },
  {
    path: 'onboarding',
    component: OnboardingComponent,
    pathMatch: 'full'
  },
  {
    path: 'onboarding/team',
    component: OnboardingTeamComponent,
    canActivate: [authGuard],
    pathMatch: 'full',
  },
];
