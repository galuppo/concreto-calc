import { Component, ElementRef, ViewChild } from '@angular/core';
import { DxfWriterFactory } from '../../../dxf/dxf-writer-factory';
import { Calice } from '../../models/calice.model';
import { ClassesConcreto, Concreto } from '../../../concreto/models/concreto.model';
import { BarraDeAco, BarrasDeAco } from '../../../armaduras/models/barra-aco.model';
import { Armadura } from '../../../armaduras/models/armadura.model';
import { CaliceDetalhamento } from '../../models/calice-detalhamento.model';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { round } from '../../../../utils/number-utils';
import { MatDialog } from '@angular/material/dialog';
import { DxfViewDialogComponent } from '../../../dxf/components/dxf-view-dialog/dxf-view-dialog';
import { ArmaduraQuantitativo, ResumoAco } from '../../../armaduras/armadura-quantitativo';
import { MatTableModule } from '@angular/material/table';
import { MatGridListModule } from '@angular/material/grid-list';
import { QuantitativoComponent } from "../../../common/components/quantitativo/quantitativo";

@Component({
	selector: 'calice-detalhamento',
	standalone: true,
	imports: [
		MatCardModule,
		MatButtonModule,
		MatIconModule,
		FormsModule,
		ReactiveFormsModule,
		MatInputModule,
		MatSelectModule,
		MatTableModule,
		MatGridListModule,
		QuantitativoComponent
	],
	templateUrl: './calice-detalhamento.html',
	styleUrl: './calice-detalhamento.scss'
})
export class CaliceDetalhamentoComponent {

	protected model: Calice;
	protected classesConcreto: Concreto[] = [
		ClassesConcreto.C20,
		ClassesConcreto.C25,
		ClassesConcreto.C30,
		ClassesConcreto.C35,
		ClassesConcreto.C40];
	protected barrasAco: BarraDeAco[] = [
		BarrasDeAco.Ø5,
		BarrasDeAco.Ø6_3,
		BarrasDeAco.Ø8,
		BarrasDeAco.Ø10,
		BarrasDeAco.Ø12_5,
		BarrasDeAco.Ø16,
		BarrasDeAco.Ø20,
		BarrasDeAco.Ø25
	];
	protected volConcreto: number = 0;
	protected areaForma: number = 0;
	protected quantitativoArmadura: ArmaduraQuantitativo | undefined = undefined;
	protected resumoAco: ResumoAco[] = [];

	@ViewChild('downloadLink') downloadLinkAnchor!: ElementRef;
	@ViewChild(QuantitativoComponent) quantitativoComponent!: QuantitativoComponent;

	constructor(private matDialog: MatDialog) {
		this.model = {
			nome: 'Cal01',
			pilarX: 30,
			pilarY: 60,
			espessuraColarinho: 15,
			espessuraJunta: 7.5,
			embutimento: 120,
			cobExterno: 5,
			cobInterno: 1.5,
			concreto: ClassesConcreto.C30,
			armHorzPrincipal: new Armadura({
				barra: BarrasDeAco.Ø8,
				numero: 0,
				quantidade: 4
			}),
			armHorzSecundaria: new Armadura({
				barra: BarrasDeAco.Ø6_3,
				numero: 0,
				quantidade: 5
			}),
			armVertPrincipal: new Armadura({
				barra: BarrasDeAco.Ø12_5,
				numero: 0,
				quantidade: 2
			}),
			armVertSecundaria: new Armadura({
				barra: BarrasDeAco.Ø8,
				numero: 0,
				quantidade: 5
			})
		}
	}

	protected calculaAsEfetivo(as: Armadura): number {
		return round(as.barra.asCm2 * as.quantidade, 3);
	}

	previsualizar() {

		const dxfWriter = DxfWriterFactory.getNewDefaultWriter();
		const calDet = new CaliceDetalhamento(dxfWriter.document.seeder);
		calDet.criaDetalhamento(this.model).forEach((e) => dxfWriter.document.modelSpace.push(e));

		this.matDialog.open(DxfViewDialogComponent, {
			minHeight: 0,
			maxHeight: "100%",
			height: "65vh",
			minWidth: 0,
			maxWidth: "100%",
			width: "100%",
			data: { dxfString: dxfWriter.stringify() }
		});

	}

	getDxfFileUrl(): string {
		const dxfWriter = DxfWriterFactory.getNewDefaultWriter();
		const calDet = new CaliceDetalhamento(dxfWriter.document.seeder);
		calDet.criaDetalhamento(this.model).forEach((e) => dxfWriter.document.modelSpace.push(e));
		const dxfBlob = new Blob([dxfWriter.stringify()], { type: 'plain/text' });

		return URL.createObjectURL(dxfBlob);
	}

	download() {
		if (this.downloadLinkAnchor) {
			(this.downloadLinkAnchor.nativeElement as HTMLAnchorElement).href = this.getDxfFileUrl();
			(this.downloadLinkAnchor.nativeElement as HTMLAnchorElement).download = this.model.nome + ".dxf";
			this.downloadLinkAnchor.nativeElement.click();
		}
	}

	quantitativo() {
		const dxfWriter = DxfWriterFactory.getNewDefaultWriter();
		const calDet = new CaliceDetalhamento(dxfWriter.document.seeder);
		const qArmadura = new ArmaduraQuantitativo();

		calDet.quantificaFerros(this.model).forEach((f) => {
			qArmadura.addBarra(this.model.nome, f);
		});

		const resumo = qArmadura.getResumoAco();

		this.volConcreto = calDet.quantificaConcreto(this.model);
		this.areaForma = calDet.quantificaForma(this.model);
		this.quantitativoArmadura = qArmadura;
	}

}
