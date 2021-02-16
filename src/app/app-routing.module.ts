import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

import { WelcomeComponent } from './public/welcome/welcome.component';
import { RegistrationComponent } from './public/registration/registration.component';

import { DashboardComponent } from './private/dashboard/dashboard.component';
import { RoomComponent } from './private/room/room.component';


const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'welcome', component: WelcomeComponent},
  { path: 'registration', component: RegistrationComponent},

  { path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    data: { expectedRole: 'user' },
    runGuardsAndResolvers: 'always'
  },
  { path: 'room',
    component: RoomComponent,
    canActivate: [AuthGuard],
    data: { expectedRole: 'user' },
    runGuardsAndResolvers: 'always'
  },

];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
