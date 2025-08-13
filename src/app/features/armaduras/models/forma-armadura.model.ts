export type FormaArmadura = FormaArmaduraCircular | FormaArmaduraReta;

export interface FormaArmaduraReta {
	segmentos: number[]
	dobras: number[]
	cotaSegmento: boolean[]
	cotaAcimaDoSegmento: boolean[];
}

export interface FormaArmaduraCircular{
	diametro: number;
	gancho: number;
	transpasse: number;
	cotaDiametro: boolean;
	cotaTranspasse: boolean;
	cotaGancho: boolean;
}

export function isFormaReta(forma: FormaArmadura): forma is FormaArmaduraReta {
	return (forma as FormaArmaduraReta).segmentos !== undefined;
}

export function isFormaCircular(forma: FormaArmadura): forma is FormaArmaduraCircular {
	return (forma as FormaArmaduraCircular).diametro !== undefined;
}