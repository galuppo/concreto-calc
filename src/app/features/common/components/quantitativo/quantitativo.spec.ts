import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Quantitativo } from './quantitativo';

describe('Quantitativo', () => {
  let component: Quantitativo;
  let fixture: ComponentFixture<Quantitativo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Quantitativo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Quantitativo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
