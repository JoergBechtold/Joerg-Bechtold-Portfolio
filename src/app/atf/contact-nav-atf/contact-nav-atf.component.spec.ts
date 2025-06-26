import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactNavAtfComponent } from './contact-nav-atf.component';

describe('ContactNavAtfComponent', () => {
  let component: ContactNavAtfComponent;
  let fixture: ComponentFixture<ContactNavAtfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactNavAtfComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContactNavAtfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
