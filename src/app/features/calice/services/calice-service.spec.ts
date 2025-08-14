import { TestBed } from '@angular/core/testing';

import { CaliceService } from './calice-service';

describe('CaliceService', () => {
  let service: CaliceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CaliceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
