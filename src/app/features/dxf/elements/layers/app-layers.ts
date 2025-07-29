import { Colors, LayerOptions, OmitSeeder } from "../../../../../../../dxf-writer/lib";
import { AppLineTypes } from "../linetypes/app-linetypes";

export const AppLayerNames = {
	FORMAS: "FORMAS",
	COTAS: "COTAS",
	TEXTOS: "TEXTOS",
	CORTE: "CORTE",
	ARMADURAS: "ARMADURAS"
}

export class AppLayersFactory {

	public static AppLayers(): OmitSeeder<LayerOptions>[]{
		return [
			this.FORMAS(),
			this.CORTE(),
			this.TEXTOS(),
			this.COTAS(),
			this.ARMADURAS()
		]
	}

	public static FORMAS(): OmitSeeder<LayerOptions> {
		const options: OmitSeeder<LayerOptions> = {
			name: AppLayerNames.FORMAS,
			colorNumber: Colors.White,
			lineWeight: 50 //0.5mm
		};
		return options;
	}

	public static ARMADURAS(): OmitSeeder<LayerOptions> {
		const options: OmitSeeder<LayerOptions> = {
			name: AppLayerNames.ARMADURAS,
			colorNumber: Colors.Red,
			lineWeight: 30 //0.3mm
		};
		return options;
	}

	public static COTAS(): OmitSeeder<LayerOptions> {
		const options: OmitSeeder<LayerOptions> = {
			name: AppLayerNames.COTAS,
			colorNumber: Colors.Red,
			lineWeight: -3 //standart
		};
		return options;
	}

	public static TEXTOS(): OmitSeeder<LayerOptions> {
		const options: OmitSeeder<LayerOptions> = {
			name: AppLayerNames.TEXTOS,
			colorNumber: Colors.Cyan,
			lineWeight: -3 //standart
		};
		return options;
	}

	public static CORTE(): OmitSeeder<LayerOptions> {
		const options: OmitSeeder<LayerOptions> = {
			name: AppLayerNames.CORTE,
			colorNumber: Colors.Magenta,
			lineWeight: -3, //standart
			lineTypeName: AppLineTypes.DASHED
		};
		return options;
	}
}