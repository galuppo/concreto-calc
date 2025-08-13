import { AttachmentPoint, Circle, Colors, Entity, Hatch, MText, point, point2d, Point3D, Polyline, PolylineOptions, Seeder } from "../../../../../dxf-writer/lib";
import { BoundingBoxUtils } from "../../utils/bounding-box-utils";
import { EntityUtils } from "../../utils/entity-utils";
import { middlePoint, orthogonalVector, radToDegree, rotatePoints, unitaryVector } from "../../utils/geometry-utils";
import { roundUp } from "../../utils/number-utils";
import { AppDim, DimStyle } from "../dxf/elements/dimension/app-dim";
import { AppHatchFactory } from "../dxf/elements/hatches/app-hatches";
import { AppLayerNames } from "../dxf/elements/layers/app-layers";
import { Armadura } from "./models/armadura.model";
import { BarraDeAco } from "./models/barra-aco.model";
import { FormaArmadura, FormaArmaduraCircular, FormaArmaduraReta, isFormaCircular, isFormaReta } from "./models/forma-armadura.model";

export interface ArmaduraDetalhamentoOptions {
	seeder: Seeder,
	textHeight: number,
	layerName?: string,
}

export class ArmaduraDetalhamento {
	private options: ArmaduraDetalhamentoOptions;

	constructor(options: ArmaduraDetalhamentoOptions) {
		this.options = {
			seeder: options.seeder,
			textHeight: options.textHeight,
			layerName: options.layerName ?? AppLayerNames.ARMADURAS
		}
	}

	private criaTexto(text: string, iPoint: Point3D, rotation: number, colorNumber?: number): MText {
		return new MText({
			seeder: this.options.seeder,
			layerName: this.options.layerName,
			colorNumber: colorNumber,
			height: this.options.textHeight,
			insertionPoint: iPoint,
			rotation: (rotation > 90 && rotation <= 270) ? rotation + 180 : rotation,
			value: text,
			attachmentPoint: (rotation > 90 && rotation <= 270) ? AttachmentPoint.TopCenter : AttachmentPoint.BottomCenter
		});
	}

	private get textOffset(): number {
		return this.options.textHeight / 2;
	}

	private criaDetalheFormaArmaduraReta(forma: FormaArmaduraReta, colorNumber?: number): Entity[] {
		const result: Entity[] = [];

		const pLine = new Polyline({
			seeder: this.options.seeder,
			layerName: this.options.layerName,
			colorNumber: colorNumber
		});

		let start = point(0, 0);
		pLine.add(start);

		const origin = point(0, 0);
		let ang = 0;

		for (let i = 0; i < forma.segmentos.length; i++) {
			ang += forma.dobras[i] < 0 ? forma.dobras[i] + 360 : forma.dobras[i];
			ang = ang >= 360 ? ang - 360 : ang;
			const segmento = forma.segmentos[i];
			const vSeg = rotatePoints([point(segmento, 0)], origin, ang)[0];
			const end = point(start.x + vSeg.x, start.y + vSeg.y);

			if (forma.cotaSegmento[i]) {
				const midPoint = middlePoint(start, end);
				const uOrtho = orthogonalVector(unitaryVector(start, end));
				const coef = forma.cotaAcimaDoSegmento[i] ? 1 : -1;
				const iPoint = point(midPoint.x + uOrtho.x * coef * this.textOffset, midPoint.y + uOrtho.y * coef * this.textOffset);

				const mText = this.criaTexto(roundUp(segmento, 0).toString(), iPoint, ang);
				if (!forma.cotaAcimaDoSegmento[i])
					mText.attachmentPoint = ang > 90 && ang <= 270 ? AttachmentPoint.BottomCenter : AttachmentPoint.TopCenter

				result.push(mText);
			}
			pLine.add(end);
			start = end;

		}
		result.push(pLine);

		return result;
	}

