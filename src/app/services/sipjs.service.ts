import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import audioPlayer from './sounds.service';
import { ToneService } from './tone.service';
import { inspect } from 'util';
import { Howl } from 'howler';
import {
  Invitation,
  Inviter,
  Info,
  InviterOptions,
  Referral,
  Registerer,
  RegistererOptions,
  Session,
  SessionState,
  UserAgent,
  UserAgentState,
  UserAgentOptions,
  InvitationAcceptOptions,
  Notification,
  Web,
  RegistererRegisterOptions,
  RegistererState,
  RegistererUnregisterOptions,
  InviterInviteOptions,
  Message,
  SessionInviteOptions,
  Messager,
  RequestPendingError,
  Bye
} from 'sip.js';
import { SimpleUserDelegate } from 'sip.js/lib/platform/web/simple-user/simple-user-delegate';
import { SimpleUserOptions } from 'sip.js/lib/platform/web/simple-user/simple-user-options';
import { SessionDescriptionHandler } from 'sip.js/lib/platform/web';
import { OutgoingInviteRequest } from 'sip.js/lib/core';

import { Globals } from '../globals';



function _window(idElement: any): any {
  // return the global native browser window object
  return window.document.getElementById(idElement);
}

@Injectable({
  providedIn: 'root'
})

// *************************************************************************************** //
// ***** Main Service Class, which makes use of the several SIP.js features to handle **** //
// ***** everything about the WebRTC services. ******************************************* //
// *************************************************************************************** //
export class SipjsService {

  // ***** Delegate. ***** //
  public delegate: SimpleUserDelegate | undefined;

  globals: Globals;
  private held = false;
  private muted = false;
  private attemptingReconnection = false;
  private registerRequested = false;
  private connectRequested = false;
  private offeredAudio = false;
  private offeredVideo = false;
  private remoteVideo = false;
  public localVideo = false;
  private activeCall = false;
  private userAgent: UserAgent;
  private registerer: Registerer;
  private options: SimpleUserOptions = {};
  private session: Session | undefined = undefined;
  private mediaElement: any;
  private audioElement: HTMLAudioElement;
  private chatMedia: { sessionDescriptionHandlerOptions: { constraints: { audio: any; video: any; }; }; };
  private outgoingCallSound = new Howl({src: ['https://dhcomm.net/sounds/RingBack.mp3'], loop: true, html5 : true});
  private incomingcallSound = new Howl({src: ['https://dhcomm.net/sounds/warble4-trill.wav'], loop: true, html5 : true});


  constructor(
    public toneService: ToneService,
    public router: Router,
    globals: Globals,
  ) {

    audioPlayer.initialize();
    this.globals = globals;

    // Delegate
    this.delegate = this.options.delegate;
  }

  // ***** The function where is created the User Agent (UA) against the SIP server  ***** //
  public async connect(userInfo: any): Promise<any> {

    // ***** Setup SIPJs ***** //
    try {

        const transportOptions = {
          server: 'wss://' + userInfo.dom + ':' + userInfo.wss,
          traceSip: true,
          bundlePolicy: 'max-bundle',
          rtcpMuxPolicy: 'negotiate'
        };

        const uri = UserAgent.makeURI('sip:' + userInfo.ext + '@' + userInfo.dom + ':' + userInfo.wss);

        if (!uri) {
          console.log('SIPJS Error, URI error');
          return;

        } else {

          const userAgentOptions: UserAgentOptions = {
            authorizationPassword: userInfo.pwd,
            authorizationUsername: userInfo.ext,
            uri,
            transportOptions
          };

          // ***** UserAgent ***** //
          this.userAgent = new UserAgent(userAgentOptions);

          // ***** UserAgent's delegate ***** //
          this.userAgent.delegate =  {
            onInvite: (invitation: Invitation): void => {

              // ***** An Invitation is a Session ***** //
              const incomingSession: Session = invitation;

              // ***** If the user is on a call and anothe call is ongoing, a hangup will be executed and the  ***** //
              // ***** cuurrent call will be connected with the new call requested. ******************************** //
              if (this.session) {
                console.log(this.session);
                console.log(invitation);
                alert('Incoming call, you will be connected on this');
                this.terminate();
                this.incomingCall(invitation, (this.offeredVideo ? true : false));

                return;
              }

              // ================================================================//
              if (invitation) {
                // ***** If there is an incoming call this will be handle on the following function ***** //
                this.incomingCall(invitation, (this.offeredVideo ? true : false));
              }


            },
            onConnect: (): void => {
              console.log('onConnect');
            },
            // ***** when connection issues happen, this method is triggered by going to the reconnection function ***** //
            onDisconnect: async (error: Error): Promise<void> => {
              alert('Disconnect   :::>  ' + error);
              await this.attemptReconnection();

            },
            onRefer: (referral: Referral): void => {
              alert('On Refer');
            },
            onMessage: (message: Message): void => {
              // alert('Message' + message);
            },
            onNotify: (notification: Notification) => {
              // alert('onNotify invitado ::: lin -> 264');
              console.log(notification.request.body);
            },
            onRegister: (registration: Registerer) => {
              alert('On Register  ::: -> lin 267');
            },
            onReferRequest: () => {
              alert('onReferRequest');
            },
            onRegisterRequest: () => {
              alert('onRegisterRequest');
            }
          };

          // ***** Check if the UA has been started, if don't it'll be initialized and registered in the SIP Server *****//
          if (this.userAgent.state !== UserAgentState.Started) {
            await this.userAgent.start();
            await this.register();
          }
        }

        return this.registerer;

    } catch (error) {
      console.log('JsSIP config error', error);
      return false;
    }
  }

