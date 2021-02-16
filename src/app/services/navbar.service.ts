import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NavbarService {

  visible: boolean;

  constructor() { this.visible = false; }

  // tslint:disable-next-line:typedef
  hide() { this.visible = false; }

  // tslint:disable-next-line:typedef
  show() { this.visible = true; }

  // tslint:disable-next-line:typedef
  toggle() { this.visible = !this.visible; }

}
