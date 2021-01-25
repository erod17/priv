import { Component } from '@angular/core';
import { Router, Event, NavigationStart, NavigationEnd, NavigationError } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from './auth/auth.service';
import { SipjsService } from '../app/services/sipjs.service';
import { Globals } from './globals';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'fokuz';
  globals: Globals;
  varToken: any;
  userInfo: any;
  varContacts = [];
  varContact = [];
  varContactsIn = [];
  varContactIn = [];
  rstUserInfo: any = {};
  varUserContacts = {};


  constructor(
    public breakpointObserver: BreakpointObserver,
    private router: Router,
    private authUser: AuthService,
    private sipJs: SipjsService,
    globals: Globals
  ) {

    this.globals = globals;

    let lastLocation = window.localStorage.getItem('lastLocation');
    if (!lastLocation) {
      lastLocation = '/dashboard';
    }

    const vnm = window.localStorage.getItem('videoNewMeeting');
    if (vnm === null) {
      window.localStorage.setItem('videoNewMeeting', 'true');
    }

    const anm = window.localStorage.getItem('audioNewMeeting');
    if (anm === null) {
      window.localStorage.setItem('audioNewMeeting', 'true');
    }

    if (this.authUser.isAuthenticated()) {

      this.rstUserInfo = JSON.parse(window.localStorage.getItem('userInfo'));

      console.log(this.rstUserInfo);

      const userExtension = this.rstUserInfo.extension.extension;
      const password = this.rstUserInfo.extension.password;
      const userFullname = this.rstUserInfo.contact_name_given + ' ' + this.rstUserInfo.contact_name_family;
      const domain = this.rstUserInfo.extension.dial_domain;
      const wssServer = this.rstUserInfo.extension.dial_domain;

      this.globals.userCredentials = {  ext: userExtension,
                                        pwd: password,
                                        fn: userFullname,
                                        dom: domain,
                                        wss: wssServer };

      this.sipJs.connect();

      // this.getContacts();
      this.router.navigate([lastLocation]);

    }
    // else {

    //   this.router.navigate(['welcome']);

    // }



    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
          // Show loading indicator
          console.log('==========>>> NavigationStart <<<==========', event.url);

      }

      if (event instanceof NavigationEnd) {
          // Hide loading indicator
          console.log('==========>>> NavigationEnd <<<==========', event.url);
          window.localStorage.setItem('lastLocation', event.url);
      }

      if (event instanceof NavigationError) {
          // Hide loading indicator

          // Present error to user
          console.log('==========>>> NavigationError <<<==========', event.error);
      }
    });






  }



  getContacts(): void {

    this.varToken = window.localStorage.getItem('token');
    this.authUser.getUserContacts(this.varToken)
      .subscribe((data: any) => {
        if (data.code === '200') {
          this.varUserContacts = data.data;
          this.varUserContacts = Array.of(this.varUserContacts);
          window.localStorage.setItem('userContacts', JSON.stringify(this.varUserContacts));
        }
      }, err => {

        if (err.status === 401) {
          console.log('*************** E R R O R  **************');
          console.log(err.status);
        }
    });

  }

}
