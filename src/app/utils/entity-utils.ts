import { Arc, AttachmentPoint, Block, Circle, Entity, Hatch, HatchArc, HatchEdge, HatchEllipse, HatchLine, MText, point, Point3D, Polyline, Table, Vertex } from "../../../../dxf-writer/lib";
import { BoundingBoxPoint, BoundingBoxUtils } from "./bounding-box-utils";
import { findAngleDegree, mirrorPoints, movePoints, polarToCartesian, rotatePoints, unitaryVector } from "./geometry-utils";

export class EntityUtils {

	private static rotateVertices(vertices: Vertex[], refPoint: Point3D, angle: number) {
		for(let v of vertices){
			const pr = rotatePoints([point(v.x, v.y)], refPoint, angle)[0];
			v.x = pr.x;
			v.y = pr.y;
		}
	}

	private static moveVertices(vertices: Vertex[], start: Point3D, end: Point3D) {
		for(let v of vertices){
			const pm = movePoints([point(v.x, v.y)], start, end)[0];
			v.x = pm.x;
			v.y = pm.y;
		}
	}

	private static mirrorVertices(vertices: Vertex[], refP1: Point3D, refP2: Point3D){
		for(let v of vertices){
			const pm = mirrorPoints([point(v.x, v.y)], refP1, refP2)[0];
			v.x = pm.x;
			v.y = pm.y;
		}
	}

	private static rotateTable(table: Table, refPoint: Point3D, angle: number) {
		table.insertionPoint = rotatePoints([table.insertionPoint], refPoint, angle)[0];
	}

	private static moveTable(table: Table, origin: Point3D, destiny: Point3D) {
		table.insertionPoint = movePoints([table.insertionPoint], origin, destiny)[0];
	}

	private static mirrorTable(table: Table, refP1: Point3D, refP2: Point3D) {
		table.insertionPoint = mirrorPoints([table.insertionPoint], refP1, refP2)[0];
	}

	private static rotateArc(arc: Arc, refPoint: Point3D, angle: number) {
		arc.center = rotatePoints([arc.center], refPoint, angle)[0];
		
		const start = arc.startAngle + angle;
		const sMult = Math.trunc(start/360);
		arc.startAngle = start - 360*sMult;

		const end = arc.endAngle + angle;
		const eMult = Math.trunc(end/360);
		arc.endAngle = end - 360*eMult;
	}

	private static moveArc(arc: Arc, origin: Point3D, destiny: Point3D) {
		arc.center = movePoints([arc.center], origin, destiny)[0];
	}

	private static mirrorArc(arc: Arc, refP1: Point3D, refP2: Point3D) {
		const pStart = polarToCartesian(arc.center, arc.radius, arc.startAngle);
		const pEnd = polarToCartesian(arc.center, arc.radius, arc.endAngle);
		const mirPoints = mirrorPoints([arc.center, pStart, pEnd], refP1, refP2);
		
		arc.center = mirPoints[0];

		const uStart = unitaryVector(arc.center, mirPoints[2]);
		arc.startAngle = findAngleDegree(uStart.x, uStart.y);

		const uEnd = unitaryVector(arc.center, mirPoints[1]);
		arc.endAngle = findAngleDegree(uEnd.x, uEnd.y);
		
	}

	private static rotateMText(mText: MText, refPoint: Point3D, angle: number) {
		mText.insertionPoint = rotatePoints([mText.insertionPoint], refPoint, angle)[0];
		if(!mText.rotation)
			mText.rotation = angle;
		else
			mText.rotation += angle;
		if((mText.rotation > 90 && mText.rotation <= 270)){
			mText.rotation = mText.rotation + 180;
			switch(mText.attachmentPoint){
				case AttachmentPoint.BottomCenter: mText.attachmentPoint = AttachmentPoint.TopCenter; break;
				case AttachmentPoint.BottomLeft: mText.attachmentPoint = AttachmentPoint.TopLeft; break;
				case AttachmentPoint.BottomRight: mText.attachmentPoint = AttachmentPoint.TopRight; break;
				case AttachmentPoint.TopCenter: mText.attachmentPoint = AttachmentPoint.BottomCenter; break;
				case AttachmentPoint.TopLeft: mText.attachmentPoint = AttachmentPoint.BottomLeft; break;
				case AttachmentPoint.TopRight: mText.attachmentPoint = AttachmentPoint.BottomRight; break;
			}
		}
	}

	private static moveMText(mText: MText, origin: Point3D, destiny: Point3D) {
		mText.insertionPoint = movePoints([mText.insertionPoint], origin, destiny)[0];
	}
	
	private static mirrorMtext(mText: MText, refP1: Point3D, refP2: Point3D){
		mText.insertionPoint = mirrorPoints([mText.insertionPoint], refP1, refP2)[0];
	}

