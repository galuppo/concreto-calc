import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstacaDetalhamento } from './estaca-detalhamento';

describe('EstacaDetalhamento', () => {
  let component: EstacaDetalhamento;
  let fixture: ComponentFixture<EstacaDetalhamento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstacaDetalhamento]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstacaDetalhamento);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
