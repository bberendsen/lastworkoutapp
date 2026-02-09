import { Routes } from '@angular/router';
import { HomescreenComponent } from './homescreen/homescreen-component';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/homescreen',
    pathMatch: 'full'
  },
  { 
    path: 'homescreen', 
    component: HomescreenComponent,
    pathMatch: 'full'
  },
];
