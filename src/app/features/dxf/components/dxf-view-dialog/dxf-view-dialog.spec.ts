import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DxfViewDialog } from './dxf-view-dialog';

describe('DxfViewDialog', () => {
  let component: DxfViewDialog;
  let fixture: ComponentFixture<DxfViewDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DxfViewDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DxfViewDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
