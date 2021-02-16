import { TestBed } from '@angular/core/testing';

import { SipjsService } from './sipjs.service.ts.Ver_2';

describe('SipjsService', () => {
  let service: SipjsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SipjsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
