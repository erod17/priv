import { Component, OnInit } from '@angular/core';
import { SipjsService } from '../../services/sipjs.service';
import { Globals } from '../../globals';

@Component({
  selector: 'app-dialpad',
  templateUrl: './dialpad.component.html',
  styleUrls: ['./dialpad.component.css']
})
export class DialpadComponent implements OnInit {

  glob: Globals;
  calling: string;

  constructor(
    private sipJs: SipjsService,
    glob: Globals
  ) {
    this.glob = glob;
  }

  ngOnInit(): void { }

  getTone(val: any): void {

    if (this.glob.onCall) {
      this.sipJs.sendDTMF(val);
      return;
    }

    this.glob.outgoingNumber = this.glob.outgoingNumber + val;

    this.sipJs.toneService.start(val);
  }

}
