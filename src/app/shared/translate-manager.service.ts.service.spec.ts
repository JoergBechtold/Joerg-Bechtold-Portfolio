import { TestBed } from '@angular/core/testing';

import { TranslateManagerServiceTsService } from './translate-manager.service.ts.service';

describe('TranslateManagerServiceTsService', () => {
  let service: TranslateManagerServiceTsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TranslateManagerServiceTsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
