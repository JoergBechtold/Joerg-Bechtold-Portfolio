import { TestBed } from '@angular/core/testing';

import { SkillsdataService } from './skillsdata.service';

describe('SkillsdataService', () => {
  let service: SkillsdataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SkillsdataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
