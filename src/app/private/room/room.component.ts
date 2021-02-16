import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { SipjsService } from '../../services/sipjs.service';
import { NavbarService } from '../../services/navbar.service';
import { Globals } from '../../globals';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css']
})
export class RoomComponent implements OnInit {

  globals: Globals;

  videoActive: boolean;
  videoMsg: string;
  audioActive: boolean;
  audioMsg: string;
  screenShare = false;
  addPeople = false;

  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(
    public nav: NavbarService,
    private sipJs: SipjsService,
    globals: Globals
  ) {
    this.globals = globals;
    this.nav.hide();
  }

  ngOnInit(): void { }


  screenSharing(): void {
    if (!this.screenShare) {
      this.screenShare = true;
      // this.sipJs.screenSharing();
    } else {
      this.screenShare = false;
      // this.sipJs.stopScreenSharing();
    }

  }

  addingPeople(): void {

    if (!this.addPeople) {
      this.addPeople = true;
    } else {
      this.addPeople = false;
    }
  }

  sendingInvita(): void {
    // tslint:disable-next-line:max-line-length
    alert('Process under contruction, you could copy the URL of this room and paste in an email and sending to somebody else or many people! ');
  }

  hangupCall(): void {

    this.sipJs.hangupCall();

  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }


}

