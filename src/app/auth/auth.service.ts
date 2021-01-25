import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { retry, catchError } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { UserCredentials } from '../models/user-credentials';
import { UserInfo, NewToken } from '../models/user-info';
import { UserContactsInfo } from '../models/user-contacts-info';
import { SignupInfo } from '../models/signup-info';
import { Messages } from '../models/messages';

import { Token } from '@angular/compiler';
import { EmailValidator } from '@angular/forms';
import { API_URL } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  isLoggedIn = false;
  redirectUrl: string;
  varToken: any;

  constructor(
    private http: HttpClient,
    public jwtHelper: JwtHelperService,
    private router: Router,
  ) { }


  userSignup(data: SignupInfo): Observable<SignupInfo[]> {
    const options = {
      headers: new HttpHeaders({ body: 'form-data ' + data })
    };
    const urlComplete = API_URL + '/api/user/signup';
    return this.http.post<SignupInfo[]>(urlComplete, data);
  }

  userSignin(credentials: UserCredentials): Observable<UserCredentials[]> {
    const urlComplete = API_URL + '/api/user/signin';
    this.isLoggedIn = true;
    return this.http.post<UserCredentials[]>(urlComplete, credentials);
  }

  updateAccessToken(token: Token): Observable<Token[]> {
    const options = {
      headers: new HttpHeaders({
        Authorization: 'Bearer ' + token
      })
    };

    const urlComplete = API_URL + '/api/user/token/refresh';
    return this.http.get<Token[]>(urlComplete, options);
  }

  updateUserStatus(token: any): Observable<[]> {
    const options = {
      headers: new HttpHeaders({ Authorization: 'Bearer ' + token })
    };
    const urlComplete = API_URL + '/user/updatestatus';
    return this.http.post<[]>(urlComplete, options);
  }

  getUserInfo(token: Token): Observable<UserInfo[]> {
    const options = {
      headers: new HttpHeaders({ Authorization: 'Bearer ' + token })
    };
    const urlComplete = API_URL + '/user/get/info';
    return this.http.get<UserInfo[]>(urlComplete, options);
  }

  getUserContacts(token: Token): Observable<UserContactsInfo[]> {
    const options = {
      headers: new HttpHeaders({ Authorization: 'Bearer ' + token })
    };
    const urlComplete = API_URL + '/user/get/contacts';
    return this.http.get<UserContactsInfo[]>(urlComplete, options);
  }

  public get loggedIn(): boolean {
    console.log('Check wheter or not is logged....');
    return window.localStorage.getItem('token') !==  null;
  }

  public isAuthenticated(): boolean {
    console.log('Check wheter or not is logged....');
    this.varToken = window.localStorage.getItem('token');

    if (this.varToken) {
      const keepSession = (window.localStorage.getItem('keepSession') === 'true' ? true : false);
      const tokenExp = this.jwtHelper.isTokenExpired(this.varToken);

      if (!tokenExp) { return true; }
      if (!keepSession) { return false; }
      if (tokenExp && keepSession) {
        this.updateAccessToken(this.varToken)
          .subscribe((data: any) => {
            if (data) {
              let newToken: {} = data;
              newToken = Array.of(newToken);
              window.localStorage.setItem('token', newToken[0].access_token);
              this.router.navigate(['dashboard']);
            }
        });
        // alert('Your session expired, you will be reconnected!');
        return true;
      }
    }
    return false;
  }

  logout(): void {
    // this.glob.userIn = false;
    this.router.navigate(['login']);
  }

  passwordResetSendEmail(email: Messages): Observable<Messages[]> {
    const options = {
      headers: new HttpHeaders({ body: 'form-data ' + email })
    };
    const urlComplete = API_URL + '/api/password/reset/send-email';
    return this.http.post<Messages[]>(urlComplete, email);
  }



  accountActivate(data: UserCredentials): Observable<UserCredentials[]> {
    const urlComplete = API_URL + '/api/account/activate';
    return this.http.post<UserCredentials[]>(urlComplete, data);
  }






}
