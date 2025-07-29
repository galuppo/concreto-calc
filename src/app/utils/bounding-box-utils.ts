import { angle, BoundingBox, Circle, EntitiesManager, Entity, Hatch, HatchArc, HatchEdge, LWPolyline, MText, point, Point3D, Polyline, PolylineFlags } from "../../../../dxf-writer/lib";
import { degreeToRad, pointDistance, rotatePoints } from "./geometry-utils";

export enum BoundingBoxPoint {
	TopLeft,
	TopCenter,
	TopRight,
	MidLeft,
	Center,
	MidRight,
	BottomLeft,
	BottomCenter,
	BottomRight,
}


export class BoundingBoxUtils {

	private static getTextAproxWidth(txt: string, height: number): number {
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");
		if (context)
			context.font = height + "pt Arial";
		const metrics = context?.measureText(txt);

		if (metrics) {
			const boxWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
			const boxHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
			const ratio = boxWidth / boxHeight;
			return height * ratio * 1.066;//esse 1.066 é para compensar como o autocad renderiza as fontes
		}

		return 0;
	}

	private static bboxRotate(bbox: BoundingBox, ang: number, refPoint: Point3D): BoundingBox {
		const points = [
			point(bbox.minX, bbox.minY),
			point(bbox.minX, bbox.maxY),
			point(bbox.maxX, bbox.maxY),
			point(bbox.maxX, bbox.minY),
		];

		const rotPoints = rotatePoints(points, refPoint, ang);

		return this.calcBoundingBox(rotPoints);
	}

	public static calcBoundingBox(points: Point3D[]): BoundingBox {
		const bbox: BoundingBox = {
			maxX: points[0].x,
			maxY: points[0].y,
			maxZ: points[0].z,
			minX: points[0].x,
			minY: points[0].y,
			minZ: points[0].z
		}

		for (let i = 0; i < points.length; i++) {
			const p = points[i];
			bbox.maxX = p.x > bbox.maxX ? p.x : bbox.maxX;
			bbox.maxY = p.y > bbox.maxY ? p.y : bbox.maxY;
			bbox.maxZ = p.z > bbox.maxZ ? p.z : bbox.maxZ;
			bbox.minX = p.x < bbox.minX ? p.x : bbox.minX;
			bbox.minY = p.y < bbox.minY ? p.y : bbox.minY;
			bbox.minZ = p.z < bbox.minZ ? p.z : bbox.minZ;
		}
		return bbox;
	}

	public static maxBoundingBox(boundingBoxes: BoundingBox[]): BoundingBox {
		const result = boundingBoxes[0];

		boundingBoxes.forEach((bbox) => {
			result.maxX = bbox.maxX > result.maxX ? bbox.maxX : result.maxX;
			result.maxY = bbox.maxY > result.maxY ? bbox.maxY : result.maxY;
			result.maxZ = bbox.maxZ > result.maxZ ? bbox.maxZ : result.maxZ;

			result.minX = bbox.minX < result.minX ? bbox.minX : result.minX;
			result.minY = bbox.minY < result.minY ? bbox.minY : result.minY;
			result.minZ = bbox.minZ < result.minZ ? bbox.minZ : result.minZ;
		});

		return result;
	}

