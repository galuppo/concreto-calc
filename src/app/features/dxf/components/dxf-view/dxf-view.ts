import { AfterContentInit, AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { DxfViewer } from 'dxf-viewer';
import { Color } from 'Three';



@Component({
	selector: 'dxf-view',
	standalone: true,
	imports: [],
	templateUrl: './dxf-view.html',
	styleUrl: './dxf-view.scss'
})
export class DxfViewComponent implements AfterViewInit, OnDestroy {
	protected dxfViewer?: DxfViewer;
	@ViewChild('view') viewDiv?: ElementRef
	@Input() set dxfString(dxf: string) {
		this.loadDxfString(dxf);
	}

	constructor() {

	}

	private loadDxfString(dxfString: string) {
		const dxfBlob = new Blob([dxfString], { type: 'plain/text' });
		if (this.dxfViewer) {
			this.dxfViewer.Load({
				url: URL.createObjectURL(dxfBlob),
				fonts: ["fonts/ARIAL.TTF"],
				progressCbk: null,
				workerFactory: null
			});
		}

	}


	ngAfterViewInit(): void {
		if (this.viewDiv ) {
			this.dxfViewer = new DxfViewer(this.viewDiv.nativeElement, {
				canvasWidth: this.viewDiv.nativeElement.clientWidth,
				canvasHeight: this.viewDiv.nativeElement.clientHeight,
				clearColor: new Color(255,255,255)
			});

		}
	}

	ngOnDestroy(): void {
		if (this.dxfViewer)
			this.dxfViewer.Destroy();
	}
}
