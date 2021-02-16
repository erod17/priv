import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, FormBuilder, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { SipjsService } from '../../services/sipjs.service';
import { Globals } from '../../globals';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  globals: Globals;
  showBkSpce = false;

  public uaInfo: any = {};

  callerForm = new FormGroup({
    phoneNumber: new FormControl('')
  });

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    public sipJs: SipjsService,
    globals: Globals
  ) {
    this.globals = globals;

    // window.onbeforeunload = (event) => {
    //   alert('pkpkpkk');
    //   if (window.localStorage.getItem('onCall') === 'true') {
    //       alert('You have made changes, but you did not save them yet.\nLeaving the page will revert all changes.');
    //   }
    // };

   }

  ngOnInit(): void {
    this.uaInfo = JSON.parse(window.localStorage.getItem('userCredentials'));
    console.log(this.uaInfo);
  }

  public directionCall(): string {
    return (this.globals.outgoingCall ? 'Calling to...' : 'Incoming call from...');
  }

  public fromTo(): string {
    const ft = (this.globals.outgoingCall ? this.globals.outgoingNumber : this.globals.incomingNumber);
    if (ft) { return ft; }
    return this.globals.outgoingNumber;
  }


  public async answerCall(): Promise<void> {
    await this.sipJs.answerCall();
  }

  public async rejectCall(): Promise<void> {
    await this.sipJs.decline();
  }

  public async hangupCall(): Promise<void> {
    await this.sipJs.hangupCall();
  }

  public keyPress(event: any): void {

    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);

    if (!pattern.test(inputChar)) {
        // invalid character, prevent input
        event.preventDefault();
    }

    this.globals.outgoingNumber = this.callerForm.controls.phoneNumber.value;
    if (this.globals.outgoingNumber.length >= 0) {
      this.showBkSpce = true;
    } else {
      this.showBkSpce = false;
    }

  }

  public backSpacePhoneNumber(): void {

    this.globals.outgoingNumber = this.globals.outgoingNumber.substr(0, this.globals.outgoingNumber.length - 1);

    if (this.globals.outgoingNumber.length >= 0) {
      this.showBkSpce = true;
    } else {
      this.showBkSpce = false;
    }

  }

  public changeCallNumber(event: any): void {
    console.log(event);
  }



}
