import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApointmentCreate } from './apointment-create';

describe('ApointmentCreate', () => {
  let component: ApointmentCreate;
  let fixture: ComponentFixture<ApointmentCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ApointmentCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApointmentCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
