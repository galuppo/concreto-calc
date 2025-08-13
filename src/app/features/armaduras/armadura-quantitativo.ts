import { Armadura } from "./models/armadura.model";
import { BarraDeAco } from "./models/barra-aco.model";

export interface BarraDeAcoQuantitativo {
	numero: number;
	bitola: string;
	quantidade: number;
	compUnit: number;
	compTotal: number;
	peso: number;
}

export interface ResumoAco {
	bitola: string;
	compTotal: number;
	pesoTotal: number;
}

export class ArmaduraQuantitativo {

	private tabelaAco: Map<string, BarraDeAcoQuantitativo[]> = new Map<string, BarraDeAcoQuantitativo[]>();

	constructor() {
		
	}

	public addBarra(idElemento: string, armadura: Armadura, multiplicador: number = 1) {
		if(multiplicador > 1)
			idElemento += " ("+multiplicador+"x)";

		if(!this.tabelaAco.has(idElemento))
			this.tabelaAco.set(idElemento, []);

		const qElemento = this.tabelaAco.get(idElemento)!;

		const quantidade = (armadura.multiplo ?? 1)*armadura.quantidade*multiplicador;
		const compTotal = armadura.comprimento*quantidade/100;
		const peso = compTotal*armadura.barra.kgM;

		qElemento.push({
			numero: armadura.numero,
			bitola: armadura.barra.dmm.toString(),
			quantidade: quantidade,
			compUnit: armadura.comprimento/100,
			compTotal: compTotal,
			peso: peso
		});
	}

	public getTabelaAco(): Map<string, BarraDeAcoQuantitativo[]> {
		return this.tabelaAco;
	}

	public getResumoAco(): ResumoAco[] {
		const resumo = new Map<string, ResumoAco>();

		for(let qBarra of this.tabelaAco.values()){
			qBarra.forEach((b) => {
				if(!resumo.has(b.bitola))
					resumo.set(b.bitola, {
						bitola: b.bitola,
						compTotal: 0,
						pesoTotal: 0
					});
				
				const rBarra = resumo.get(b.bitola)!;
				rBarra.compTotal += b.compTotal;
				rBarra.pesoTotal += b.peso;
			});
		}

		const result: ResumoAco[] = [];
		for(let res of resumo.values()){
			result.push(res);
		}
		result.sort((a, b) => (+a.bitola) - (+b.bitola));
		return result;
	}
}