import { Input, Component, OnInit, ChangeDetectorRef, AfterContentChecked  } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { SipjsService } from '../../services/sipjs.service';
import { FormGroup, FormControl, FormBuilder, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Globals } from '../../globals';


/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit, AfterContentChecked {

  globals: Globals;
  userToken = {};
  userInfo = {};

  varToken: any;
  varUserContacts = {};
  invalidLogin = false;
  signinForm: FormGroup;

  varUser: string;
  varKeepSession = false;
  staticAlertClosed = true;

  matcher = new MyErrorStateMatcher();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authUser: AuthService,
    private sipJs: SipjsService,
    private changeDetector: ChangeDetectorRef,
    globals: Globals

  ) {
    this.globals = globals;

  }

  ngOnInit(): void {

    this.varKeepSession = (window.localStorage.getItem('keepSession') === 'true' ? true : false);
    setTimeout(() => this.staticAlertClosed = true, 1000);

    // this.sipJs.disconnect();

    window.localStorage.removeItem('token');
    window.localStorage.removeItem('userInfo');
    window.localStorage.removeItem('userContacts');

    this.signinForm = this.formBuilder.group({
      username: ['', Validators.compose([Validators.required, Validators.email])],
      password: ['', Validators.required]
    });



  }



  ngAfterContentChecked(): void {
    this.changeDetector.detectChanges();
  }



  keepSession(event: any): void {

    console.log(event.checked);
    window.localStorage.setItem('keepSession', event.checked);

  }

  onSubmit(): void {

    if (this.signinForm.invalid) {
      return;
    }
    const loginPayload = {
      username: this.signinForm.controls.username.value,
      password: this.signinForm.controls.password.value
    };

    this.authUser.userSignin(loginPayload).subscribe((data) => {
      if (data) {
        this.userToken = data;
        this.userToken = Array.of(this.userToken);
        window.localStorage.setItem('token', this.userToken[0].data.original.access_token);

        // this.authUser.updateUserStatus(this.userToken[0].data.original.access_token)
        //   .subscribe((data9: any) => {
        //     if (data9) {
        //       console.log(data9);
        //     } else {
        //       console.log('************************************************************************');
        //     }
        //   });

        console.log(this.userToken[0].data.original.access_token);

        this.authUser.getUserInfo(this.userToken[0].data.original.access_token)
          .subscribe((data: any) => {
              this.userInfo = data;
              this.userInfo = Array.of(this.userInfo);
              window.localStorage.setItem('userInfo', JSON.stringify(this.userInfo[0].data));

              const userExtension = this.userInfo[0].data.extension.extension;
              const password = this.userInfo[0].data.extension.password;
              const userFullname = this.userInfo[0].data.contact_name_given + ' ' + this.userInfo[0].data.contact_name_family;
              const domain = this.userInfo[0].data.extension.dial_domain;
              const wssServer = this.userInfo[0].data.extension.dial_domain;

              this.globals.userCredentials = {  ext: userExtension,
                                                pwd: password,
                                                fn: userFullname,
                                                dom: domain,
                                                wss: wssServer };

              this.sipJs.connect();

              if (window.localStorage.getItem('userInfo')) {
                this.router.navigate(['dashboard']);
              }
        });
        // this.getContacts();
      }
    }, err => {

      if (err.status === 401) {
        console.log(err.status);
        this.staticAlertClosed = false;
      }
    });
  }

  getContacts(): any {

    this.varToken = window.localStorage.getItem('token');
    this.authUser.getUserContacts(this.varToken)
      .subscribe((data: any) => {
        if (data.code === '200') {
          this.varUserContacts = data.data;
          this.varUserContacts = Array.of(this.varUserContacts);
          window.localStorage.setItem('userContacts', JSON.stringify(this.varUserContacts));
        }
      }, err => {

        if (err.status === 401) {
          console.log('*************** E R R O R  **************');
          console.log(err.status);
        }
    });

  }



}
