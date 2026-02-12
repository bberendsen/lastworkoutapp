import { Routes } from '@angular/router';
import { HomescreenComponent } from './homescreen/homescreen-component';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { SettingsComponent } from './settings/settings.component';
import { AccountComponent } from './settings/account/account.component';
import { OnboardingComponent } from './onboarding/onboarding.component';
import { LoginComponent } from './auth/login/login.component';
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
    path: 'login',
    component: LoginComponent,
    pathMatch: 'full'
  },
  {
    path: 'onboarding',
    component: OnboardingComponent,
    pathMatch: 'full'
  },
];
