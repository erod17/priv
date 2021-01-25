import { TestBed } from '@angular/core/testing';

import { SoundsService } from './sounds.service';

// describe('SoundsService', () => {
//   beforeEach(() => TestBed.configureTestingModule({}));

//   it('should be created', () => {
//     const service: SoundsService = TestBed.get(SoundsService);
//     expect(service).toBeTruthy();
//   });
// });

describe('Sound service', () => {
  it('should get a sound service', () => {
      const a = SoundsService.initialize();
      expect(a).toBeTruthy();
      const b = SoundsService.initialize();
      expect(b).toBeFalsy();
  });

  it('should play a sound', () => {
      const a = SoundsService.play('answered', false);
      expect(typeof a).toBe('object');
  });

  it('should stop playing a sound', () => {
      const a = SoundsService.stop('answered');
      expect(a).toBeUndefined();
  });

  it('should stop all sound', () => {
      const a = SoundsService.stopAll();
      expect(a).toBeUndefined();
  });
});


