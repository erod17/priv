import { Injectable, ɵConsole, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import audioPlayer from './sounds.service';
import { ToneService } from './tone.service';
import { inspect } from 'util';
// import * as SIP from 'sip.js';
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
  Message
} from 'sip.js';
import { SimpleUserDelegate } from 'sip.js/lib/platform/web/simple-user/simple-user-delegate';
// import { SimpleUserOptions } from 'sip.js/lib/platform/web/simple-user/simple-user-options';
import { SessionDescriptionHandler, SimpleUserOptions } from 'sip.js/lib/platform/web';

import { Globals } from '../globals';
// import { ConsoleReporter } from 'jasmine';


function _window(idElement: any): any {
  // return the global native browser window object
  return window.document.getElementById(idElement);
}

@Injectable({
  providedIn: 'root'
})


export class SipjsService {

  /** Delegate. */
  public delegate: SimpleUserDelegate | undefined;

  globals: Globals;
  private attemptingReconnection = false;
  private userAgent: UserAgent;
  private registerer: Registerer;
  private options: SimpleUserOptions;
  private session: Session | undefined = undefined;
  private mediaElement: any;

  public state = {
    init            : false,
    status          : 'disconnected',
    session         : null,
    ringing         : false,
    incomingSession : null,
    autoanswer      : false
  };

  public screenSharingMedia = {
    sessionDescriptionHandlerOptions : {
      constraints: {
        audio: true,
        video: {mediaSource: 'screen'}
      }
    }
  };
  chatMedia: { sessionDescriptionHandlerOptions: { constraints: { audio: any; video: any; }; }; };


  constructor(
    public toneService: ToneService,
    public router: Router,
    globals: Globals

  ) {
    audioPlayer.initialize();
    this.globals = globals;

  }

  public async setState(newState: any): Promise<void> {
    // console.log(inspect(newState));
    this.state = await Object.assign({}, this.state, newState);
    const vSess = inspect(newState);
    console.log(JSON.stringify(vSess));
    window.localStorage.setItem('vc-Active', JSON.stringify(vSess));
    return;
  }

  async clearSessions(): Promise<void> {
    this.setState({
      session: null,
      incomingSession: null
    });
  }

  async getState(state: any): Promise<void> {
    return this.state[state];
  }

  public async connect(): Promise<any> {

    console.log(this.globals.userCredentials);

    // Setup SIPJs
    try {

        const transportOptions = {
          server: 'wss://' + this.globals.userCredentials.wss + ':7443',
          traceSip: true,
          bundlePolicy: 'max-bundle',
          rtcpMuxPolicy: 'negotiate'
        };

        const uri = UserAgent.makeURI('sip:' + this.globals.userCredentials.ext + '@' + this.globals.userCredentials.dom);

        if (!uri) {
          console.log('SIPJS Error, URI error');
          return;

        } else {

          const userAgentOptions: UserAgentOptions = {
            authorizationPassword: this.globals.userCredentials.pwd,
            authorizationUsername: this.globals.userCredentials.ext,
            uri,
            transportOptions
          };

          this.userAgent = new UserAgent(userAgentOptions);

          this.userAgent.delegate =  {
            onInvite: (invitation: Invitation): void => {
              if (invitation) {
                this.incomingCall(invitation);
              }

            },
            onConnect: (): void => {

            },
            onDisconnect: (error: Error): void => {
              alert('Disconnect   :::  ' + error);
              this.attemptReconnection();

            },
            onRefer: (referral: Referral): void => {
              alert('On Refer');
            },
            onMessage: (message: Message): void => {

            },
            // onReject: (): void => {

            // }
          };




          if (this.userAgent.state !== UserAgentState.Started) {

            await this.userAgent.start()
              .then(() => {
                this.register();
              })
              .catch((error: Error) => {
                console.log('SIPJS Error starting UA....', error);
              });
          }

          if (!this.session) {
            this.router.navigate(['dashboard']);
          }

        }

    } catch (error) {
      console.log('JsSIP config error', error);
      return;
    }
  }