	public criaDetalheFormaArmadura(forma: FormaArmadura, colorNumber?: number): Entity[] {
		if (isFormaReta(forma))
			return this.criaDetalheFormaArmaduraReta(forma, colorNumber);
		else if (isFormaCircular(forma))
			return this.criaDetalheFormaCircular(forma, colorNumber);

		throw new Error("Tipo da forma não identificado! (forma =" + forma + ")");
	}

	private criaDetalheFormaCircular(forma: FormaArmaduraCircular, colorNumber?: number): Entity[] {
		const ent: Entity[] = [];

		const circle = new Circle({
			seeder: this.options.seeder,
			center: point(),
			radius: forma.diametro / 2,
			layerName: AppLayerNames.ARMADURAS,
			colorNumber: colorNumber
		});

		ent.push(circle);

		if (forma.gancho > 0) {
			const ganchoOp: PolylineOptions = {
				seeder: this.options.seeder,
				layerName: AppLayerNames.ARMADURAS,
				colorNumber: colorNumber
			}

			const p1 = point(circle.radius - forma.gancho);
			const p2 = point(circle.radius);

			const gancho1 = new Polyline(ganchoOp);
			gancho1.add(p1);
			gancho1.add(p2);
			ent.push(gancho1);

			const gancho2 = new Polyline(ganchoOp);
			gancho2.add(p1);
			gancho2.add(p2);
			ent.push(gancho2);

			const rotAngle = radToDegree(Math.atan((forma.transpasse / 2) / circle.radius));
			EntityUtils.rotateEntity(gancho1, circle.center, rotAngle);
			EntityUtils.rotateEntity(gancho2, circle.center, -rotAngle);

			if (forma.cotaGancho) {
				const textGancho = new MText({
					seeder: this.options.seeder,
					layerName: AppLayerNames.ARMADURAS,
					colorNumber: colorNumber,
					height: this.options.textHeight,
					insertionPoint: middlePoint(p1, p2),
					attachmentPoint: AttachmentPoint.BottomCenter,
					value: forma.gancho.toString()
				});
				ent.push(textGancho);

				EntityUtils.moveEntity(textGancho, point(), point(0, this.textOffset/2));
				EntityUtils.rotateEntity(textGancho, circle.center, rotAngle);
			}
		}

		if(forma.cotaTranspasse){
			const textTranspasse = new MText({
					seeder: this.options.seeder,
					layerName: AppLayerNames.ARMADURAS,
					colorNumber: colorNumber,
					height: this.options.textHeight,
					insertionPoint: point(circle.radius+this.textOffset),
					attachmentPoint: AttachmentPoint.TopCenter,
					value: forma.transpasse.toString(),
					rotation: 90
				});
			ent.push(textTranspasse);
		}

		if(forma.cotaDiametro){
			const dimStyle: DimStyle = {
				textHeight: this.options.textHeight,
				arrowHeadSize: this.options.textHeight,
				layerName: AppLayerNames.ARMADURAS,
				colorNumber: colorNumber,
				lineWeight: -2,
				textOffsetFromDimline: this.textOffset,
				offsetDimensionLineFromReference: circle.radius + 2*this.textOffset,
				extensionLineGapFromReference: this.textOffset*2
			}
			const dim = new AppDim(this.options.seeder, dimStyle);
			const p1 = point(circle.center.x, circle.center.y + circle.radius);
			const p2 = point(p1.x, circle.center.y - circle.radius);
			const linDim = dim.linearDim([p2, p1], false, "Ø"+forma.diametro);
			linDim.forEach((e) => ent.push(e));
		}
		return ent;
	}

