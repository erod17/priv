import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import * as forms from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AngularMaterialModule } from './angular-material/angular-material.module';
import { JwtModule } from '@auth0/angular-jwt';

import { Globals } from './globals';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WelcomeComponent } from './public/welcome/welcome.component';
import { SignupComponent } from './public/signup/signup.component';
import { SigninComponent } from './public/signin/signin.component';
import { DashboardComponent } from './private/dashboard/dashboard.component';
import { RoomComponent } from './private/room/room.component';

export function tokenGetter(): any {
  return window.localStorage.getItem('token');
}

@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    SignupComponent,
    SigninComponent,
    DashboardComponent,
    RoomComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    AngularMaterialModule,
    HttpClientModule,
    forms.FormsModule, forms.ReactiveFormsModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        allowedDomains: ['example.com'],
        disallowedRoutes: ['example.com/examplebadroute/']
      }
    }),
  ],
  exports: [
    CommonModule,
    forms.FormsModule,
    forms.ReactiveFormsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [Globals],
  bootstrap: [AppComponent]
})
export class AppModule { }
