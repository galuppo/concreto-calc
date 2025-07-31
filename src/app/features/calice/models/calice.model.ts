import { Armadura } from "../../armaduras/models/armadura.model"
import { Concreto } from "../../concreto/models/concreto.model"

export interface Calice {
	nome: string
	pilarX: number
	pilarY: number
	espessuraColarinho: number
	espessuraJunta: number
	embutimento: number
	cobExterno: number
	cobInterno: number
	concreto: Concreto
	armHorzPrincipal: Armadura | undefined
	armHorzSecundaria: Armadura | undefined
	armVertPrincipal: Armadura | undefined
	armVertSecundaria: Armadura | undefined
}