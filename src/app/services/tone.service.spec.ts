import { TestBed } from '@angular/core/testing';

import { ToneService } from './tone.service';

describe('ToneService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ToneService = TestBed.get(ToneService);
    expect(service).toBeTruthy();
  });
});
