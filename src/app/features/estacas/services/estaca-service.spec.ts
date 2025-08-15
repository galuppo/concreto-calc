import { TestBed } from '@angular/core/testing';

import { EstacaService } from './estaca-service';

describe('EstacaService', () => {
  let service: EstacaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EstacaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
