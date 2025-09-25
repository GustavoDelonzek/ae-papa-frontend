import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientRegister } from './patient-register';

describe('PatientRegister', () => {
  let component: PatientRegister;
  let fixture: ComponentFixture<PatientRegister>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PatientRegister]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientRegister);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
