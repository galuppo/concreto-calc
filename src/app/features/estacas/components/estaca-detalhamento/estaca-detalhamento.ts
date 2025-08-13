import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { QuantitativoComponent } from "../../../common/components/quantitativo/quantitativo";
import { MatButtonModule } from '@angular/material/button';
import { BarraDeAco, BarrasDeAco } from '../../../armaduras/models/barra-aco.model';
import { Concreto, ClassesConcreto } from '../../../concreto/models/concreto.model';
import { CommonModule } from '@angular/common';
import { round } from '../../../../utils/number-utils';
import { Armadura } from '../../../armaduras/models/armadura.model';
import { Estaca } from '../../models/estaca.model';
import { FormaArmaduraFactory } from '../../../armaduras/forma-factory';
import { FormsModule } from '@angular/forms';
import { point, Writer } from '../../../../../../../dxf-writer/lib';
import { DxfWriterFactory } from '../../../dxf/dxf-writer-factory';
import { DetalhamentoEstaca } from '../../models/detalhamento-estaca';
import { MatDialog } from '@angular/material/dialog';
import { DxfViewDialogComponent } from '../../../dxf/components/dxf-view-dialog/dxf-view-dialog';
import { BoundingBoxPoint, BoundingBoxUtils } from '../../../../utils/bounding-box-utils';
import { FormaArmaduraReta } from '../../../armaduras/models/forma-armadura.model';
import { ArmaduraQuantitativo } from '../../../armaduras/armadura-quantitativo';
import { TabelaAcoDetalhamento } from '../../../armaduras/tabela-aco-detalhamento';
import { EntityUtils } from '../../../../utils/entity-utils';

@Component({
	selector: 'estaca-detalhamento',
	imports: [
		MatCardModule,
		QuantitativoComponent,
		MatButtonModule,
		CommonModule,
		FormsModule
	],
	templateUrl: './estaca-detalhamento.html',
	styleUrl: './estaca-detalhamento.scss'
})
export class EstacaDetalhamentoComponent {

	protected model: Estaca;
	protected quantidade: number = 1;
	private dxfWriter?: Writer;
	protected escala: number = 25;
	protected quantitativoArmadura: ArmaduraQuantitativo | undefined = undefined;
	protected volConcreto: number = 0;
	@ViewChild('downloadLink') downloadLinkAnchor!: ElementRef;

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


	constructor(private matDialog: MatDialog) {
		this.model = {
			nome: 'E01',
			diametro: 30,
			comprimento: 500,
			cobrimento: 5,
			concreto: ClassesConcreto.C30,
			armLong: new Armadura({
				barra: BarrasDeAco.Ø10,
				numero: 1,
				quantidade: 6,
				forma: FormaArmaduraFactory.retaVertical(300)
			}),
			armEstribo: new Armadura({
				barra: BarrasDeAco.Ø5,
				numero: 2,
				quantidade: 1,
				espacamento: 15
			})
		}
	}

	protected get compArmLong(): number {
		return (this.model.armLong.forma! as FormaArmaduraReta).segmentos[0];
	}

	protected set compArmLong(c: number) {
		(this.model.armLong.forma! as FormaArmaduraReta).segmentos[0] = c;
	}

	protected calculaAsEfetivo(as: Armadura): number {
		return round(as.barra.asCm2 * as.quantidade, 3);
	}

	private criaDetalhamento(comTabAco: Boolean) {
		this.dxfWriter = DxfWriterFactory.getNewDefaultWriter();
		const detEstaca = new DetalhamentoEstaca(this.dxfWriter.document.modelSpace.seeder);
		detEstaca.escala = this.escala;

		//Cria detalhamento da estaca
		const dEstaca = detEstaca.criaDetalhamento(this.model, this.quantidade);
		dEstaca.forEach((e) => this.dxfWriter!.document.modelSpace.push(e));

		if (comTabAco) {
			//Quantifica o aço
			const qArmadura = new ArmaduraQuantitativo();
			detEstaca.quantificaFerros(this.model).forEach((f) => {
				qArmadura.addBarra(this.model.nome, f, this.quantidade);
			});

			//Cria detalhamento da tabela de aço
			const tabAcoDet = new TabelaAcoDetalhamento({
				seeder: this.dxfWriter.document.seeder,
				cellsTextHeight: 2.5 * this.escala / 10,
				headerTextHeight: 3 * this.escala / 10,
			});
			tabAcoDet.escala = this.escala;

			const tabResumo = tabAcoDet.criaTabelaResumoAco("resumo", qArmadura.getResumoAco());

			EntityUtils.alignEntities([tabResumo], BoundingBoxPoint.TopRight, dEstaca, BoundingBoxPoint.BottomRight, point(0, -10 * this.escala / 10));

			const tabAco = tabAcoDet.criaTabelaDeAco("tab_aco", qArmadura.getTabelaAco());

			EntityUtils.alignEntities(tabAco, BoundingBoxPoint.TopRight, [tabResumo], BoundingBoxPoint.BottomRight, point(0, -10 * this.escala / 10));

			this.dxfWriter.document.modelSpace.push(tabResumo);
			tabAco.forEach((t) => this.dxfWriter!.document.modelSpace.push(t));
		}

	}

	private getDxfFileUrl(): string {
		this.criaDetalhamento(true);
		const dxfBlob = new Blob([this.dxfWriter!.stringify()], { type: 'plain/text' });
		return URL.createObjectURL(dxfBlob);
	}

	protected previsualizar() {
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
	protected download() {
		if (this.downloadLinkAnchor) {
			(this.downloadLinkAnchor.nativeElement as HTMLAnchorElement).href = this.getDxfFileUrl();
			(this.downloadLinkAnchor.nativeElement as HTMLAnchorElement).download = this.model.nome + ".dxf";
			this.downloadLinkAnchor.nativeElement.click();
		}
	}
	protected quantitativo() {
		const dxfWriter = DxfWriterFactory.getNewDefaultWriter();
		const detEstaca = new DetalhamentoEstaca(dxfWriter.document.modelSpace.seeder);
		const qArmadura = new ArmaduraQuantitativo();
		detEstaca.quantificaFerros(this.model).forEach((f) => {
			qArmadura.addBarra(this.model.nome, f, this.quantidade);
		});

		this.volConcreto = detEstaca.quantificaConcreto(this.model)*this.quantidade;
		this.quantitativoArmadura = qArmadura;

	}

}