  // ***** Function that makes the UA registration into the SIP Server ***** //
  private async register(registererOptions?: RegistererOptions, registererRegisterOptions?: RegistererRegisterOptions): Promise<void> {

    this.registerRequested = true;
    console.log(this.registerer);

    if (!this.registerer) {

      this.registerer = new Registerer(this.userAgent, registererOptions);
      this.registerer.stateChange.addListener((state: RegistererState) => {
        switch (state) {
          case RegistererState.Initial:
            break;
          case RegistererState.Registered:
            if (this.delegate && this.delegate.onRegistered) {
              this.delegate.onRegistered();
            }
            break;
          case RegistererState.Unregistered:
            if (this.delegate && this.delegate.onUnregistered) {
              this.delegate.onUnregistered();
            }
            break;
          case RegistererState.Terminated:
            this.registerer = undefined;
            break;
          default:
            throw new Error('Unknown registerer state.');
        }

      });
    }

    return this.registerer.register(registererRegisterOptions).then(() => {
      return;
    });

  }

  // ***** Helper to disconnect the UA, after that, the method unregister is calling in order to do the complete log out ***** //
  public async disconnect(): Promise<void> {
    await this.userAgent.stop()
      .then(async () => {
        await this.unregister();
        window.localStorage.removeItem('userCredentials');
        window.localStorage.removeItem('onCall');
      })
      .catch((error: Error) => {
        console.log('SIPJS Error disconnect UA....', error);
      });
  }

  // ***** Method for make the final log out from SIP server ***** //
  private async unregister(registererUnregisterOptions?: RegistererUnregisterOptions): Promise<void> {

    if (!this.registerer) {
      return Promise.resolve();
    }

    return this.registerer.unregister(registererUnregisterOptions)
    .then(() => {
      window.localStorage.removeItem('userCredentials');

      return;
    });
  }

  // ***** Helper function for handle the incoming calls ***** //
  private async incomingCall(session: Session, vid?: boolean): Promise<void> {

    // tslint:disable-next-line:no-string-literal
    const varNumb = await session.remoteIdentity.uri['_normal'].user;
    this.globals.incomingCall = true;
    this.globals.incomingNumber = varNumb;

    // ***** Initialize the incoming call session making use of the same function ***** //
    this.initSession(session).then(() => {
      this.incomingcallSound.play();
    });
  }

  // ***** Helper function to answer the incoming calls ***** //
  public async answerCall(invitationAcceptOptions?: InvitationAcceptOptions): Promise<void> {

    if (!this.session) {
      return Promise.reject(new Error('Session does not exist.'));
    }

    if (!(this.session instanceof Invitation)) {
      return Promise.reject(new Error('Session not instance of Invitation.'));
    }

    // ***** Here we make use of the SDP (registry of the current incoming-call) to ***** //
    // ***** evaluate if the call comes in with the Video option ************************ //
    console.log(this.session.request.body);
    const sdp = this.session.request.body;
    if ((/\r\nm=video /).test(sdp)) {
      this.localVideo = true;
      this.offeredVideo = true;
    }

    // ***** Using the ACCEPT-SIP.js's method, we grab the call with its options ***** //
    return await this.session.accept(await this.setMedia((this.offeredVideo ? true : false)));
  }

