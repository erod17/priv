import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SipjsService } from '../../services/sipjs.service';
import { Globals } from '../../globals';

@Component({
  selector: 'app-funct-buttons',
  templateUrl: './funct-buttons.component.html',
  styleUrls: ['./funct-buttons.component.css']
})
export class FunctButtonsComponent implements OnInit {

  glob: Globals;

  constructor(
    private router: Router,
    public sipJs: SipjsService,
    glob: Globals
  ) {
    this.glob = glob;
   }

  ngOnInit(): void {

  }

  public async makeCall(vidOpt: boolean): Promise<void> {

    const oc = window.localStorage.getItem('onCall');

    if (oc === 'true' && !this.glob.onCall) {
      alert('You are on a call from this browser');
      return;
    }
    const phoNumb = this.glob.outgoingNumber;

    if (this.sipJs.makeCall(phoNumb, vidOpt)) {
      this.glob.outgoingCall = true;
      if (vidOpt) {
        this.router.navigate(['room']);
      }
    }
  }


  public async hangupCall(): Promise<void> {

    await this.sipJs.hangupCall();

  }

  setMute(): void {

    if (!this.sipJs.isMuted()) {
      this.sipJs.mute();
    } else {
      this.sipJs.unmute();
    }

  }

  switchDialpad(): void {
    console.log('...');
  }

  transferCall(): void {
    console.log('...');
  }


}
