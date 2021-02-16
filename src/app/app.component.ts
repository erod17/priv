import { Component, OnInit } from '@angular/core';
import { Router, Event, NavigationStart, NavigationEnd, NavigationError } from '@angular/router';
import { Location } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { SipjsService } from './services/sipjs.service';
import { Globals } from './globals';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  title = 'Private';
  globals: Globals;
  credential: any = {};


  constructor(
    public breakpointObserver: BreakpointObserver,
    private router: Router,
    public location: Location,
    private sipJs: SipjsService,
    globals: Globals
  ) {

    this.globals = globals;

    const uaOncall = window.localStorage.getItem('onCall');
    if (uaOncall === 'false') {
      window.localStorage.removeItem('onCall');
    }

    let lastLocation = window.localStorage.getItem('lastLocation');
    if (!lastLocation) {
      lastLocation = '/dashboard';
    }

    console.log(this.location.path());

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

    // window.addEventListener('beforeunload', (e) => {
    //   // alert(e);
    //   e.preventDefault();
    //   e.returnValue = '';
    // });

  }


  async ngOnInit(): Promise<void> {

    this.credential = JSON.parse(window.localStorage.getItem('userCredentials'));
    if (this.credential) {

      const conn = await this.sipJs.connect(this.credential).then((ret) => {
          return ret;
      });
      console.log(conn);
      if (conn) {
        // Some times the SIP Servers have a little delay returning the SDP response
        // 1.5 seconds could be enough to wait for it and get the othe step.
        setTimeout(() => {
          // tslint:disable-next-line:no-string-literal
          if (conn._state === 'Unregistered') {
            alert('Error connecting to the Domain');
            this.sipJs.disconnect();
          } else {
            this.router.navigate(['dashboard']);
          }
        }, 1500);
      } else {
        const connState = this.sipJs.getConnState();
        console.log(connState.transport);
        if (connState.transport.state === 'Disconnected') {
          alert('Error in connection establishment: net::ERR_INTERNET_DISCONNECTED :::  ' + connState.transport['logger'].category);
          this.unregister();
        }
      }
    }


  }

  public async unregister(): Promise<void> {
    await this.sipJs.disconnect();
    this.router.navigate(['welcome']);
  }




}
