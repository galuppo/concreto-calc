import { AttachmentPoint, Entity, MText, point, Point3D, Polyline, Seeder } from "../../../../../../../dxf-writer/lib";
import { BoundingBoxUtils } from "../../../../utils/bounding-box-utils";
import { EntityUtils } from "../../../../utils/entity-utils";
import { directionVector, findAngleDegree, middlePoint, pointDistance, movePoints, orthogonalVector, unitaryVector } from "../../../../utils/geometry-utils";
import { round } from "../../../../utils/number-utils";
import { AppLayerNames } from "../layers/app-layers";
import { ArrowHeadFactory, ArrowHeadParams, ArrowHeadType } from "./arrow-head-factory";


export interface DimStyle {
	offsetDimensionLineFromReference?: number;
	extensionLineGapFromReference?: number;
	extensionLineExtentionFromDimline?: number;
	textHeight: number;
	textOffsetFromDimline?: number;
	precisionDigits?: number;
	arrowHead?: ArrowHeadType;
	arrowHeadSize?: number;
	colorNumber?: number;
	layerName?: string;
	supressExtensionLine?: boolean;
	supressDimensionLine?: boolean;
}


export class AppDim {

	private _defaultStyle: DimStyle
	private seeder: Seeder
	private currentStyle: DimStyle;

	constructor(seeder: Seeder, defaultStyle: DimStyle) {
		this.seeder = seeder;
		this._defaultStyle = {
			offsetDimensionLineFromReference: defaultStyle.offsetDimensionLineFromReference ?? 0,
			extensionLineGapFromReference: defaultStyle.extensionLineGapFromReference ?? 0,
			extensionLineExtentionFromDimline: defaultStyle.extensionLineExtentionFromDimline ?? 0,
			textHeight: defaultStyle.textHeight,
			textOffsetFromDimline: defaultStyle.textOffsetFromDimline ?? 0,
			precisionDigits: defaultStyle.precisionDigits ?? 1,
			arrowHead: defaultStyle.arrowHead ?? ArrowHeadType.ArchTick,
			arrowHeadSize: defaultStyle.arrowHeadSize ?? 1,
			colorNumber: defaultStyle.colorNumber,
			layerName: defaultStyle.layerName ?? AppLayerNames.COTAS,
			supressExtensionLine: defaultStyle.supressExtensionLine ?? false,
			supressDimensionLine: defaultStyle.supressDimensionLine ?? false
		};
		this.currentStyle = this._defaultStyle;
	}

	public setCurrentStyle(dimStyle?: DimStyle) {
		if (!dimStyle) {
			this.currentStyle = this._defaultStyle;
			return;
		}

		this.currentStyle.textHeight = dimStyle.textHeight;
		this.currentStyle.offsetDimensionLineFromReference = dimStyle.offsetDimensionLineFromReference ?? this._defaultStyle.offsetDimensionLineFromReference;
		this.currentStyle.extensionLineGapFromReference = dimStyle.extensionLineGapFromReference ?? this._defaultStyle.extensionLineGapFromReference;
		this.currentStyle.extensionLineExtentionFromDimline = dimStyle.extensionLineExtentionFromDimline ?? this._defaultStyle.extensionLineExtentionFromDimline;
		this.currentStyle.textHeight = dimStyle.textHeight ?? this._defaultStyle.textHeight;
		this.currentStyle.textOffsetFromDimline = dimStyle.textOffsetFromDimline ?? this._defaultStyle.textOffsetFromDimline;
		this.currentStyle.precisionDigits = dimStyle.precisionDigits ?? this._defaultStyle.precisionDigits;
		this.currentStyle.arrowHead = dimStyle.arrowHead ?? this._defaultStyle.arrowHead;
		this.currentStyle.arrowHeadSize = dimStyle.arrowHeadSize ?? this._defaultStyle.arrowHeadSize;
		this.currentStyle.layerName = dimStyle.layerName ?? this._defaultStyle.layerName;
		this.currentStyle.colorNumber = dimStyle.colorNumber ?? this._defaultStyle.colorNumber;
		this.currentStyle.supressExtensionLine = dimStyle.supressExtensionLine ?? this._defaultStyle.supressExtensionLine;
		this.currentStyle.supressDimensionLine = dimStyle.supressDimensionLine ?? this._defaultStyle.supressDimensionLine;
	}

	public static getDefaultStyle(scaleCoef: number): DimStyle {
		return {
			offsetDimensionLineFromReference: 10*scaleCoef,
			extensionLineGapFromReference: 1*scaleCoef,
			extensionLineExtentionFromDimline: 2*scaleCoef,
			textHeight: 2*scaleCoef,
			textOffsetFromDimline: 2*scaleCoef,
			precisionDigits: 1,
			arrowHead: ArrowHeadType.ArchTick,
			arrowHeadSize: 2*scaleCoef,
			colorNumber: undefined,
			layerName: AppLayerNames.COTAS,
			supressExtensionLine: false,
			supressDimensionLine: false
		}
	}

