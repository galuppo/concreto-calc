import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaliceDimensionamento } from './calice-dimensionamento';

describe('CaliceDimensionamento', () => {
  let component: CaliceDimensionamento;
  let fixture: ComponentFixture<CaliceDimensionamento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaliceDimensionamento]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaliceDimensionamento);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
