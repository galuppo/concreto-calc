import { Armadura } from "../../armaduras/models/armadura.model";
import { Concreto } from "../../concreto/models/concreto.model";

export interface Estaca {
	nome: string;
	diametro: number;
	comprimento: number;
	cobrimento: number;
	concreto: Concreto;
	armLong: Armadura;
	armEstribo: Armadura;
}