	private static moveCircle(circle: Circle, origin: Point3D, destiny: Point3D) {
		circle.center = movePoints([circle.center], origin, destiny)[0];
	}

	private static mirrorCircle(circle: Circle, refP1: Point3D, refP2: Point3D) {
		circle.center = mirrorPoints([circle.center], refP1, refP2)[0];
	}

	private static rotateCircle(circle: Circle,refPoint: Point3D, angle: number) {
		circle.center = rotatePoints([circle.center], refPoint, angle)[0];
	}

	private static moveHatchEdge(edge: HatchEdge, origin: Point3D, destiny: Point3D) {
		if(edge instanceof(HatchArc)){
			let center = (edge as HatchArc).center;
			center = movePoints([point(center.x, center.y)], origin, destiny)[0];
			(edge as HatchArc).center.x = center.x;
			(edge as HatchArc).center.y = center.y;
		} else if (edge instanceof(HatchEllipse)){
			let center = (edge as HatchEllipse).center;
			center = movePoints([point(center.x, center.y)], origin, destiny)[0];
			(edge as HatchEllipse).center.x = center.x;
			(edge as HatchEllipse).center.y = center.y;
			
			let endPoint = (edge as HatchEllipse).endpoint;
			endPoint = movePoints([point(endPoint.x, endPoint.y)], origin, destiny)[0];
			(edge as HatchEllipse).endpoint.x = endPoint.x;
			(edge as HatchEllipse).endpoint.y = endPoint.y;
		} else if (edge instanceof(HatchLine)){
			let start = (edge as HatchLine).start;
			start = movePoints([point(start.x, start.y)], origin, destiny)[0];
			(edge as HatchLine).start.x = start.x;
			(edge as HatchLine).start.y = start.y;

			let end = (edge as HatchLine).end;
			end = movePoints([point(end.x, end.y)], origin, destiny)[0];
			(edge as HatchLine).end.x = end.x;
			(edge as HatchLine).end.y = end.y;
		}
	}

	private static mirrorHatchEdge(edge: HatchEdge, refP1: Point3D, refP2: Point3D){
		if(edge instanceof(HatchArc)){
			let center = (edge as HatchArc).center;
			center = mirrorPoints([point(center.x, center.y)], refP1, refP2)[0];
			(edge as HatchArc).center.x = center.x;
			(edge as HatchArc).center.y = center.y;
		} else if (edge instanceof(HatchEllipse)){
			let center = (edge as HatchEllipse).center;
			center = mirrorPoints([point(center.x, center.y)], refP1, refP2)[0];
			(edge as HatchEllipse).center.x = center.x;
			(edge as HatchEllipse).center.y = center.y;
			
			let endPoint = (edge as HatchEllipse).endpoint;
			endPoint = mirrorPoints([point(endPoint.x, endPoint.y)], refP1, refP2)[0];
			(edge as HatchEllipse).endpoint.x = endPoint.x;
			(edge as HatchEllipse).endpoint.y = endPoint.y;
		} else if (edge instanceof(HatchLine)){
			let start = (edge as HatchLine).start;
			start = mirrorPoints([point(start.x, start.y)], refP1, refP2)[0];
			(edge as HatchLine).start.x = start.x;
			(edge as HatchLine).start.y = start.y;

			let end = (edge as HatchLine).end;
			end = mirrorPoints([point(end.x, end.y)], refP1, refP2)[0];
			(edge as HatchLine).end.x = end.x;
			(edge as HatchLine).end.y = end.y;
		}
	}

	private static moveHatch(hatch: Hatch, origin: Point3D, destiny: Point3D) {
		for(let b of hatch.boundaries){
			for(let pline of b.polylines){
				for(let v of pline.vertices){
					const vm = movePoints([point(v.x, v.y)], origin,destiny)[0];
					v.x = vm.x;
					v.y = vm.y;
				}				
			}

			for(let edge of b.edges.edges){
				this.moveHatchEdge(edge, origin, destiny);
			}
		}
	}

	private static mirrorHatch(hatch: Hatch, refP1: Point3D, refP2: Point3D) {
		for(let b of hatch.boundaries){
			for(let pline of b.polylines){
				for(let v of pline.vertices){
					const vm = mirrorPoints([point(v.x, v.y)], refP1, refP2)[0];
					v.x = vm.x;
					v.y = vm.y;
				}				
			}

			for(let edge of b.edges.edges){
				this.mirrorHatchEdge(edge, refP1, refP2);
			}
		}
	}

