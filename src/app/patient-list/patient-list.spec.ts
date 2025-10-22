import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientList } from './patient-list.component';

describe('PatientList', () => {
  let component: PatientList;
  let fixture: ComponentFixture<PatientList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PatientList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
