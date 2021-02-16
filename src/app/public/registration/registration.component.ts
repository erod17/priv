import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { SipjsService } from '../../services/sipjs.service';
import { Globals } from '../../globals';


@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent implements OnInit {

  globals: Globals;
  signupMsg: any;
  showError = false;
  showSuccess = false;
  urlClient = '/account-activate';

  registForm = new FormGroup({
    domain: new FormControl(''),
    username: new FormControl(''),
    paswword: new FormControl('')
  });


  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private sipJs: SipjsService,
    globals: Globals

  ) {
    this.globals = globals;
  }

  signupAlertClosed = true;

  ngOnInit(): void {

    setTimeout(() => this.signupAlertClosed = true, 1000);

    this.registForm = this.formBuilder.group({
      domain: ['', Validators.compose([Validators.required])],
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

  }

  async onSubmit(): Promise<void> {
    if (this.registForm.invalid) {
      return;
    }

    const userCred = {  ext: this.registForm.controls.username.value,
                        pwd: this.registForm.controls.password.value,
                        fn:  this.registForm.controls.username.value,
                        dom: this.registForm.controls.domain.value,
                        wss: 7443 };

    const conn = await this.sipJs.connect(userCred);

    console.log(conn);

    if (conn) {
      // Some times the SIP Servers have a little delay returning the SDP response
      // 1.5 seconds could be enough to wait for it and get the othe step.
      setTimeout(() => {
        console.log(conn._state);
        if (conn._state === 'Unregistered') {
          alert('Error connecting to the Domain');
          this.sipJs.disconnect();
        } else {
          window.localStorage.setItem('userCredentials', JSON.stringify(userCred));
          this.router.navigate(['dashboard']);
        }
      }, 1500);
    } else {
      const connState = this.sipJs.getConnState();
      console.log(connState.transport);
      if (connState.transport.state === 'Disconnected') {
        // tslint:disable-next-line:no-string-literal
        alert('Error in connection establishment: net::ERR_INTERNET_DISCONNECTED :::  ' + connState.transport['logger'].category);
        this.unregister();
      }
    }

  }

  private async unregister(): Promise<void> {
    await this.sipJs.disconnect();
    this.router.navigate(['welcome']);
  }



}
