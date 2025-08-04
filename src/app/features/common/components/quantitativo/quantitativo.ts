import { Component, Input } from '@angular/core';
import { ArmaduraQuantitativo, BarraDeAcoQuantitativo, ResumoAco } from '../../../armaduras/armadura-quantitativo';
import { MatCardModule } from '@angular/material/card';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatInputModule } from "@angular/material/input";
import { round } from '../../../../utils/number-utils';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

@Component({
	selector: 'quantitativo',
	standalone: true,
	imports: [
		MatCardModule,
		CommonModule,
		MatInputModule,
		MatTableModule,
		DecimalPipe
	],
	templateUrl: './quantitativo.html',
	styleUrl: './quantitativo.scss'
})
export class QuantitativoComponent {
	@Input() volConcreto: number | undefined = undefined;
	@Input() areaForma: number | undefined = undefined;
	private _armaduras: ArmaduraQuantitativo | undefined = undefined;
	protected dsResumo: MatTableDataSource<ResumoAco> = new MatTableDataSource<ResumoAco>();
	private tabelaAco: Map<string, BarraDeAcoQuantitativo[]> | undefined;
	protected totalAco: number = 0;
	protected elementos: string[] = [];

	constructor() {

	}

	get armaduras(): ArmaduraQuantitativo | undefined {
		return this._armaduras;
	} 

	@Input() set armaduras(arm: ArmaduraQuantitativo | undefined) {
		this._armaduras = arm;
		this.loadArmaduras();
		this.loadResumo();

	}


	protected round(n: number): number {
		return round(n, 2);
	}

	protected ferros(elemento: string): BarraDeAcoQuantitativo[] {
		if(!this.tabelaAco)
			return [];
		const ferros = this.tabelaAco.get(elemento);
		if(!ferros)
			return [];

		ferros.sort((a, b) => a.numero - b.numero);

		return ferros;
	}

	private loadArmaduras() {
		this.elementos = [];
		if(!this._armaduras)
			return;
		this.tabelaAco = this._armaduras.getTabelaAco();
		for(let el of this.tabelaAco.keys())
			this.elementos.push(el);

	}

	private loadResumo() {
		this.dsResumo.data = [];
		if(!this._armaduras)
			return;

		this.dsResumo.data = this._armaduras.getResumoAco();
		this.totalAco = 0;
		for(let res of this.dsResumo.data)
			this.totalAco += res.pesoTotal;

	}
}
