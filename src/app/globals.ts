import { Injectable } from '@angular/core';

@Injectable()

// ***** Class to handle global variables that control several objects and functions in the UI
export class Globals {

  // ***** Object to be used for setup the user credentials, set as Local Storage and to be
  // ***** reuse it to make login when the user refreh de web site
  userCredentials = { ext: null,
                      pwd: null,
                      fn: null,
                      dom: null,
                      wss: null };

  incomingCall = false;
  outgoingCall = false;
  outgoingNumber = '';
  incomingNumber = '';

  onCall: boolean;
  showOncall: boolean;

  videoChat: boolean;
  maxListCalls = 3;
  showNavBar: boolean;


}
