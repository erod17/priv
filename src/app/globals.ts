import { Injectable } from '@angular/core';
// import { Howl } from 'howler';

@Injectable()
export class Globals {

  userCredentials = { ext: null,
                      pwd: null,
                      fn: null,
                      dom: null,
                      wss: null };
  incomingCall = false;
  outgoingCall = false;
  onMeeting = false;
  moderator = false;
  // outgoingCallSound = new Howl({src: ['https://dhcomm.net/sounds/RingBack.mp3'], loop: true, html5 : true});
  // incomingcallSound = new Howl({src: ['https://dhcomm.net/sounds/warble4-trill.wav'], loop: true, html5 : true});

  videoNewMeeting: boolean;
  audioNewMeeting: boolean;
  maxListCalls = 3;
  showNavBar: boolean;

}