  // ***** Helper function for decline or reject incoming calls ***** //
  public async decline(): Promise<void> {

    if (!this.session) {
      return Promise.reject(new Error('Session does not exist.'));
    }

    if (!(this.session instanceof Invitation)) {
      return Promise.reject(new Error('Session not instance of Invitation.'));
    }

    // **** After rejecting the call, the sounds are cleaned ***** //
    await this.session.reject().then(() => {
      this.incomingcallSound.stop();
      this.outgoingCallSound.stop();
      this.activeCall = false;
    });
  }

  // ***** According to the value passed top this helper, will be activated the Video Option ***** //
  async setMedia(pVid?: boolean): Promise<any> {

    const chatMedia = {
      sessionDescriptionHandlerOptions : {
        constraints: {
          audio: true,
          video: pVid
        }
      }
    };
    return chatMedia;
  }

  // ************************************************ //
  // ***** Function where the calls are started ***** //
  // ************************************************ //
  public async makeCall(destination: string,
                        vidOpt?: boolean,
                        inviterOptions?: InviterOptions,
                        inviterInviteOptions?: InviterInviteOptions): Promise<void> {

    if (this.session) {
      this.terminate();
      return Promise.reject(new Error('Session already exists.'));
    }

    // tslint:disable-next-line:no-string-literal
    const to = this.userAgent['options'].uri.raw;
    const num = to.scheme + ':' + destination + '@' + to.host + ':' + to.port;

    // ***** The URI target o call receiver dir is prepared through this sip.js function ***** //
    const target = UserAgent.makeURI(num);

    if (!target) {
      return Promise.reject(new Error(`Failed to create a valid URI from "${num}"`));
    }

    // ***** Create a new Inviter for the outgoing Session ***** //
    const inviter = new Inviter(this.userAgent, target, await this.setMedia(vidOpt));

    // ***** Options including delegate to capture response messages ***** //
    const inviteOptions: InviterInviteOptions = {
      requestDelegate: {
        onProgress: (response) => {
          console.log('************ Invite response < onProgress >**************');
          console.log(response);
        },
        onAccept: (response) => {
          console.log('************ Positive response < onAccept > **************');
          console.log(response.message.body);
          const sdp = response.message.body;

          if ((/\r\na=end-of-candidates/).test(sdp)) {
            alert('Call has been rejected!');
            return this.terminate();
          }

          this.activeCall = true;

        },
        onReject: (response) => {
          console.log('************ Negative response < onReject > OUTGOING CALL **************');
          console.log(response);
          window.alert('************ Negative response < onReject > OUTGOING CALL **************');
          inviter.dispose();
        },
        onTrying: (response) => {
          // alert('onTrying');
        }


      },
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: true,
          video: vidOpt
        }
      }
    };


    // ***** If everything is ok, the INVITE will be sent ***** //
    return this.sendInvite(inviter, inviterOptions, inviteOptions).then(() => {
      return;
    });
  }


  // ***** Helper function to init send then send invite. ***** //
  private async sendInvite(inviter: Inviter, inviterOptions?: InviterOptions, inviterInviteOptions?: InviterInviteOptions): Promise<void> {

    console.log(inviter.sessionDescriptionHandler);
    console.log(inviterInviteOptions.sessionDescriptionHandlerOptions.constraints);

    // ***** Initialize our session -- USING THE SAME METHOD FOR THE INCOMING CALL UA -- ***** //
    this.initSession(inviter, inviterInviteOptions);

    // tslint:disable-next-line:no-string-literal
    const vOpt = inviterInviteOptions.sessionDescriptionHandlerOptions.constraints['video'];

    // ***** This is the method which Send the INVITE to the other party ***** //
    return inviter.invite(inviterInviteOptions)
                        .then((request: OutgoingInviteRequest) => {
                          console.log('***************** Successfully < SENT INVITE > *********************');
                          console.log('INVITE request');
                          console.log(request);
                          this.outgoingCallSound.play();
                          this.offeredVideo = (vOpt ? true : false);
                        })
                        .catch((error: Error) => {
                          console.log('Failed to send INVITE');
                          alert('Failed to send INVITE');
                        });
  }

  // ********************************************** --- INIT SESSION --- *************************************************** //
  // ***** This function make possible the init session for both parties < Caller and Callee > to connect between them ***** //
  // ***** handle inside the whole neccesarries method in order to START and FINISH the calls  ***************************** //
  public async initSession(session: Session, referralInviterOptions?: InviterOptions): Promise<void> {

    // **** Set session ***** //
    this.session = session;

    // ***** Setup session state change handler ***** //
    this.session.stateChange.addListener((state: SessionState) => {

      if (this.session !== session) {
        return; // *****  if our session has changed, just return ***** //
      }
      switch (state) {
        case SessionState.Initial:
          // alert('Initial');
          break;
        case SessionState.Establishing:
          // alert('Establishing');
          if (this.session.sessionDescriptionHandlerOptions.constraints['video']) {
            this.setupLocalMedia();
            this.offeredVideo = true;
            this.router.navigate(['room']);
          }

          break;
        case SessionState.Established:
          // alert('Established');
          this.globals.onCall = true;
          this.globals.outgoingCall = false;
          this.outgoingCallSound.stop();
          this.globals.incomingCall = false;
          this.incomingcallSound.stop();
          window.localStorage.setItem('onCall', 'true');
          if (this.session.sessionDescriptionHandlerOptions.constraints['video']) {
            this.setupLocalMedia();
            this.localVideo = true;
          }
          this.setupRemoteMedia();
          this.removeSounds();
          break;
        case SessionState.Terminating:
          // alert('Terminating');
          break;
        case SessionState.Terminated:
          // alert('Terminated');
          this.globals.onCall = false;
          this.globals.incomingNumber = '';
          this.globals.outgoingNumber = '';
          this.globals.incomingCall = false;
          this.incomingcallSound.stop();
          this.globals.outgoingCall = false;
          this.outgoingCallSound.stop();
          this.localVideo = false;
          this.offeredVideo = false;
          window.localStorage.setItem('onCall', 'false');
          this.cleanupMedia();
          this.session = undefined;

          break;
        default:
          throw new Error('Unknown session state.');
      }
    });


    this.session.delegate = {
        onInvite: async (request) => {
          // alert('onInvite');
        },
        onRefer: async (referral: Referral) => {
          alert('Incoming Session <*** onRefer ***>');
          referral
                .accept()
                .then(() => this.sendInvite(referral.makeInviter(referralInviterOptions), referralInviterOptions))
                .catch((error: Error) => {
                  console.error(error.message);
                });
        },
        onNotify: async (notification: Notification) => {
          alert('Incoming Session <*** onNotify ***>');
        },
        onBye: async (bye: Bye) => {
          // alert('Incoming Session <*** onBye ***>');
        },
        onInfo: async (info: Info) => {
          alert('Incoming Session <*** onInfo ***>');
        },
        onMessage: async (message: Message) => {
          alert('Incoming Session <*** onMessage ***>');
        },
        onSessionDescriptionHandler: async () => {
          // const vidOpt = (this.session.sessionDescriptionHandlerOptions.constraints['video']);
          console.log(this.session.sessionDescriptionHandlerOptions);
          // alert('Incoming Session <*** onSessionDescriptionHandler ***>   ');
        }
    };
  }

  // ***** Helper function to attach local media to html elements. ***** //
  private async setupLocalMedia(): Promise<void> {

    this.mediaElement = this.nativeWindow('localVideo');

    if (this.mediaElement) {
      const localStream = this.localMediaStream;
      if (!localStream) {
        throw new Error('Local media stream undefiend.');
      }
      this.mediaElement.autoplay = true; // ***** Safari hack, because you cannot call .play() from a non user action ***** //
      this.mediaElement.playsinline = true;
      this.mediaElement.controls = false;
      this.mediaElement.muted = true;
      this.mediaElement.srcObject = localStream;
      await this.mediaElement.play().catch((error: Error) => {
        console.error(`Failed to play local media`);
        console.error(error.message);
      });
      localStream.onaddtrack = async (): Promise<void> => {
        console.log(`Local media onaddtrack`);
        await this.mediaElement.load(); // ***** Safari hack, as it doesn't work otheriwse ***** //
        await this.mediaElement.play().catch((error: Error) => {
          console.error(` Failed to play local media`);
          console.error(error.message);
        });
      };
    }
  }

  // ***** Helper function to attach remote media to html elements. ***** //
  private async setupRemoteMedia(): Promise<void> {

    this.mediaElement = this.nativeWindow('remoteVideo');

    if (this.mediaElement) {
      const remoteStream = this.remoteMediaStream;
      console.log(remoteStream);

      if (!remoteStream) {
        throw new Error('Remote media stream undefiend.');
      }
      this.mediaElement.autoplay = true; // ***** Safari hack, because you cannot call .play() from a non user action ***** //
      this.mediaElement.playsinline = true;
      this.mediaElement.controls = false;
      this.mediaElement.srcObject = remoteStream;
      await this.mediaElement.play().catch((error: Error) => {
        console.error(`Failed to play remote media`);
        console.error(error.message);
      });
      remoteStream.onaddtrack = async (): Promise<void> => {
        console.log(`Remote media onaddtrack`);
        await this.mediaElement.load(); // ***** Safari hack, as it doesn't work otheriwse ***** //
        await this.mediaElement.play().catch((error: Error) => {
          console.error(` Failed to play remote media`);
          console.error(error.message);
        });
      };
    }
  }

  // ***** Helper function to remove media from html elements. ***** //
  private async cleanupMedia(): Promise<void> {

    this.offeredVideo = false;
    this.offeredAudio = false;
    if (this.mediaElement) {
      this.router.navigate(['dashboard']);
    }

  }


  get localMediaStream(): MediaStream | undefined {
    const sdh = this.session?.sessionDescriptionHandler;
    if (!sdh) {
      return undefined;
    }
    if (!(sdh instanceof SessionDescriptionHandler)) {
      throw new Error('Session description handler not instance of web SessionDescriptionHandler');
    }
    return sdh.localMediaStream;
  }

  get remoteMediaStream(): MediaStream | undefined {
    const sdh = this.session?.sessionDescriptionHandler;
    if (!sdh) {
      return undefined;
    }
    if (!(sdh instanceof SessionDescriptionHandler)) {
      throw new Error('Session description handler not instance of web SessionDescriptionHandler');
    }
    return sdh.remoteMediaStream;
  }

  // ***** Function called by the User Interfase ***** //
  public async hangupCall(): Promise<void> {
    return await this.terminate();
  }


  // ***** Helper function that handle the finish of the call connection ***** //
  private async terminate(): Promise<void> {

    this.globals.outgoingNumber = '';
    this.globals.incomingNumber = '';
    this.globals.onCall = false;

    if (!this.session) {
      this.router.navigate(['dashboard']);
      return Promise.reject(new Error('Session does not exist. You will be redirected...'));
    }

    switch (this.session.state) {
      case SessionState.Initial:
        if (this.session instanceof Inviter) {
          return this.session.cancel().then(() => {
            console.log(`Inviter never sent INVITE (canceled)`);
          });
        } else if (this.session instanceof Invitation) {
          return this.session.reject().then(() => {
            console.log(`Invitation rejected (sent 480)`);
          });
        } else {
          throw new Error('Unknown session type.');
        }
      case SessionState.Establishing:
        if (this.session instanceof Inviter) {
          return this.session.cancel().then(() => {
            console.log(`Inviter canceled (sent CANCEL)`);
          });
        } else if (this.session instanceof Invitation) {
          return this.session.reject().then(() => {
            console.log(`Invitation rejected (sent 480)`);
          });
        } else {
          throw new Error('Unknown session type.');
        }
      case SessionState.Established:
        return this.session.bye().then(() => {
          console.log(`Session ended (sent BYE)`);
        }).catch((error: Error) => {
          console.log('SIPJS Error Terminanting UA....', error);
        });
      case SessionState.Terminating:
        break;
      case SessionState.Terminated:
        alert('terminated');
        break;
      default:
        throw new Error('Unknown state');
    }

    console.log(`Terminating in state ${this.session.state}, no action taken`);
    this.router.navigate(['dashboard']);
    this.attemptReconnection();
    return Promise.resolve();
  }

  // ***** When connection issues show up, this function handle the UA reconnection authomatically ***** //
  private async attemptReconnection(reconnectionAttempt = 1): Promise<void> {
    const reconnectionAttempts = 3;
    const reconnectionDelay = 4;

    if (this.attemptingReconnection) {
      console.log(`Reconnection attempt already in progress`);
    }

    if (reconnectionAttempt > reconnectionAttempts) {
      console.log(`Reconnection maximum attempts reached`);
      return;
    }

    if (reconnectionAttempt === 1) {
      console.log(`Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - trying`);
    } else {
      console.log(
        `Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - trying in ${reconnectionDelay} seconds`
      );
    }

    this.attemptingReconnection = true;

    setTimeout(
      () => {
        this.userAgent
          .reconnect()
          .then(() => {
            console.log(
              `Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - succeeded`
            );
            this.attemptingReconnection = false;
          })
          .catch((error: Error) => {
            console.log(
              `Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - failed`
            );
            alert(`Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - failed`);
            console.error(error.message);
            this.attemptingReconnection = false;
            this.attemptReconnection(++reconnectionAttempt);
          });
      },
      reconnectionAttempt === 1 ? 0 : reconnectionDelay * 1000
    );
  }

  // ***** This demo is ready to send DTM pulsation to the SIP Server, this function handle that process ***** //
  public async sendDTMF(tone: string): Promise<void> {
    console.log(`sending DTMF...`);

    // Validate tone
    if (!/^[0-9A-D#*,]$/.exec(tone)) {
      return Promise.reject(new Error('Invalid DTMF tone.'));
    }

    if (!this.session) {
      return Promise.reject(new Error('Session does not exist.'));
    }

    console.log(` Sending DTMF tone: ${tone}`);
    const dtmf = tone;
    const duration = 2000;
    const body = {
      contentDisposition: 'render',
      contentType: 'application/dtmf-relay',
      content: 'Signal=' + dtmf + '\r\nDuration=' + duration
    };
    const requestOptions = { body };

    await this.session.info({ requestOptions });
    return;
  }

  // ***** Helper to get the objects around the DOM ***** //
  public nativeWindow(id: any): any {
    return _window(id);
  }

  // ***** This helper return the UA status ***** //
  public getConnState(): UserAgent {
    return this.userAgent;
  }



  // ************************************************* //
  // *** Stop all sounds and remove audio elements *** //
  // ************************************************* //
  public removeSounds(): void {
    // If is ringing
    this.toneService.stopAll();

    // If is playing a message
    audioPlayer.stopAll();

    // If an audio element exist
    if (this.audioElement) {
        document.body.removeChild(this.audioElement);
        this.audioElement = null;
    }
  }

  // ***** Return the video option in the current session ***** //
  public videoActive(): boolean {
    return this.offeredVideo;
  }

  // ***** Return the loca video value in order to handle several options in the UI ***** //
  public localVideoActive(): boolean {
    return this.localVideo;
  }

  // ***** Helper function to enable/disable media tracks. ***** //
  private enableReceiverTracks(enable: boolean): void {
    if (!this.session) {
      throw new Error('Session does not exist.');
    }

    const sessionDescriptionHandler = this.session.sessionDescriptionHandler;
    if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
      throw new Error('Session\'s session description handler not instance of SessionDescriptionHandler.');
    }

    const peerConnection = sessionDescriptionHandler.peerConnection;
    if (!peerConnection) {
      throw new Error('Peer connection closed.');
    }

    peerConnection.getReceivers().forEach((receiver) => {
      if (receiver.track) {
        console.log(receiver);
        receiver.track.enabled = enable;
      }
    });
  }

  // ***** Helper function to enable/disable media tracks. ***** //
  private enableSenderTracks(enable: boolean): void {
    if (!this.session) {
      throw new Error('Session does not exist.');
    }

    const sessionDescriptionHandler = this.session.sessionDescriptionHandler;
    if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
      throw new Error('Session\'s session description handler not instance of SessionDescriptionHandler.');
    }

    const peerConnection = sessionDescriptionHandler.peerConnection;
    if (!peerConnection) {
      throw new Error('Peer connection closed.');
    }

    peerConnection.getSenders().forEach((sender) => {
      console.log(sender.track);
      if (sender.track.kind === 'audio') {
        sender.track.enabled = (sender.track.enabled ? false : true);
        return;
      }
    });

  }

  // ***** Function to mute the current session ***** //
  public mute(): void {
    console.log('disabling media tracks...');
    this.setMute(true);
  }

  // ***** Function to unmute the current session ***** //
  public unmute(): void {
    console.log('enabling media tracks...');
    this.setMute(false);
  }

  // ***** Return whether or not the session is muted ***** //
  public isMuted(): boolean {
    return this.muted;
  }

  // ***** Helper to switch the mute fucntion in the current session ***** //
  private setMute(mute: boolean): void {
    if (!this.session) {
      console.warn('A session is required to enabled/disable media tracks');
      return;
    }

    if (this.session.state !== SessionState.Established) {
      console.warn('An established session is required to enable/disable media tracks');
      return;
    }

    this.muted = mute;

    this.enableSenderTracks(!this.held && !this.muted);
  }

}
