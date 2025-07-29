import { roundUp } from "../../../utils/number-utils";
import { BarraDeAco, BarrasDeAco } from "./barra-aco.model";
import { FormaArmadura } from "./forma-armadura.model";

export interface ArmaduraParams {
	multiplo?: number;
	quantidade: number;
	numero: number;
	barra: BarraDeAco;
	espacamento?: number;
	forma?: FormaArmadura;
}

export class Armadura {
	public multiplo?: number;
	public quantidade: number;
	public numero: number;
	public barra: BarraDeAco;
	public espacamento?: number;
	public forma?: FormaArmadura;

	constructor(params?: ArmaduraParams){
		if(params){
			this.multiplo = params.multiplo;
			this.quantidade = params.quantidade;
			this.numero = params.numero;
			this.barra = params.barra;
			this.espacamento = params.espacamento;
			this.forma = params.forma;
		} else {
			this.quantidade = 0;
			this.numero = 0;
			this.barra = BarrasDeAco.Ø5;
		}
		
	}

	get identificador(): string {
		let id = "";
		
		if(this.multiplo && this.multiplo > 1)
			id += this.multiplo+"x";
		
		id += this.quantidade+" N"+this.numero+" Ø"+this.barra.dmm;

		if(this.espacamento)
			id += " c/"+this.espacamento+" cm";

		if(this.forma)
			id += " C="+this.calculaComprimentoForma()+" cm";
		return id;
	}

	private calculaComprimentoForma(): number {
		if(!this.forma)
			return 0;
		let comp = 0;
		for(let s of this.forma.segmentos)
			comp += roundUp(s,0);
		return comp;
	}


}