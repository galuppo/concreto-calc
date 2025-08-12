import { Component, ElementRef, ViewChild } from '@angular/core';
import { DxfWriterFactory } from '../../../dxf/dxf-writer-factory';
import { Calice } from '../../models/calice.model';
import { ClassesConcreto, Concreto } from '../../../concreto/models/concreto.model';
import { BarraDeAco, BarrasDeAco } from '../../../armaduras/models/barra-aco.model';
import { Armadura } from '../../../armaduras/models/armadura.model';
import { CaliceDetalhamento } from '../../models/calice-detalhamento.model';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { round } from '../../../../utils/number-utils';
import { MatDialog } from '@angular/material/dialog';
import { DxfViewDialogComponent } from '../../../dxf/components/dxf-view-dialog/dxf-view-dialog';
import { ArmaduraQuantitativo, ResumoAco } from '../../../armaduras/armadura-quantitativo';
import { QuantitativoComponent } from "../../../common/components/quantitativo/quantitativo";
import { DecimalPipe } from '@angular/common';
import { TabelaAcoDetalhamento } from '../../../armaduras/tabela-aco-detalhamento';
import { point, Writer } from '../../../../../../../dxf-writer/lib';
import { EntityUtils } from '../../../../utils/entity-utils';
import { BoundingBoxPoint } from '../../../../utils/bounding-box-utils';

@Component({
	selector: 'calice-detalhamento',
	standalone: true,
	imports: [
		MatCardModule,
		MatButtonModule,
		FormsModule,
		ReactiveFormsModule,
		QuantitativoComponent,
		DecimalPipe
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
	protected escala: number = 25;
	protected multiplo: number = 1;
	private dxfWriter: Writer | undefined;

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

	private criaDetalhamento(comTabAco: Boolean) {
		this.dxfWriter = DxfWriterFactory.getNewDefaultWriter();
		const calDet = new CaliceDetalhamento(this.dxfWriter!.document.seeder);
		calDet.scale = this.escala;

		//Cria detalhamento do cálice
		const detCalice = calDet.criaDetalhamento(this.model, this.multiplo);
		detCalice.forEach((e) => this.dxfWriter!.document.modelSpace.push(e))

		if (comTabAco) {

			//Quantifica o aço
			const qArmadura = new ArmaduraQuantitativo();
			calDet.quantificaFerros(this.model).forEach((f) => {
				qArmadura.addBarra(this.model.nome, f, this.multiplo);
			});

			//Cria detalhamento da tabela de aço
			const tabAcoDet = new TabelaAcoDetalhamento({
				seeder: this.dxfWriter.document.seeder,
				cellsTextHeight: 2.5 * this.escala / 10,
				headerTextHeight: 3 * this.escala / 10,
			});
			tabAcoDet.escala = this.escala;

			const tabResumo = tabAcoDet.criaTabelaResumoAco("resumo", qArmadura.getResumoAco());

			EntityUtils.alignEntities([tabResumo], BoundingBoxPoint.TopRight, detCalice, BoundingBoxPoint.BottomRight, point(0, -10*this.escala/10));

			const tabAco = tabAcoDet.criaTabelaDeAco("tab_aco", qArmadura.getTabelaAco());

			EntityUtils.alignEntities(tabAco, BoundingBoxPoint.TopRight, [tabResumo], BoundingBoxPoint.BottomRight, point(0, -10*this.escala/10));


			this.dxfWriter.document.modelSpace.push(tabResumo);
			tabAco.forEach((t) => this.dxfWriter!.document.modelSpace.push(t));
		}

	}

	previsualizar() {
		this.criaDetalhamento(false);

		this.matDialog.open(DxfViewDialogComponent, {
			minHeight: 0,
			maxHeight: "100%",
			height: "65vh",
			minWidth: 0,
			maxWidth: "100%",
			width: "100%",
			data: { dxfString: this.dxfWriter!.stringify() }
		});

	}

	getDxfFileUrl(): string {
		this.criaDetalhamento(true);
		const dxfBlob = new Blob([this.dxfWriter!.stringify()], { type: 'plain/text' });
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
			qArmadura.addBarra(this.model.nome, f, this.multiplo);
		});

		const resumo = qArmadura.getResumoAco();

		this.volConcreto = calDet.quantificaConcreto(this.model)*this.multiplo;
		this.areaForma = calDet.quantificaForma(this.model)*this.multiplo;
		this.quantitativoArmadura = qArmadura;
	}

}
