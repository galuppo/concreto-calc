import { Circle, Entity, point, Point3D, Polyline, Seeder } from "../../../../../../../dxf-writer/lib";
import { EntityUtils } from "../../../../utils/entity-utils";

export enum ArrowHeadType {
	ArchTick,
	OpenCirce
}

export interface ArrowHeadParams {
	type: ArrowHeadType,
	size: number,
	seeder: Seeder,
	layerName: string,
	colorNumber?: number,
	lineWeight?: number
}

export class ArrowHeadFactory{

	private static createArchTick(params: ArrowHeadParams): Entity {
		const pline = new Polyline({
			seeder: params.seeder,
			colorNumber: params.colorNumber,
			layerName: params.layerName,
			lineWeight: params.lineWeight
		});
		pline.add(point(-params.size/2));
		pline.add(point(params.size/2,0));
		EntityUtils.rotateEntity(pline, point(0,0), 45);
		return pline;
	}

	private static createOpenCircle(params: ArrowHeadParams): Entity[] {
		const outerCircle = new Circle({
			seeder: params.seeder,
			center: point(),
			radius: params.size*0.5,
			layerName: params.layerName,
			colorNumber: params.colorNumber,
			lineWeight: params.lineWeight
		});

		const innerCircle = new Circle({
			seeder: params.seeder,
			center: point(),
			radius: params.size*0.25,
			layerName: params.layerName,
			colorNumber: params.colorNumber,
			lineWeight: params.lineWeight
		});

		return [outerCircle, innerCircle];
	}

	public static createArrowHead(params: ArrowHeadParams): Entity[]{
		switch(params.type){
			case ArrowHeadType.ArchTick: return [this.createArchTick(params)];
			case ArrowHeadType.OpenCirce: return this.createOpenCircle(params);
		}
	}

}