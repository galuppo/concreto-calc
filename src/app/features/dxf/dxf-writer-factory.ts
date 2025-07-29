import { Writer } from "../../../../../dxf-writer/lib";
import { AppLayersFactory } from "./elements/layers/app-layers";
import { AppLineTypesFactory } from "./elements/linetypes/app-linetypes";

export class DxfWriterFactory{

	private static setupDefaultWriter(writer: Writer){
		//Display Lineweight
		writer.document.header.add("$LWDISPLAY").add(290, 1);
		//Define fonte padrão
		writer.document.tables.styleStandard.fontFamily = "Arial";
		//Define linetypes
		for (let lType of AppLineTypesFactory.AppLineTypes())
			writer.document.tables.addLType(lType);
		//Define layers
		for (let layer of AppLayersFactory.AppLayers())
			writer.document.tables.addLayer(layer);

	}

	public static getNewDefaultWriter(){
		const dxfWriter = new Writer();
		this.setupDefaultWriter(dxfWriter);
		return dxfWriter;
	}
}