import { FormaArmadura } from "./models/forma-armadura.model";

export class FormaArmaduraFactory {
	public static estribo01(largura: number, altura: number, gancho: number): FormaArmadura {
		const forma: FormaArmadura = {
			segmentos: [gancho, altura, largura, altura, largura, gancho],
			dobras: [0,270,270, 270, 315, 270],
			cotaSegmento: [false, false, true, true, false, true],
			cotaAcimaDoSegmento: [true, true, true, true, true, true]
		}
		return forma; 
	}
	public static estribo02(largura: number, altura: number, gancho: number): FormaArmadura {
		const forma: FormaArmadura = {
			segmentos: [gancho, altura, largura, altura, largura, gancho],
			dobras: [270 ,270,270, 270, 315, 270],
			cotaSegmento: [false, false, true, true, false, true],
			cotaAcimaDoSegmento: [true, true, true, true, true, true]
		}
		return forma; 
	}

	public static uInvertido01(altura: number, largura: number): FormaArmadura {
		const forma: FormaArmadura = {
			segmentos: [altura, largura, altura],
			dobras: [90, -90, -90],
			cotaSegmento: [true, true, false],
			cotaAcimaDoSegmento: [true, true, true]
		};
		return forma;
	}
}