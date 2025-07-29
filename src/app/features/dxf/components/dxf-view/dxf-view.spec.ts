import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DxfView } from './dxf-view';

describe('DxfView', () => {
  let component: DxfView;
  let fixture: ComponentFixture<DxfView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DxfView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DxfView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
