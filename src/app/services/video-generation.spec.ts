import { TestBed } from '@angular/core/testing';

import { VideoGenerationService } from './video-generation';

describe('VideoGenerationService', () => {
  let service: VideoGenerationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VideoGenerationService]
    });
    service = TestBed.inject(VideoGenerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
