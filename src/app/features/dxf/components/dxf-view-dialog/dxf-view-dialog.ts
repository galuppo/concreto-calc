import { AfterViewInit, Component, inject, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MAT_DIALOG_DEFAULT_OPTIONS, MatDialogModule } from '@angular/material/dialog';
import { DxfViewComponent } from '../dxf-view/dxf-view';

@Component({
	selector: 'app-dxf-view-dialog',
	standalone: true,
	imports: [
		MatDialogModule,
		MatButtonModule,
		DxfViewComponent
	],
	templateUrl: './dxf-view-dialog.html',
	styleUrl: './dxf-view-dialog.scss'
})
export class DxfViewDialogComponent implements AfterViewInit {

	private dxfString: string = inject(MAT_DIALOG_DATA).dxfString;
	@ViewChild(DxfViewComponent) dxfView?: DxfViewComponent;


	ngAfterViewInit(): void {
		if(this.dxfView){
			this.dxfView.dxfString = this.dxfString;
		}
		
	}

}

