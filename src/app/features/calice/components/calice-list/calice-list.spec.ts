import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaliceList } from './calice-list';

describe('CaliceList', () => {
  let component: CaliceList;
  let fixture: ComponentFixture<CaliceList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaliceList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaliceList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