	private static getMTextBBox(mText: MText): BoundingBox {
		//considera que o texto esta em uma única linha
		//caso seja multilinhas, é preciso adaptar o código abaixo
		const tHeight = mText.height;
		const tWidth = this.getTextAproxWidth(mText.value, tHeight);

		const rotAng = mText.rotation ? mText.rotation : 0;
		const bbox: BoundingBox = {
			maxX: mText.insertionPoint.x,
			maxY: mText.insertionPoint.y,
			maxZ: mText.insertionPoint.z,
			minX: mText.insertionPoint.x,
			minY: mText.insertionPoint.y,
			minZ: mText.insertionPoint.z
		}

		switch (mText.attachmentPoint) {
			case 1:  //Top Left
				{
					bbox.maxX += tWidth;
					bbox.minY -= tHeight;
					break;
				}
			case 2: //Top Center
				{
					bbox.maxX += tWidth / 2;
					bbox.minX -= tWidth / 2;
					bbox.minY -= tHeight;
					break;
				};
			case 3: //Top Right
				{
					bbox.minX -= tWidth;
					bbox.minY -= tHeight;
					break;
				};
			case 4: //Middle left
				{
					bbox.maxX += tWidth;
					bbox.maxY += tHeight / 2;
					bbox.minY -= tHeight / 2;
					break;
				};
			case 5: //Middle center
				{
					bbox.maxX += tWidth / 2;
					bbox.maxY += tHeight / 2;
					bbox.minX -= tWidth / 2;
					bbox.minY -= tHeight / 2;
					break;
				};
			case 6: //Middle right
				{
					bbox.maxY += tHeight / 2;
					bbox.minX -= tWidth;
					bbox.minY -= tHeight / 2;
					break;
				};
			case 7: //Bottom left
				{
					bbox.maxX += tWidth;
					bbox.maxY += tHeight;
					break;
				};
			case 8: //Bottom center
				{
					bbox.maxX += tWidth / 2;
					bbox.maxY += tHeight;
					bbox.minX -= tWidth / 2;
					break;
				};
			case 9: //Bottom right
				{
					bbox.maxY += tHeight;
					bbox.minX -= tWidth;
					break;
				};
			default:
		}

		return rotAng != 0 ? this.bboxRotate(bbox, rotAng, mText.insertionPoint) : bbox;
	}

	private static getCircleBBox(circle: Circle): BoundingBox {
		const r = circle.radius;
		const center = circle.center;

		return {
			maxX: center.x + r,
			maxY: center.y + r,
			maxZ: 0,
			minX: center.x - r,
			minY: center.y - r,
			minZ: 0
		}
	}

	private static getLWPolylineBbox(pline: LWPolyline): BoundingBox {

		const result: BoundingBox = {
			maxX: pline.vertices[0].x,
			maxY: pline.vertices[0].y,
			maxZ: 0,
			minX: pline.vertices[0].x,
			minY: pline.vertices[0].y,
			minZ: 0
		}

		for (let i = 1; i < pline.vertices.length; i++) {
			const v = pline.vertices[i];
			result.maxX = v.x > result.maxX ? v.x : result.maxX;
			result.maxY = v.y > result.maxY ? v.y : result.maxY;
			result.minX = v.x < result.minX ? v.x : result.minX;
			result.minY = v.y < result.minY ? v.y : result.minY;
		}

		return result;
	}

	private static getPolylineBbox(pline: Polyline): BoundingBox {
		const result: BoundingBox = {
			maxX: pline.vertices[0].x,
			maxY: pline.vertices[0].y,
			maxZ: 0,
			minX: pline.vertices[0].x,
			minY: pline.vertices[0].y,
			minZ: 0
		}

		for (let i = 1; i < pline.vertices.length; i++) {
			const v = pline.vertices[i];
			result.maxX = v.x > result.maxX ? v.x : result.maxX;
			result.maxY = v.y > result.maxY ? v.y : result.maxY;
			result.minX = v.x < result.minX ? v.x : result.minX;
			result.minY = v.y < result.minY ? v.y : result.minY;
		}

		return result;
	}

	private static getHatchEdgeBBox(edge: HatchEdge): BoundingBox {
		if(edge instanceof(HatchArc)){
			let center = (edge as HatchArc).center;
			let r = (edge as HatchArc).radius;
			return {
					maxX: center.x+r,
					maxY: center.y+r,
					maxZ: 0,
					minX: center.x-r,
					minY: center.y-r,
					minZ: 0
				}
		}
		throw new Error("Edge type bounding box not implemented");
		
	}

	private static getHatchBBox(hatch: Hatch): BoundingBox {
		let bbox: BoundingBox = {
			maxX: Number.MIN_SAFE_INTEGER,
			maxY: Number.MIN_SAFE_INTEGER,
			maxZ: 0,
			minX: Number.MAX_SAFE_INTEGER,
			minY: Number.MAX_SAFE_INTEGER,
			minZ: 0
		}
		const boundPoints: Point3D[] =[];
		for(let b of hatch.boundaries){
			for(let pline of b.polylines){
				for(let v of pline.vertices)
					boundPoints.push(point(v.x, v.y))
			}

			for(let edge of b.edges.edges)
				bbox = this.maxBoundingBox([bbox, this.getHatchEdgeBBox(edge)]);

		}
		if(boundPoints.length>0){
			bbox = this.maxBoundingBox([bbox, this.calcBoundingBox(boundPoints)]);
		}

		return bbox;
	}

