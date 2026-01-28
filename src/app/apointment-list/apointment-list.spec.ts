import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApointmentList } from './apointment-list';

describe('ApointmentList', () => {
  let component: ApointmentList;
  let fixture: ComponentFixture<ApointmentList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ApointmentList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApointmentList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
