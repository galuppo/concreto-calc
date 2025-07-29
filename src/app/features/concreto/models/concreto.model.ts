import { BarraDeAco } from "../../armaduras/models/barra-aco.model";

export enum TipoAgregado {
	BasaltoEDiabasio,
	GraniteEGnaisse,
	Calcario,
	Arenito
}

export enum TipoAncoragem {
	BarraReta,
	BarraTracionadaComGanchoECobrimento,
	BarraTransversalSoldada,
	BarraTransversalSoldadaEGancho
}

export interface AncoragemParams {
	barra: BarraDeAco,
	situacaoBoaAderencia: boolean,
	AsCalc: number,
	AsEf: number,
	tpAncoragem: TipoAncoragem
}

export class Concreto {

	private _fckMPa: number;

	constructor(fckMPa: number) {
		this._fckMPa = fckMPa;
	}

	get fckMPa(): number {
		return this._fckMPa;
	}

	get fctmMPa(): number {
		if(this._fckMPa <= 50)
			return 0.3*Math.pow(this._fckMPa, 2/3);
		else
			return 2.12*Math.log(1+0.1*(this._fckMPa+8));
	}

	get fctkInfMPa(): number {
		return 0.7*this.fctmMPa;
	}

	get fctkSupMPa(): number {
		return 1.3*this.fctmMPa;
	}

	get gammaC(): number {
		return 1.4;
	}

	get fcdMPa(): number {
		return this._fckMPa/this.gammaC;
	}

	get epsilonC2(): number {
		if(this._fckMPa <= 50)
			return 2/1000;
		else
			return 2/1000+(0.085/1000)*Math.pow(this._fckMPa-50, 0.53)
	}

	get epsilonCu(): number {
		if(this._fckMPa <= 50)
			return 3.5/1000;
		else if (this._fckMPa <= 90)
			return 2.6/1000+(35/1000)*Math.pow((90-this._fckMPa)/100 ,4);
		throw new Error("εcu indefinido!");
		
	}

	get ethaC(): number {
		return this._fckMPa <= 40 ? 1 : Math.pow(40/this._fckMPa, 1/3);
	}

	get sigmaCMPa(): number {
		return 0.85*this.ethaC*this.fcdMPa;
	}

	get fctdMPa(): number {
		return this.fctkInfMPa/this.gammaC;
	}

	private AlfaE(tpAgregado: TipoAgregado): number {
		switch(tpAgregado){
			case TipoAgregado.BasaltoEDiabasio: return 1.2;
			case TipoAgregado.GraniteEGnaisse: return 1;
			case TipoAgregado.Calcario: return 0.9;
			case TipoAgregado.Arenito: return 0.7;
		}
	}

	private Alfa(tpAncoragem: TipoAncoragem): number {
		switch(tpAncoragem){
			case TipoAncoragem.BarraReta: return 1;
			case TipoAncoragem.BarraTracionadaComGanchoECobrimento: return 0.7;
			case TipoAncoragem.BarraTransversalSoldada: return 0.7;
			case TipoAncoragem.BarraTransversalSoldadaEGancho: return 0.5;
		}
	}

	public EciMPa(tpAgregado: TipoAgregado): number {
		const alfaE = this.AlfaE(tpAgregado);
		if(this._fckMPa <= 50)
			return alfaE*5600*Math.sqrt(this._fckMPa);
		else
			return 21500*alfaE*Math.pow(this._fckMPa/10 ,1/3);
	}

	public EcsMPa(tpAgregado: TipoAgregado): number {
		const alfaI = Math.min(0.8+0.2*this._fckMPa/80, 1);
		return alfaI*this.EciMPa(tpAgregado);
	}

	public comprimentoAncoragemBasico(barra: BarraDeAco, sitBoaAderencia: boolean): number {
		const dCm = barra.dmm/10;
		const lbMin = 25*dCm;
		const etha1 = 2.25;//Tabela 8.2 NBR6118
		const etha2 = sitBoaAderencia ? 1 : 0.7
		const etha3 = barra.dmm < 32 ? 1 : (132-barra.dmm)/100;

		const fbdMPa = etha1*etha2*etha3*this.fctdMPa;
		const fyd = 500/1.15;

		return Math.max(lbMin, (dCm/4)*(fyd/fbdMPa));
	}

	public comprimentoAncoragemNecessario(params: AncoragemParams): number {
		const alfa = this.Alfa(params.tpAncoragem);
		const lb = this.comprimentoAncoragemBasico(params.barra, params.situacaoBoaAderencia);
		const lbMin = Math.max(0.3*lb, params.barra.dmm, 10);
		return Math.max(alfa*lb*(params.AsCalc/params.AsEf), lbMin);
	}

}

export const ClassesConcreto = {
	C20: new Concreto(20),
	C25: new Concreto(25),
	C30: new Concreto(30),
	C35: new Concreto(35),
	C40: new Concreto(40)
}