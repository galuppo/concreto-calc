import { Component } from '@angular/core';
import { Writer } from '../../../../../../../dxf-writer/lib';
import { DxfWriterFactory } from '../../../dxf/dxf-writer-factory';
import { DxfView } from "../../../dxf/components/dxf-view/dxf-view";

@Component({
	selector: 'app-calice-detalhamento',
	standalone: true,
	imports: [
		DxfView
	],
	templateUrl: './calice-detalhamento.html',
	styleUrl: './calice-detalhamento.scss'
})
export class CaliceDetalhamentoComponent {

	private dxfWriter: Writer = DxfWriterFactory.getNewDefaultWriter();

	constructor() {
		
	}

}
