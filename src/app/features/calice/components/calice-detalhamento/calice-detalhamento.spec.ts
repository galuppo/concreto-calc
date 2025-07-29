import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaliceDetalhamento } from './calice-detalhamento';

describe('CaliceDetalhamento', () => {
  let component: CaliceDetalhamento;
  let fixture: ComponentFixture<CaliceDetalhamento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaliceDetalhamento]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaliceDetalhamento);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