  private async incomingCall(session: Session): Promise<void> {

    console.log(session);
    this.globals.incomingCall = true;

    // Use our configured constraints as options for any Inviter created as result of a REFER
    // const referralInviterOptions: InviterOptions = {
    //   sessionDescriptionHandlerOptions: { constraints: this.setMedia().sessionDescriptionHandlerOptions.constraints }
    // };

    // Initialize our session
    this.initSession(session, await this.setMedia());


  }

  private async register(registererOptions?: RegistererOptions, registererRegisterOptions?: RegistererRegisterOptions): Promise<void> {

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

    return this.registerer.register(registererRegisterOptions).then(() => {
      return;
    });
  }


  public async disconnect(): Promise<void> {
    await this.userAgent.stop()
      .then(() => {
        this.unregister();
      })
      .catch((error: Error) => {
        console.log('SIPJS Error disconnect UA....', error);
      });
  }

  private async unregister(registererUnregisterOptions?: RegistererUnregisterOptions): Promise<void> {

    if (!this.registerer) {
      return Promise.resolve();
    }

    return this.registerer.unregister(registererUnregisterOptions)
    .then(() => {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('userInfo');
      window.localStorage.removeItem('vc-Active');

      return;
    });
  }


  async setMedia(): Promise<any> {

    const chatMedia = {
      sessionDescriptionHandlerOptions : {
        constraints: {
          audio: (window.localStorage.getItem('audioNewMeeting') === 'true' ? true : false),
          video: (window.localStorage.getItem('videoNewMeeting') === 'true' ? true : false)
        }
      }
    };

    console.log(chatMedia);
    return chatMedia;
  }

  public async makeCall(destination: string, inviterOptions?: InviterOptions, inviterInviteOptions?: InviterInviteOptions): Promise<void> {

    if (this.session) {
      return Promise.reject(new Error('Session already exists.'));
    }

    // const vca = window.localStorage.getItem('vc-Active');
    // if (vca) {
    //   // alert('Connect   :::  ' + 'Looks like you have an Active Videoconference');
    //   alert(JSON.parse(vca));
    //   this.session = JSON.parse(vca);
    //   return this.reInvite();
    // }
    const num = 'sip:100@pbx.fokuz.online:5060';
    const target = UserAgent.makeURI(num);
    // const target = UserAgent.makeURI(destination);
    console.log(target);

    if (!target) {
      return Promise.reject(new Error(`Failed to create a valid URI from "${num}"`));
    }

    // Create a new Inviter for the outgoing Session
    const inviter = new Inviter(this.userAgent, target, await this.setMedia());

    // Send INVITE
    return this.sendInvite(inviter, inviterOptions, inviterInviteOptions).then(() => {
      return;
    });
  }

  /** Helper function to init send then send invite. */
  private async sendInvite(inviter: Inviter, inviterOptions?: InviterOptions, inviterInviteOptions?: InviterInviteOptions): Promise<void> {
    // Initialize our session
    this.initSession(inviter, inviterOptions);

    // Send the INVITE
    return inviter.invite(inviterInviteOptions).then(() => {
      console.log('INVITE has been sent');
    });
  }


  private async initSession(session: Session, referralInviterOptions?: InviterOptions): Promise<void> {
    // Set session
    this.session = session;

    this.setState({
        session         : this.session,
        incomingSession : null
    });

    // Setup session state change handler
    this.session.stateChange.addListener((state: SessionState) => {

      if (this.session !== session) {
        return; // if our session has changed, just return
      }

      switch (state) {
        case SessionState.Initial:
          // alert('Initial');
          break;
        case SessionState.Establishing:
          // alert('Establishing');
          // this.changeVideoCodec({channels: 1, clockRate: 8000, mimeType: 'audio/CN', payloadType: 106, sdpFmtpLine: 'ptime=20'});
          break;
        case SessionState.Established:
          // alert('Established');
          // this.setupLocalMedia();
          this.setupRemoteMedia();

          break;
        case SessionState.Terminating:
          // fall through
          // alert('Terminating');
          break;
        case SessionState.Terminated:
          this.globals.incomingCall = false;
          this.session = undefined;
          window.localStorage.removeItem('vc-Active');
          this.cleanupMedia();

          break;
        default:
          throw new Error('Unknown session state.');
      }
    });


    this.session.delegate = {
      onRefer(referral: Referral): void {
        // ...
        alert('onRefer incomingh');
      },

      onInvite(request: any, response: string, statusCode: number): void {
        // ...
        alert('onInvite');
      },

      onInfo(info: Info): void {
        alert('onInfo');
      },

      onNotify(notification: Notification): void {
        alert('onNotify');
      },

      onSessionDescriptionHandler(sessionDescriptionHandler: SessionDescriptionHandler, provisional: boolean): void {
        // alert('onSessionDescriptionHandler');

      }


    };

  }