	private insertExtLine(iPoint: Point3D, vOrtho: Point3D, offsetDimLine: number): Polyline {
		const pline = new Polyline({
			seeder: this.seeder,
			layerName: this.currentStyle.layerName,
			colorNumber: this.currentStyle.colorNumber
		});

		const gap = this.currentStyle.extensionLineGapFromReference!;
		const ext = this.currentStyle.extensionLineExtentionFromDimline!;

		const pStart = point(iPoint.x + vOrtho.x * gap, iPoint.y + vOrtho.y * gap);
		const pDimLine = point(iPoint.x + vOrtho.x * offsetDimLine, iPoint.y + vOrtho.y * offsetDimLine);
		const pEnd = point(pDimLine.x + vOrtho.x * ext, pDimLine.y + vOrtho.y * ext);

		pline.add(pStart);
		pline.add(pDimLine);
		pline.add(pEnd);

		return pline;
	}

	private insertDimLine(pStart: Point3D, pEnd: Point3D, vOrtho: Point3D): Entity[] {
		const ent: Entity[] = [];

		const pline = new Polyline({
			seeder: this.seeder,
			layerName: this.currentStyle.layerName,
			colorNumber: this.currentStyle.colorNumber
		});

		const dLineOffset = this.currentStyle.offsetDimensionLineFromReference!;
		const p1 = point(pStart.x + vOrtho.x * dLineOffset, pStart.y + vOrtho.y * dLineOffset);
		const p2 = point(pEnd.x + vOrtho.x * dLineOffset, pEnd.y + vOrtho.y * dLineOffset);
		pline.add(p1);
		pline.add(p2);
		ent.push(pline);

		const ahParams: ArrowHeadParams = {
			layerName: this.currentStyle.layerName!,
			seeder: this.seeder,
			size: this.currentStyle.arrowHeadSize!,
			type: this.currentStyle.arrowHead!,
			colorNumber: this.currentStyle.colorNumber
		};

		const vDir = directionVector(pStart, pEnd);
		const angle = findAngleDegree(vDir.x, vDir.y);

		const arrowHead1 = ArrowHeadFactory.createArrowHead(ahParams);
		EntityUtils.moveEntities(arrowHead1, point(), p1);
		EntityUtils.rotateEntities(arrowHead1, p1, angle);
		for (let e of arrowHead1)
			ent.push(e);

		const arrowHead2 = ArrowHeadFactory.createArrowHead(ahParams);
		EntityUtils.moveEntities(arrowHead2, point(), p2);
		EntityUtils.rotateEntities(arrowHead2, p2, angle);
		for (let e of arrowHead2)
			ent.push(e);

		return ent;
	}

	private insertMText(iPoint: Point3D, text: string, rotation: number): MText {
		const mText = new MText({
			seeder: this.seeder,
			value: text,
			height: this.currentStyle.textHeight,
			insertionPoint: iPoint,
			attachmentPoint: AttachmentPoint.BottomCenter,
			rotation: rotation,
			layerName: this.currentStyle.layerName,
			colorNumber: this.currentStyle.colorNumber
		});

		if (rotation > 90 && rotation <= 270) {
			mText.rotation = rotation + 180;
			mText.attachmentPoint = AttachmentPoint.TopCenter;
		}
		return mText;
	}

	private insertDimText(pDimLineStart: Point3D, pDimLineEnd: Point3D, vOrtho: Point3D, textOverride?: string): Entity[] {
		const ent: Entity[] = [];
		const dLineOffset = this.currentStyle.offsetDimensionLineFromReference!;
		const textOffset = this.currentStyle.textOffsetFromDimline!;		
		const dif = point(pDimLineEnd.x - pDimLineStart.x, pDimLineEnd.y - pDimLineStart.y);
		const angle = findAngleDegree(dif.x, dif.y);
		const midPoint = middlePoint(pDimLineStart, pDimLineEnd);
		const textInsertionPoint = point(
			midPoint.x + vOrtho.x * (textOffset + dLineOffset),
			midPoint.y + vOrtho.y * (textOffset + dLineOffset)
		);
		const dimLength = round(pointDistance(pDimLineStart, pDimLineEnd), this.currentStyle.precisionDigits!);
		const mText = this.insertMText(textInsertionPoint, textOverride ? textOverride : dimLength.toString(), angle);
		ent.push(mText);
	
		const textBbox = BoundingBoxUtils.getBoundingBox(mText);
		const bboxSize = BoundingBoxUtils.getBoundingBoxSize(textBbox);

		if (dimLength < bboxSize)
			ent.push(this.criaTextLeader(mText, vOrtho));

		return ent;
	}