	public static drawBBox(modelSpace: EntitiesManager, bbox: BoundingBox) {
		const pline = modelSpace.addPolyline({
			flags: PolylineFlags.Closed
		});
		pline.add(point(bbox.minX, bbox.minY));
		pline.add(point(bbox.minX, bbox.maxY));
		pline.add(point(bbox.maxX, bbox.maxY));
		pline.add(point(bbox.maxX, bbox.minY));
	}

	public static getBoundingBox(entity: Entity): BoundingBox {
		if (entity instanceof (MText))
			return this.getMTextBBox(entity);
		if (entity instanceof (LWPolyline))
			return this.getLWPolylineBbox(entity);
		if (entity instanceof (Polyline))
			return this.getPolylineBbox(entity);
		if (entity instanceof (Circle))
			return this.getCircleBBox(entity);
		if (entity instanceof (Hatch))
			return this.getHatchBBox(entity);
		throw new Error("No bounding box method found for entity type");
		
	}

	public static getEntitiesBoundingBox(entities: Entity[]): BoundingBox {
		let bbox = this.getBoundingBox(entities[0]);
		for (let i = 1; i < entities.length; i++)
			bbox = this.maxBoundingBox([bbox, this.getBoundingBox(entities[i])]);
		return bbox;
	}

	public static getBoundingBoxSize(bbox: BoundingBox): number {
		return pointDistance(point(bbox.minX, bbox.minY), point(bbox.maxX, bbox.maxY));
	}

	public static getPoint(bbox: BoundingBox, bboxPoint: BoundingBoxPoint): Point3D {
		switch (bboxPoint) {
			case BoundingBoxPoint.TopLeft: return point(bbox.minX, bbox.maxY);
			case BoundingBoxPoint.TopCenter: return point((bbox.maxX+bbox.minX)/2, bbox.maxY);
			case BoundingBoxPoint.TopRight: return point(bbox.maxX, bbox.maxY);
			case BoundingBoxPoint.MidLeft: return point(bbox.minX, (bbox.maxY+bbox.minY)/2);
			case BoundingBoxPoint.Center: return point((bbox.maxX+bbox.minX)/2, (bbox.maxY+bbox.minY)/2);
			case BoundingBoxPoint.MidRight: return point(bbox.maxX, (bbox.maxY+bbox.minY)/2);
			case BoundingBoxPoint.BottomLeft: return point(bbox.minX, bbox.minY);
			case BoundingBoxPoint.BottomCenter: return point((bbox.maxX+bbox.minX)/2, bbox.minY);
			case BoundingBoxPoint.BottomRight: return point(bbox.maxX, bbox.minY);
		}
	}

	public static getTopLeft(bbox: BoundingBox): Point3D {
		return this.getPoint(bbox, BoundingBoxPoint.TopLeft);
	}

	public static getTopCenter(bbox: BoundingBox): Point3D {
		return this.getPoint(bbox, BoundingBoxPoint.TopCenter);
	}

	public static getTopRight(bbox: BoundingBox): Point3D {
		return this.getPoint(bbox, BoundingBoxPoint.TopRight);
	}

	public static getMidLeft(bbox: BoundingBox): Point3D {
		return this.getPoint(bbox, BoundingBoxPoint.MidLeft);
	}

	public static getCenter(bbox: BoundingBox): Point3D {
		return this.getPoint(bbox, BoundingBoxPoint.Center);
	}

	public static getMidRight(bbox: BoundingBox): Point3D{
		return this.getPoint(bbox, BoundingBoxPoint.MidRight);
	}

	public static getBottomLeft(bbox: BoundingBox): Point3D{
		return this.getPoint(bbox, BoundingBoxPoint.BottomLeft);
	}

	public static getBottomCenter(bbox: BoundingBox): Point3D{
		return this.getPoint(bbox, BoundingBoxPoint.BottomCenter);
	}

	public static getBottomRight(bbox: BoundingBox): Point3D{
		return this.getPoint(bbox, BoundingBoxPoint.BottomRight);
	}

	public static getHeight(bbox: BoundingBox): number {
		return bbox.maxY-bbox.minY;
	}

	public static getWidth(bbox: BoundingBox): number {
		return bbox.maxX-bbox.minX;
	}
}