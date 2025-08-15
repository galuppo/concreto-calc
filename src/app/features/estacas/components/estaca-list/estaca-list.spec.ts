import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstacaList } from './estaca-list';

describe('EstacaList', () => {
  let component: EstacaList;
  let fixture: ComponentFixture<EstacaList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstacaList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstacaList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