	private criaTextLeader(mText: MText, vOrtho: Point3D): Polyline {
		mText.rotation = 0;
		mText.attachmentPoint = AttachmentPoint.BottomCenter;
		const textBbox = BoundingBoxUtils.getBoundingBox(mText);
		const underlinePoints = [
			point(textBbox.minX - this.currentStyle.textHeight * 0.5, textBbox.minY),
			point(textBbox.maxX + this.currentStyle.textHeight * 0.5, textBbox.minY)
		];
		const leaderSize = this.currentStyle.extensionLineExtentionFromDimline! * 2;
		let vertices: Point3D[] = [];
		const ang = findAngleDegree(vOrtho.x, vOrtho.y);

		//primeiro e quarto quadrante
		if (ang <= 90 || ang >= 270) {
			vertices.push(underlinePoints[1]);
			vertices.push(underlinePoints[0]);
		} else { //segundo e terceiro quadrante
			vertices.push(underlinePoints[0]);
			vertices.push(underlinePoints[1]);
		}

		vertices.push(point(vertices[1].x - leaderSize * vOrtho.x, vertices[1].y - leaderSize * vOrtho.y));
		vertices = movePoints(vertices, vertices[2], mText.insertionPoint);

		EntityUtils.moveEntity(mText,
			mText.insertionPoint,
			point((vertices[0].x + vertices[1].x) / 2, (vertices[0].y + vertices[1].y) / 2 + this.currentStyle.textHeight * 0.5));
		if( ang >= 180 && ang <= 360){
			EntityUtils.moveEntity(mText, point(), point(0,-this.currentStyle.textHeight));
			mText.attachmentPoint = AttachmentPoint.TopCenter;
		}

		const leaderPline = new Polyline({
			seeder: this.seeder,
			layerName: this.currentStyle.layerName,
			colorNumber: this.currentStyle.colorNumber
		});

		for (let v of vertices)
			leaderPline.add(v);

		return leaderPline;
	}
	public linearDim(points: Point3D[], horizontal: boolean): Entity[];
	public linearDim(points: Point3D[], horizontal: boolean, textOverride: string): Entity[];
	public linearDim(points: Point3D[], horizontal: boolean, textOverride?: string): Entity[] {
		if (points.length < 2)
			return [];

		const ent: Entity[] = [];

		const vOrtho = horizontal ? point(0, 1) : point(-1, 0);
		let start = points[0];
		let end = points[1];
		const vDir = directionVector(start, end);

		const length = vDir.x * vOrtho.y + vDir.y * (-vOrtho.x);
		//If length is negative, means that the orthoVector is in the oposite direction
		if (length < 0) {
			vOrtho.x = round(vOrtho.x*-1,0);
			vOrtho.y = round(vOrtho.y*-1,0);
		}

		//Find the point reference for the dim line
		const dimLineRefPoint = point(start.x, start.y);
		const oRef = vOrtho.x + vOrtho.y;
		const oAbs = point(Math.abs(vOrtho.x), Math.abs(vOrtho.y));
		for (let p of points) {
			dimLineRefPoint.x = oRef > 0 ? Math.max(p.x, dimLineRefPoint.x) : Math.min(p.x, dimLineRefPoint.x);
			dimLineRefPoint.y = oRef > 0 ? Math.max(p.y, dimLineRefPoint.y) : Math.min(p.y, dimLineRefPoint.y);
		}
		dimLineRefPoint.x *= oAbs.x;
		dimLineRefPoint.y *= oAbs.y;

		const offsetDimLine = this.currentStyle.offsetDimensionLineFromReference!;

		let distRef = pointDistance(point(start.x * oAbs.x, start.y * oAbs.y), dimLineRefPoint);
		if(!(this.currentStyle.supressExtensionLine!))
			ent.push(this.insertExtLine(start, vOrtho, offsetDimLine + distRef));

		let startDimPoint = point(start.x + distRef * vOrtho.x, start.y + distRef * vOrtho.y);

		for (let i = 1; i < points.length; i++) {
			end = points[i];
			distRef = pointDistance(point(end.x * oAbs.x, end.y * oAbs.y), dimLineRefPoint);

			if(!(this.currentStyle.supressExtensionLine!))
				ent.push(this.insertExtLine(end, vOrtho, offsetDimLine + distRef));

			const endDimPoint = point(end.x + distRef * vOrtho.x, end.y + distRef * vOrtho.y);

			if(!(this.currentStyle.supressDimensionLine!)){
				const dLine = this.insertDimLine(startDimPoint, endDimPoint, vOrtho);
				for(let e of dLine)
					ent.push(e);
			}

			const text = this.insertDimText(startDimPoint, endDimPoint, vOrtho, textOverride);
			for(let e of text)
				ent.push(e);

			start = end;
			startDimPoint = endDimPoint;
		}

		this.setCurrentStyle();
		return ent;
	}

	public alignDim(start: Point3D, end: Point3D, textOverride?: string): Entity[] {
		const ent: Entity[] = [];
		const vDir = directionVector(start, end);
		const vOrtho = orthogonalVector(unitaryVector(start, end));
		const angle = findAngleDegree(vDir.x, vDir.y);
		const dLineOffset = this.currentStyle.offsetDimensionLineFromReference!;


		if(!(this.currentStyle.supressExtensionLine!))
			ent.push(this.insertExtLine(start, vOrtho, dLineOffset));

		if(!(this.currentStyle.supressDimensionLine!))
			this.insertDimLine(start, end, vOrtho).forEach((e) => ent.push(e));

		this.insertDimText(start, end, vOrtho, textOverride).forEach((e) => ent.push(e));

		return ent;
	}
}
