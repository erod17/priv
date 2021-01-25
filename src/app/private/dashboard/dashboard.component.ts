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
  userInfo = [];
  selected = 0;
  joinForm: FormGroup;
  meetForm: FormGroup;

  video = document.getElementById('video');
  button = document.getElementById('button');
  select = document.getElementById('select');
  videoNewMeeting: boolean;
  audioNewMeeting: boolean;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private sipJs: SipjsService,
    globals: Globals
  ) {

    this.globals = globals;
    this.userInfo = JSON.parse(window.localStorage.getItem('userInfo'));
    this.videoNewMeeting = (window.localStorage.getItem('videoNewMeeting') === 'true' ? true : false);
    this.audioNewMeeting = (window.localStorage.getItem('audioNewMeeting') === 'true' ? true : false);

   }

  ngOnInit(): void {

    const vcName = this.userInfo['videoConference'][0].conference_name;
    const vcPin = this.userInfo['videoConference'][0].conference_pin_number;
    const mrID = window.localStorage.getItem('lastMeetingRoom');

    this.joinForm = this.formBuilder.group({
      roomNumber: [(mrID ? mrID : ''), Validators.compose([Validators.required])],
    });

    this.meetForm = this.formBuilder.group({
      meetName: [vcName, Validators.required],
      pinNumb: [vcPin, Validators.required]
    });

  }

  async newMeeting(numb: number): Promise<void> {

    this.globals.moderator = true;
    this.router.navigate(['room']);
    this.sipJs.makeCall('sip:*33' + numb + '@pbx.fokuz.online:7443');

  }


  go(tab: number): void {
    this.selected = tab;
  }


  async answerCall(): Promise<void> {

    this.sipJs.answerCall();

  }

  public async joinRoom(): Promise<void> {

    const numb = this.joinForm.controls.roomNumber.value;
    window.localStorage.setItem('lastMeetingRoom', numb);

    this.router.navigate(['room']);
    this.sipJs.makeCall('sip:33' + numb + '@pbx.fokuz.online:7443');
  }

  public setVideoNewMeeting(event: any): void {

    window.localStorage.setItem('videoNewMeeting', event.checked);

  }

  public setAudioNewMeeting(event: any): void {

    window.localStorage.setItem('audioNewMeeting', event.checked);

  }


  public saveConfRoom(): void {

  }

  public signout(): void {
    this.sipJs.disconnect();
    this.router.navigate(['signin']);

  }

}
