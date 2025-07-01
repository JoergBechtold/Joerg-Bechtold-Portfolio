import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LINKComponent } from './footer.component';

describe('LINKComponent', () => {
  let component: LINKComponent;
  let fixture: ComponentFixture<LINKComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LINKComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(LINKComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
