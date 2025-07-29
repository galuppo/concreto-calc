import { AttachmentPoint, Entity, LineTypes, MText, point, Point3D, Polyline, Seeder } from "../../../../../../../dxf-writer/lib";
import { rotatePoints, mirrorPoints, findAngleDegree } from "../../../../utils/geometry-utils";
import { AppLayerNames } from "../layers/app-layers";

export interface SectionMarkOptions {
	seeder: Seeder;
	scale: number;
	headSize: number;
	textSize: number;
}

export class SectionMark {
	private _options: SectionMarkOptions;

	constructor(options: SectionMarkOptions) {
		this._options = options;	
	}

	get scale(): number {
		return this._options.scale;
	}

	get scaleFator(): number {
		return this.scale/10;
	}

	get headSize(): number {
		return this._options.headSize;
	}

	get textSize(): number {
		return this._options.textSize;
	}

	private getHeadMarkVertices(oPoint: Point3D, angleDeg: number, mirrored: boolean): Point3D[] {
		const modelHeadSize = this.headSize*this.scaleFator;
		let vertices = [
			oPoint,
			point(oPoint.x, oPoint.y+modelHeadSize*0.3333),
			point(oPoint.x-0.5*modelHeadSize, oPoint.y+modelHeadSize*0.3333),
			point(oPoint.x, oPoint.y+modelHeadSize),
			point(oPoint.x, oPoint.y+modelHeadSize*0.3333)
		];
		if(angleDeg != 0)
			vertices = rotatePoints(vertices, oPoint, angleDeg);
		if(mirrored)
			vertices = mirrorPoints(vertices, vertices[0], vertices[1]);
		return vertices;
	}

	private createHeadMark(oPoint: Point3D, angleDeg: number, mirrored: boolean): Polyline {
		const pline = new Polyline({
			seeder: this._options.seeder,
			layerName: AppLayerNames.CORTE,
			lineTypeName: LineTypes.Continuous
		});
		const vertices = this.getHeadMarkVertices(oPoint, angleDeg, mirrored);
		for(let v of vertices)
			pline.add(v);
		return pline;
	}

	private createSectionLine(start: Point3D, end: Point3D): Polyline {
		const pline = new Polyline({
			seeder: this._options.seeder,
			layerName: AppLayerNames.CORTE,
			lineTypeScale: this.scale
		});
		pline.add(start);
		pline.add(end);
		return pline;
	}

	private createSeciontHeadTitle(iPoint: Point3D, angle: number, title: string): MText {
		const textOffset = (this.headSize+0.5)*this.scaleFator;
		const insertionPoint = rotatePoints([point(iPoint.x, iPoint.y+textOffset)], iPoint, angle)[0];
		const mText = new MText({
			seeder: this._options.seeder,
			height: this.textSize*this.scaleFator,
			insertionPoint: insertionPoint,
			attachmentPoint: AttachmentPoint.BottomCenter,
			value: title,
			layerName: AppLayerNames.CORTE
		});

		if(angle > 90 && angle <= 270){
			angle += 180;
			mText.attachmentPoint = AttachmentPoint.TopCenter;
		}
		mText.rotation = angle;
		return mText;
	}

	public buildSectionMark(startPoint: Point3D, endPoint: Point3D, sectionTitle: string): Entity[] {
		const vDir = point(endPoint.x - startPoint.x, endPoint.y - startPoint.y);
		const angDeg = findAngleDegree(vDir.x, vDir.y);

		const result: Entity[] = [];
		result.push(this.createHeadMark(startPoint, angDeg, false));
		result.push(this.createSeciontHeadTitle(startPoint, angDeg, sectionTitle));
		result.push(this.createSectionLine(startPoint, endPoint));
		result.push(this.createHeadMark(endPoint, angDeg, true));
		result.push(this.createSeciontHeadTitle(endPoint, angDeg, sectionTitle));
		return result;
	}

}