	private static rotateHatchEdge(edge: HatchEdge, refPoint: Point3D, angle: number) {
		if(edge instanceof(HatchArc)){
			let center = (edge as HatchArc).center;
			center = rotatePoints([point(center.x, center.y)], refPoint, angle)[0];
			(edge as HatchArc).center.x = center.x;
			(edge as HatchArc).center.y = center.y;
		} else if (edge instanceof(HatchEllipse)){
			let center = (edge as HatchEllipse).center;
			center = rotatePoints([point(center.x, center.y)], refPoint, angle)[0];
			(edge as HatchEllipse).center.x = center.x;
			(edge as HatchEllipse).center.y = center.y;
			
			let endPoint = (edge as HatchEllipse).endpoint;
			endPoint = rotatePoints([point(endPoint.x, endPoint.y)], refPoint, angle)[0];
			(edge as HatchEllipse).endpoint.x = endPoint.x;
			(edge as HatchEllipse).endpoint.y = endPoint.y;
		} else if (edge instanceof(HatchLine)){
			let start = (edge as HatchLine).start;
			start = rotatePoints([point(start.x, start.y)], refPoint, angle)[0];
			(edge as HatchLine).start.x = start.x;
			(edge as HatchLine).start.y = start.y;

			let end = (edge as HatchLine).end;
			end = rotatePoints([point(end.x, end.y)], refPoint, angle)[0];
			(edge as HatchLine).end.x = end.x;
			(edge as HatchLine).end.y = end.y;
		}
	}

	private static rotateHatch(hatch: Hatch, refPoint: Point3D, angle: number) {
		for(let b of hatch.boundaries){
			for(let pline of b.polylines){
				for(let v of pline.vertices){
					const vm = rotatePoints([point(v.x, v.y)], refPoint, angle)[0];
					v.x = vm.x;
					v.y = vm.y;
				}				
			}

			for(let edge of b.edges.edges){
				this.rotateHatchEdge(edge, refPoint, angle);
			}
		}
	}

	public static rotateEntity(entity: Entity, refPoint: Point3D, angle: number){
		if("vertices" in entity)
			this.rotateVertices(entity["vertices"] as Vertex[], refPoint, angle);
		else if(entity instanceof(MText))
			this.rotateMText(entity, refPoint, angle);
		else if (entity instanceof(Circle))
			this.rotateCircle(entity, refPoint, angle);
		else if(entity instanceof(Hatch))
			this.rotateHatch(entity, refPoint, angle);
		else if(entity instanceof(Table))
			this.rotateTable(entity, refPoint, angle);
		else if(entity instanceof(Arc))
			this.rotateArc(entity, refPoint, angle);
	}

	public static rotateEntities(entity: Entity[], refPoint: Point3D, angle: number){
		for(let e of entity)
			this.rotateEntity(e, refPoint, angle);
	}
	
	public static moveEntity(entity: Entity, origin: Point3D, destiny: Point3D){
		if("vertices" in entity)
			this.moveVertices(entity["vertices"] as Vertex[], origin, destiny);
		else if(entity instanceof(MText))
			this.moveMText(entity, origin, destiny);
		else if(entity instanceof(Circle))
			this.moveCircle(entity, origin, destiny);
		else if(entity instanceof(Hatch))
			this.moveHatch(entity, origin, destiny);
		else if(entity instanceof(Table))
			this.moveTable(entity, origin, destiny);
		else if(entity instanceof(Arc))
			this.moveArc(entity, origin, destiny);
	}

	public static moveEntities(entity: Entity[], origin: Point3D, destiny: Point3D){
		for(let e of entity)
			this.moveEntity(e, origin, destiny);
	}

	public static mirrorEntity(entity: Entity, refP1: Point3D, refP2: Point3D){
		if("vertices" in entity)
			this.mirrorVertices(entity["vertices"] as Vertex[], refP1, refP2);
		else if(entity instanceof(MText))
			this.mirrorMtext(entity, refP1, refP2);
		else if(entity instanceof(Circle))
			this.mirrorCircle(entity, refP1, refP2);
		else if(entity instanceof(Hatch))
			this.mirrorHatch(entity, refP1, refP2);
		else if(entity instanceof(Table))
			this.mirrorTable(entity, refP1, refP2);
		else if (entity instanceof(Arc))
			this.mirrorArc(entity, refP1, refP2);
	}

	public static mirrorEntities(entities: Entity[], refP1: Point3D, refP2: Point3D){
		for(let e of entities)
			this.mirrorEntity(e, refP1, refP2);
	}

	public static alignEntities(entities: Entity[], alignPoint: BoundingBoxPoint, entRef: Entity[], refPoint: BoundingBoxPoint, offSet?: Point3D){
		const bbox = BoundingBoxUtils.getEntitiesBoundingBox(entities);
		const refBbox = BoundingBoxUtils.getEntitiesBoundingBox(entRef);

		const pOri = BoundingBoxUtils.getPoint(bbox, alignPoint);
		const pDest = BoundingBoxUtils.getPoint(refBbox, refPoint);

		if(offSet){
			pDest.x += offSet.x;
			pDest.y += offSet.y;
		}

		this.moveEntities(entities, pOri, pDest);
	}




}