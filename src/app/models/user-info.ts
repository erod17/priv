import { Token } from '@angular/compiler';

export interface UserInfo {

  username: string;
  password: string;
  access_token: string;
  user_uuid: string;
  domain_uuid: string;
  name: string;
  email: string;
  body: string;

}

export interface NewToken {
  access_token: Token;
}
