import { CellOptions, CellType, Entity, point, Seeder, Table, TableOptions } from "../../../../../dxf-writer/lib";
import { AppLayerNames } from "../dxf/elements/layers/app-layers";
import { BarraDeAcoQuantitativo, ResumoAco } from "./armadura-quantitativo";

export interface TabelaAcoDetalhamentoOptions {
	seeder: Seeder;
	layerName?: string;
	headerTextHeight: number;
	cellsTextHeight: number;
}

export class TabelaAcoDetalhamento {

	private options: TabelaAcoDetalhamentoOptions;
	private _escala: number = 25;

	constructor(op: TabelaAcoDetalhamentoOptions) {
		this.options = {
			seeder: op.seeder,
			layerName: op.layerName ?? AppLayerNames.TEXTOS,
			headerTextHeight: op.headerTextHeight,
			cellsTextHeight: op.cellsTextHeight
		}
	}

	private get coefEscala(): number {
		return this._escala / 10;
	}

	public set escala(s: number) {
		this._escala = s;
	}

	private getDefaultTableOptions(): TableOptions {
		return {
			blockName: "",
			insertionPoint: point(),
			rowsCount: 0,
			columnsCount: 0,
			rowsHeight: [this.options.headerTextHeight * 2],
			columnsHeight: [25 * this.coefEscala],
			cells: [],
			seeder: this.options.seeder
		}
	}

	public criaTabelaResumoAco(name: string, resumo: ResumoAco[]): Table {
		const op = this.getDefaultTableOptions();
		op.rowsCount = 3 + resumo.length;
		op.columnsCount = 3;
		op.columnsHeight[0] = 35*this.coefEscala;
		const table = new Table(op);

		//Cria cabecalho
		table.add({ text: "Resumo de Aço (sem perdas)", textHeight: this.options.headerTextHeight });
		table.add({ merged: true });
		table.add({ merged: true });
		table.add({ text: "Ø", textHeight: this.options.headerTextHeight });
		table.add({ text: "Comp. Total (m)", textHeight: this.options.headerTextHeight });
		table.add({ text: "Peso Total (kg)", textHeight: this.options.headerTextHeight });

		let pesoTotal = 0;
		//Cria as linhas das bitolas
		resumo.forEach((r) => {
			const bit = (+r.bitola).toLocaleString("pt", { minimumFractionDigits: 1 });
			const comp = r.compTotal.toLocaleString("pt", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
			const peso = r.pesoTotal.toLocaleString("pt", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
			table.add({ text: bit, textHeight: this.options.cellsTextHeight });
			table.add({ text: comp, textHeight: this.options.cellsTextHeight });
			table.add({ text: peso, textHeight: this.options.cellsTextHeight });
			pesoTotal += r.pesoTotal;
		});

		//Cria a linha do total
		table.add({ text: "Total:", textHeight: this.options.cellsTextHeight });
		table.add({});
		table.add({ text: pesoTotal.toLocaleString("pt", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), textHeight: this.options.cellsTextHeight });
		return table;
	}

	public criaTabelaDeAco(name: string, tabAco: Map<string, BarraDeAcoQuantitativo[]>): Table[] {
		const result: Table[] =[];
		const op = this.getDefaultTableOptions();
		op.blockName = "tabFerros";
		op.rowsCount = 2;
		op.columnsCount = 6;
		op.cells = [];

		const header = new Table(op);
		//Cria cabecalho
		header.add({ text: "Tabela de ferros (sem perdas)", textHeight: this.options.headerTextHeight });
		header.add({ merged: true });
		header.add({ merged: true });
		header.add({ merged: true });
		header.add({ merged: true });
		header.add({ merged: true });
		header.add({ text: "Ferro", textHeight: this.options.headerTextHeight });
		header.add({ text: "Ø", textHeight: this.options.headerTextHeight });
		header.add({ text: "Qtde.", textHeight: this.options.headerTextHeight });
		header.add({ text: "Comp. (m)", textHeight: this.options.headerTextHeight });
		header.add({ text: "Total (m)", textHeight: this.options.headerTextHeight });
		header.add({ text: "Total (kg)", textHeight: this.options.headerTextHeight });
		result.push(header);

		for(let el of tabAco.keys()){
			const ferros = tabAco.get(el)!;
			op.blockName = "tab_"+el;
			op.insertionPoint = point(op.insertionPoint.x, op.insertionPoint.y-(op.rowsCount*op.rowsHeight[0]));;
			op.rowsCount = 1 + ferros.length;
			op.cells = [];
			
			const tabEl = new Table(op);
			tabEl.add({ text: el, textHeight: this.options.cellsTextHeight });
			tabEl.add({ merged: true });
			tabEl.add({ merged: true });
			tabEl.add({ merged: true });
			tabEl.add({ merged: true });
			tabEl.add({ merged: true });

			for(let fer of ferros){
				const n = "N"+fer.numero;
				const bit = (+fer.bitola).toLocaleString("pt", { minimumFractionDigits: 1 });
				const qtde = fer.quantidade.toString();
				const comp = fer.compUnit.toLocaleString("pt", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
				const compTotal = fer.compTotal.toLocaleString("pt", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
				const pesoTotal = fer.peso.toLocaleString("pt", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

				tabEl.add({text: n, textHeight: this.options.cellsTextHeight});
				tabEl.add({text: bit, textHeight: this.options.cellsTextHeight});
				tabEl.add({text: qtde, textHeight: this.options.cellsTextHeight});
				tabEl.add({text: comp, textHeight: this.options.cellsTextHeight});
				tabEl.add({text: compTotal, textHeight: this.options.cellsTextHeight});
				tabEl.add({text: pesoTotal, textHeight: this.options.cellsTextHeight});
			}
			result.push(tabEl);
		}





		return result;
	}




}