	public detalhaArmadura(armadura: Armadura): Entity[];
	public detalhaArmadura(armadura: Armadura, identHorz: boolean): Entity[];
	public detalhaArmadura(armadura: Armadura, identHorz?: boolean): Entity[] {

		identHorz = identHorz ?? true;

		const ent: Entity[] = [];
		let iPointId = point();
		if (armadura.forma) {
			const entForma = this.criaDetalheFormaArmadura(armadura.forma, armadura.numero);
			let bboxForma = BoundingBoxUtils.getBoundingBox(entForma[0]);
			for (let e of entForma) {
				ent.push(e);
				bboxForma = BoundingBoxUtils.maxBoundingBox([bboxForma, BoundingBoxUtils.getBoundingBox(e)]);
			}

			//posiciona o identificador no centro do detalhe da forma
			if (identHorz) {
				iPointId.x = (bboxForma.minX + bboxForma.maxX) / 2;
				iPointId.y = bboxForma.minY - this.options.textHeight / 2;
			} else {
				iPointId.x = bboxForma.maxX + this.options.textHeight / 2;
				iPointId.y = (bboxForma.minY + bboxForma.maxY) / 2;
			}
		}

		const mTextIdentificador = this.criaTexto(armadura.identificador, iPointId, 0, armadura.numero);
		mTextIdentificador.attachmentPoint = AttachmentPoint.TopCenter;
		mTextIdentificador.rotation = identHorz ? 0 : 90;

		ent.push(mTextIdentificador);
		return ent;
	}

	public cortaArmadura(barra: BarraDeAco, posicao: Point3D[], colorNumber?: number): Entity[] {
		const ent: Entity[] = [];
		for (let p of posicao) {
			ent.push(new Circle({
				seeder: this.options.seeder,
				center: p,
				radius: (barra.dmm / 20) * 1.04,
				layerName: this.options.layerName,
				colorNumber: colorNumber,
				lineWeight: 50 //0.5mm
			}));
			const hatch = new Hatch({
				seeder: this.options.seeder,
				fill: AppHatchFactory.Solid(colorNumber ?? Colors.White),
				layerName: this.options.layerName,
				colorNumber: colorNumber,
				lineWeight: 50 //0.5mm
			});
			hatch.add().arc({
				center: point2d(p.x, p.y),
				radius: (barra.dmm / 20) * 1.04,
				start: 0,
				end: 360
			});
			ent.push(hatch);
		}
		return ent;
	}

	public detalhaArmaduraCamadas(armadura: Armadura, nCamadas: number, start: Point3D, end: Point3D, horzCam: boolean): Entity[] {
		const points: Point3D[] = [];
		const nBarras = armadura.quantidade;
		const deltaX = end.x - start.x;
		const deltaY = end.y - start.y;
		const fPoint = point(start.x, start.y);
		const deltaCamada = (horzCam ? deltaY : deltaX) / (nCamadas > 1 ? nCamadas - 1 : 1);
		const deltaBarra = (horzCam ? deltaX : deltaY) / (nBarras > 1 ? nBarras - 1 : 1);
		for (let i = 0; i < nCamadas; i++) {
			fPoint.x = horzCam ? fPoint.x : fPoint.x + i * deltaCamada;
			fPoint.y = horzCam ? fPoint.y + i * deltaCamada : fPoint.y;
			for (let j = 0; j < nBarras; j++) {
				const p = point();
				p.x = horzCam ? fPoint.x + j * deltaBarra : fPoint.x;
				p.y = horzCam ? fPoint.y : fPoint.y + j * deltaBarra;
				points.push(p);
			}
		}

		return this.cortaArmadura(armadura.barra, points, armadura.numero);
	}

	public detalhaArmaduraSecaoCircular(armadura: Armadura, diametro: number, centro: Point3D, colorNumber?: number): Entity[] {
		const points: Point3D[] = [];
		const nBarras = armadura.quantidade;
		const delta = 360 / nBarras;
		const raio = armadura.barra.dmm / 20 * 1.04
		const fPoint = point(centro.x + ((diametro / 2) - raio), centro.y);

		for (let i = 0; i <= nBarras; i++) {
			const p = rotatePoints([fPoint], centro, delta * i)[0];
			points.push(p);
		}

		return this.cortaArmadura(armadura.barra, points, colorNumber ?? armadura.numero);
	}
}