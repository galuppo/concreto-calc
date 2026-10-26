import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReacaoEstacas } from './reacao-estacas';

describe('ReacaoEstacas', () => {
  let component: ReacaoEstacas;
  let fixture: ComponentFixture<ReacaoEstacas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReacaoEstacas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReacaoEstacas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