  public async reInvite(): Promise<void> {

    const target = UserAgent.makeURI('sip:331000000000@pbx.fokuz.online');
    // const inviter = new Inviter(this.userAgent, target, await this.setMedia());


    // Send re-INVITE
    return this.session
      .invite(await this.setMedia())
      .then(() => {
        console.log('RE-INVITE has been sent');
        // this.setupLocalMedia();
        this.setupRemoteMedia();
      })
      .catch((error: Error) => {
        if (error) {
          console.error(`A RE-INVITE request is already in progress.`);
        }
        throw error;
      });
  }

  private changeVideoCodec(mimeType: {}): void {

    const sdh = this.session?.sessionDescriptionHandler;
    if (!sdh) {
      return undefined;
    }
    if (!(sdh instanceof SessionDescriptionHandler)) {
      throw new Error('Session description handler not instance of web SessionDescriptionHandler');
    }


    const peerConnection = sdh.peerConnection;
    if (!peerConnection) {
      throw new Error('Peer connection closed.');
    }

    const transceivers = peerConnection.getTransceivers();



    transceivers.forEach(transceiver => {
      const kind = transceiver.sender.track.kind;
      const sendCodecs = RTCRtpSender.getCapabilities(kind).codecs;
      const recvCodecs = RTCRtpReceiver.getCapabilities(kind).codecs;

      console.log(sendCodecs);
      console.log(recvCodecs);



      if (kind === 'audio') {
      //   // sendCodecs = this.preferCodec(mimeType, 'audio/CN');
      //   // recvCodecs = this.preferCodec(mimeType, 'audio/CN');

      //   transceiver.setCodecPreferences([...sendCodecs, ...recvCodecs]);
      transceiver.setCodecPreferences([{channels: 1, clockRate: 16000, mimeType: 'audio/telephone-event'}]);
      }
    });

    // peerConnection.onnegotiationneeded(event);
  }

  preferCodec(codecs, mimeType): any {
    const otherCodecs = [];
    const sortedCodecs = [];
    const count = codecs.length;

    codecs.forEach(codec => {
      if (codec.mimeType === mimeType) {
        sortedCodecs.push(codec);
      } else {
        otherCodecs.push(codec);
      }
    });

    return sortedCodecs.concat(otherCodecs);
  }


  /** Helper function to attach local media to html elements. */
  private setupLocalMedia(): void {

    this.mediaElement = window.document.getElementById('localVideo');

    if (this.mediaElement) {
      const localStream = this.localMediaStream;
      if (!localStream) {
        throw new Error('Local media stream undefiend.');
      }
      this.mediaElement.autoplay = true; // Safari hack, because you cannot call .play() from a non user action
      this.mediaElement.srcObject = localStream;
      this.mediaElement.play().catch((error: Error) => {
        console.error(`Failed to play local media`);
        console.error(error.message);
      });
      localStream.onaddtrack = (): void => {
        console.log(`Local media onaddtrack`);
        this.mediaElement.load(); // Safari hack, as it doesn't work otheriwse
        this.mediaElement.play().catch((error: Error) => {
          console.error(` Failed to play local media`);
          console.error(error.message);
        });
      };
    }
  }

  /** Helper function to attach remote media to html elements. */
  private setupRemoteMedia(): void {

    this.mediaElement = window.document.getElementById('remoteVideo');

    if (this.mediaElement) {
      const remoteStream = this.remoteMediaStream;
      console.log(remoteStream);

      if (!remoteStream) {
        throw new Error('Remote media stream undefiend.');
      }
      this.mediaElement.autoplay = true; // Safari hack, because you cannot call .play() from a non user action
      this.mediaElement.srcObject = remoteStream;
      this.mediaElement.play().catch((error: Error) => {
        console.error(`Failed to play remote media`);
        console.error(error.message);
      });
      remoteStream.onaddtrack = (): void => {
        console.log(`Remote media onaddtrack`);
        this.mediaElement.load(); // Safari hack, as it doesn't work otheriwse
        this.mediaElement.play().catch((error: Error) => {
          console.error(` Failed to play remote media`);
          console.error(error.message);
        });
      };
    }
  }

