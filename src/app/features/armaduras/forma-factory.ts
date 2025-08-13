import { FormaArmadura, FormaArmaduraCircular, FormaArmaduraReta } from "./models/forma-armadura.model";

export class FormaArmaduraFactory {
	public static estribo01(largura: number, altura: number, gancho: number): FormaArmaduraReta {
		const forma: FormaArmaduraReta = {
			segmentos: [gancho, altura, largura, altura, largura, gancho],
			dobras: [0,270,270, 270, 315, 270],
			cotaSegmento: [false, false, true, true, false, true],
			cotaAcimaDoSegmento: [true, true, true, true, true, true]
		}
		return forma; 
	}
	public static estribo02(largura: number, altura: number, gancho: number): FormaArmaduraReta {
		const forma: FormaArmaduraReta = {
			segmentos: [gancho, altura, largura, altura, largura, gancho],
			dobras: [270 ,270,270, 270, 315, 270],
			cotaSegmento: [false, false, true, true, false, true],
			cotaAcimaDoSegmento: [true, true, true, true, true, true]
		}
		return forma; 
	}

	public static estriboCircular(diametro: number, transpasse: number, gancho: number): FormaArmaduraCircular {
		const forma: FormaArmaduraCircular = {
			diametro: diametro,
			gancho: gancho,
			transpasse: transpasse,
			cotaDiametro: true,
			cotaTranspasse: false,
			cotaGancho: true
		}
		return forma; 
	}

	public static uInvertido01(altura: number, largura: number): FormaArmaduraReta {
		const forma: FormaArmaduraReta = {
			segmentos: [altura, largura, altura],
			dobras: [90, -90, -90],
			cotaSegmento: [true, true, false],
			cotaAcimaDoSegmento: [true, true, true]
		};
		return forma;
	}

	public static retaVertical(comp: number): FormaArmaduraReta {
		const forma: FormaArmaduraReta = {
			segmentos: [comp],
			dobras: [90],
			cotaSegmento: [true],
			cotaAcimaDoSegmento: [true]
		}
		return forma; 
	}

	public static retaHorizontal(comp: number): FormaArmaduraReta {
		const forma: FormaArmaduraReta = {
			segmentos: [comp],
			dobras: [0],
			cotaSegmento: [true],
			cotaAcimaDoSegmento: [true]
		}
		return forma; 
	}
}