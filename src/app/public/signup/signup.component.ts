import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

import { AuthService } from '../../auth/auth.service';


@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {


  signupMsg: any;
  showError = false;
  showSuccess = false;
  urlClient = '/account-activate';

  signupForm = new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    email: new FormControl(''),
    password: new FormControl(''),
    confirmPassword: new FormControl(''),

  });


  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authUser: AuthService,
  ) { }

  signupAlertClosed = true;

  ngOnInit(): void {

    setTimeout(() => this.signupAlertClosed = true, 1000);

    this.signupForm = this.formBuilder.group({
      firstName: ['', Validators.compose([Validators.required])],
      lastName: ['', Validators.required],
      email: ['', Validators.required],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],

    });

  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      return;
    }
    const signupPayload = {
      firstName: this.signupForm.controls.firstName.value,
      lastName: this.signupForm.controls.lastName.value,
      username: this.signupForm.controls.email.value,
      password: this.signupForm.controls.password.value,

    };

    this.authUser.userSignup(signupPayload).subscribe((data: any) => {
      console.log(data);

      if (data.code === '200') {
        this.showError = false;
        this.showSuccess = true;
        this.signupMsg = data.message;

      } else {
        this.showError = true;
        this.showSuccess = false;
        this.signupMsg = data.message;    // 'Please check all values required for this request'
        this.signupAlertClosed = false;
      }
    },  err => {

      if (err.status === 401 || err.status === 400) {
        console.log(err.status);
        this.signupAlertClosed = false;
      }
    });
  }


  gotoSignin(): void {
    this.router.navigate(['signin']);
  }

}