  /** Helper function to remove media from html elements. */
  private async cleanupMedia(): Promise<void> {

    if (this.mediaElement) {
      // this.mediaElement.srcObject = null;
      // this.mediaElement.pause();

      this.router.navigate(['dashboard']);


    }
  }


  /** The local media stream. Undefined if call not answered. */
  // get localMediaStream(): MediaStream | undefined {
  //   const sdh = this.session?.sessionDescriptionHandler;
  //   if (!sdh) {
  //     return undefined;
  //   }
  //   if (!(sdh instanceof SessionDescriptionHandler)) {
  //     throw new Error('Session description handler not instance of web SessionDescriptionHandler');
  //   }


  //   const peerConnection = sdh.peerConnection;
  //   if (!peerConnection) {
  //     throw new Error('Peer connection closed.');
  //   }

  //   let codecList = null;

  //   peerConnection.getSenders().forEach((sender) => {
  //     if (sender.track) {
  //       console.log(sender.track);
  //       codecList = sender.getParameters().codecs;
  //       console.log(codecList);
  //       if (sender.track.kind === 'video') {
  //         sdh.localMediaStream.addTrack(sender.track);
  //       }
  //     }
  //   });

  //   console.log(sdh.localMediaStream);
  //   return sdh.localMediaStream;
  // }

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



  /** The remote media stream. Undefined if call not answered. */
  // get remoteMediaStream(): MediaStream | undefined {
  //   const sdh = this.session?.sessionDescriptionHandler;
  //   if (!sdh) {
  //     return undefined;
  //   }
  //   if (!(sdh instanceof SessionDescriptionHandler)) {
  //     throw new Error('Session description handler not instance of web SessionDescriptionHandler');
  //   }


  //   const peerConnection = sdh.peerConnection;
  //   if (!peerConnection) {
  //     throw new Error('Peer connection closed.');
  //   }

  //   let codecList = null;

  //   peerConnection.getReceivers().forEach((receiver) => {
  //     if (receiver.track) {
  //       console.log(receiver.track);
  //       codecList = receiver.getParameters().codecs;
  //       console.log(codecList);
  //       sdh.remoteMediaStream.addTrack(receiver.track);
  //     }
  //   });

  //   console.log(sdh.remoteMediaStream);
  //   return sdh.remoteMediaStream;
  // }

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


  public async hangupCall(): Promise<void> {

    return await this.terminate();
  }


  private async terminate(): Promise<void> {

    console.log(`Terminating...`);

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
        break;
      default:
        throw new Error('Unknown state');
    }

    console.log(`Terminating in state ${this.session.state}, no action taken`);
    this.router.navigate(['dashboard']);
    this.attemptReconnection();
    return Promise.resolve();
  }







  public async answerCall(invitationAcceptOptions?: InvitationAcceptOptions): Promise<void> {

    console.log(`Accepting Invitation...`);

    if (!this.session) {
      return Promise.reject(new Error('Session does not exist.'));
    }

    if (!(this.session instanceof Invitation)) {
      return Promise.reject(new Error('Session not instance of Invitation.'));
    }


    this.router.navigate(['room']);
    this.globals.incomingCall = false;
    return await this.session.accept(this.chatMedia);
  }




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
        // if (!this.connectRequested) {
        //   this.logger.log(
        //     `[${this.id}] Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - aborted`
        //   );
        //   this.attemptingReconnection = false;
        //   return; // If intentionally disconnected, don't reconnect.
        // }
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
            console.error(error.message);
            this.attemptingReconnection = false;
            this.attemptReconnection(++reconnectionAttempt);
          });
      },
      reconnectionAttempt === 1 ? 0 : reconnectionDelay * 1000
    );
  }





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




  public nativeWindow(id: any): any {
    return _window(id);
  }


}
