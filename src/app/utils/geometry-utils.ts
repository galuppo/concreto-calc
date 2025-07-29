import { BoundingBox, Point, point, Point3D } from "../../../../dxf-writer/lib";

export function radToDegree(rad: number): number {
	return rad * 180 / Math.PI;
}

export function degreeToRad(degree: number): number {
	return degree * Math.PI / 180;
}

export function findAngleDegree(x: number, y: number): number {
	const ang = radToDegree(Math.atan(y / x));
	const xPositive = x >= 0;
	const yPositive = y >= 0;

	//1º quadrante
	if (xPositive && yPositive)
		return ang;
	//2º ou 3º quadrante
	if (!xPositive)
		return 180 + ang
	//4º quadrante
	return 360 + ang;

}

export function pointDistance(p1: Point3D, p2: Point3D): number {
	const xDif = p2.x-p1.x;
	const yDif = p2.y-p1.y;
	return Math.sqrt(xDif*xDif+yDif*yDif);
}

export function rotatePoints(points: Point3D[], refPoint: Point3D, angleDeg: number): Point3D[] {
	const result: Point3D[] = [];
	const angRad = degreeToRad(angleDeg);
	const cosAng = Math.cos(angRad);
	const sinAng = Math.sin(angRad);
	for(let p of points){
		const v: Point3D = {
			z: 0,
			x: p.x - refPoint.x,
			y: p.y - refPoint.y
		};

		const rp: Point3D = {
			z: 0,
			x: v.x*cosAng - v.y*sinAng,
			y: v.y*cosAng + v.x*sinAng
		};

		result.push({
			z: 0,
			x: refPoint.x+rp.x,
			y: refPoint.y+rp.y
		});
	}
	return result;

}

export function movePoints(points: Point3D[], origin: Point3D, destiny: Point3D): Point3D[] {
	const result: Point3D[] = [];
	const vDir = point(destiny.x-origin.x, destiny.y-origin.y);

	for(let p of points)
		result.push(point(p.x+vDir.x, p.y+vDir.y));

	return result;
}

export function mirrorPoints(points: Point3D[], refOri: Point3D, refEnd: Point3D): Point3D[] {
	//referência https://stackoverflow.com/questions/8954326/how-to-calculate-the-mirror-point-along-a-line/56793745#56793745
	const vx = refEnd.x-refOri.x;
	const vy = refEnd.y-refOri.y;

	const r = 1/(vx*vx + vy*vy);

	const result: Point3D[] =[];
	for(let q of points){
		const x = refOri.x-q.x;
		const y = refOri.y-q.y;

		const mir = point();
		mir.x = q.x + 2*(x -x*vx*vx*r -y*vx*vy*r);
		mir.y = q.y + 2*(y -y*vy*vy*r -x*vx*vy*r);

		result.push(mir);
	}

	return result;

}

export function directionVector(start: Point3D, end: Point3D): Point3D {
	return point(end.x-start.x, end.y-start.y);
}

export function unitaryVector(start: Point3D, end: Point3D): Point3D {
	const vDir = directionVector(start, end);
	const mod = pointDistance(start, end);
	return point(vDir.x/mod, vDir.y/mod);
}

export function orthogonalVector(vector: Point3D): Point3D {
	return point(-vector.y, vector.x)
}

export function middlePoint(p1: Point3D, p2: Point3D): Point3D {
	const vDir = directionVector(p1, p2);
	return point(p1.x + 0.5*vDir.x, p1.y + 0.5*vDir.y);
}
