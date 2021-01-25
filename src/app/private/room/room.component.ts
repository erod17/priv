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

  infoRoom = {};
  infoUA = {};

  lockRoom = false;
  lockMsg = 'Lock Room';
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
  fruits: Fruit[] = [
    {name: 'first@hotmail.com'},
    {name: 'second@gmail.com'},
    {name: 'whoever@dhcomm.net'},
  ];

  constructor(
    public nav: NavbarService,
    private sipJs: SipjsService,
    globals: Globals
  ) {
    this.globals = globals;
    this.nav.hide();
  }

  ngOnInit(): void {

    this.videoActive = (window.localStorage.getItem('videoNewMeeting') === 'true' ? true : false);
    this.videoMsg = (!this.videoActive ? 'Video On' : 'Video Off');
    this.audioActive = (window.localStorage.getItem('audioNewMeeting') === 'true' ? true : false);
    this.audioMsg = (!this.audioActive ? 'Audio On' : 'Audio Off');

  }


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

    this.globals.moderator = false;
    this.sipJs.hangupCall();

    // const room = {
    //   conf_uuid:  JSON.parse(window.localStorage.getItem('freeConfRoom'))[0].conf_uuid
    // };

    // buscar desde la API de Freeswitch...
    // setTimeout(() => {
    //   this.freeConfServ.updFreeUserAgent(room)
    //       .subscribe((data: any) => {
    //         if (data) {
    //           window.localStorage.removeItem('freeConfRoom');
    //           window.localStorage.removeItem('freeUAInfo');
    //           // this.router.navigate(['home']);
    //         }
    //       });
    // }, 500);
  }



  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our fruit
    if ((value || '').trim()) {
      this.fruits.push({name: value.trim()});
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  remove(fruit: Fruit): void {
    const index = this.fruits.indexOf(fruit);

    if (index >= 0) {
      this.fruits.splice(index, 1);
    }
  }



  public async sendingDTMF(digit: string, from: string): Promise<void> {

    this.sipJs.sendDTMF(digit);

    if (from === 'lockBtn') {
      this.lockRoom = !this.lockRoom;
      this.lockMsg = (!this.lockRoom ? 'Lock Room' : 'Unlock Room');
    } else if (from === 'videoBtn') {
      this.videoActive = !this.videoActive;
      this.videoMsg = (!this.videoActive ? 'Video On' : 'Video Off');
    } else if (from === 'audioBtn'){
      this.audioActive = !this.audioActive;
      this.audioMsg = (!this.audioActive ? 'Audio On' : 'Audio Off');
    }


  }

  public setVideoNewMeeting(from: string): void {

    const videoValue = window.localStorage.getItem('videoNewMeeting');

    if (videoValue === 'false' && !this.videoActive) {
      window.localStorage.setItem('videoNewMeeting', 'true');
      this.videoActive = true;
      this.videoMsg = 'Video Off';
      this.sipJs.reInvite();
    } else {
      this.sendingDTMF('1', from);
    }



  }

  public setAudioNewMeeting(from: string): void {

    const audioValue = window.localStorage.getItem('audioNewMeeting');

    if (audioValue === 'false' && !this.videoActive) {
      window.localStorage.setItem('audioNewMeeting', 'true');
      this.audioActive = true;
      this.audioMsg = 'Audio Off';
      this.sipJs.reInvite();
    } else {
      this.sendingDTMF('2', from);
    }


  }




}



export interface Fruit {
  name: string;
}
