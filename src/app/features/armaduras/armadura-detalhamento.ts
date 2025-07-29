import { AttachmentPoint, Circle, Colors, Entity, Hatch, MText, point, point2d, Point3D, Polyline, Seeder } from "../../../../../dxf-writer/lib";
import { BoundingBoxUtils } from "../../utils/bounding-box-utils";
import { middlePoint, orthogonalVector, rotatePoints, unitaryVector } from "../../utils/geometry-utils";
import { roundUp } from "../../utils/number-utils";
import { AppHatchFactory } from "../dxf/elements/hatches/app-hatches";
import { AppLayerNames } from "../dxf/elements/layers/app-layers";
import { Armadura } from "./models/armadura.model";
import { BarraDeAco } from "./models/barra-aco.model";
import { FormaArmadura } from "./models/forma-armadura.model";

export interface ArmaduraDetalhamentoOptions {
	seeder: Seeder,
	textHeight: number,
	layerName?: string,
}

export class ArmaduraDetalhamento {
	private options: ArmaduraDetalhamentoOptions;

	constructor(options: ArmaduraDetalhamentoOptions){
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
			rotation: (rotation > 90 && rotation <= 270) ? rotation+180 : rotation,
			value: text,
			attachmentPoint: (rotation > 90 && rotation <= 270) ? AttachmentPoint.TopCenter : AttachmentPoint.BottomCenter
		});
	}


	public criaDetalheFormaArmadura(forma: FormaArmadura, colorNumber?: number): Entity[] {
		const result: Entity[] = [];
		
		const pLine = new Polyline({
			seeder: this.options.seeder,
			layerName: this.options.layerName,
			colorNumber: colorNumber
		});
		
		let start = point(0,0);
		pLine.add(start);

		const origin = point(0,0);
		let ang = 0;

		const textOffset = this.options.textHeight/2;

		for(let i = 0; i < forma.segmentos.length; i++){
			ang += forma.dobras[i] < 0 ? forma.dobras[i]+360 : forma.dobras[i];
			ang = ang>=360 ? ang-360 : ang;
			const segmento = forma.segmentos[i];
			const vSeg = rotatePoints([point(segmento, 0)], origin, ang)[0];
			const end = point(start.x+vSeg.x, start.y+vSeg.y);

			if(forma.cotaSegmento[i]){
				const midPoint = middlePoint(start, end);
				const uOrtho = orthogonalVector(unitaryVector(start, end));
				const coef = forma.cotaAcimaDoSegmento[i] ? 1 : -1;
				const iPoint = point(midPoint.x + uOrtho.x*coef*textOffset, midPoint.y + uOrtho.y*coef*textOffset);

				const mText = this.criaTexto(roundUp(segmento,0).toString(), iPoint, ang);
				if(!forma.cotaAcimaDoSegmento[i])
					mText.attachmentPoint = ang > 90 && ang <= 270? AttachmentPoint.BottomCenter : AttachmentPoint.TopCenter

				result.push(mText);
			}
			pLine.add(end);
			start = end;
			
		}	
		result.push(pLine);

		return result;
	}

	public detalhaArmadura(armadura: Armadura): Entity[];
	public detalhaArmadura(armadura: Armadura, identHorz: boolean): Entity[];
	public detalhaArmadura(armadura: Armadura, identHorz?: boolean): Entity[] {
		
		identHorz = identHorz ?? true;
		
		const ent: Entity[] = [];
		let iPointId = point();
		if(armadura.forma){
			const entForma = this.criaDetalheFormaArmadura(armadura.forma, armadura.numero);
			let bboxForma = BoundingBoxUtils.getBoundingBox(entForma[0]);
			for(let e of entForma){
				ent.push(e);
				bboxForma = BoundingBoxUtils.maxBoundingBox([bboxForma, BoundingBoxUtils.getBoundingBox(e)]);
			}
			
			//posiciona o identificador no centro do detalhe da forma
			if(identHorz){
				iPointId.x = (bboxForma.minX+bboxForma.maxX)/2;
				iPointId.y = bboxForma.minY-this.options.textHeight/2;
			} else {
				iPointId.x = bboxForma.maxX+this.options.textHeight/2;
				iPointId.y = (bboxForma.minY+bboxForma.maxY)/2;
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
		for(let p of posicao){
			ent.push(new Circle({
				seeder: this.options.seeder,
				center: p,
				radius: (barra.dmm/20)*1.04,
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
				radius: (barra.dmm/20)*1.04,
				start: 0,
				end: 360
			});
			ent.push(hatch);
		}			
		return ent;
	}

	public detalhaArmaduraEmCorte(armadura: Armadura, nCamadas: number, start: Point3D, end: Point3D, horzCam: boolean): Entity[] {
		const points: Point3D[]=[];
		const nBarras = armadura.quantidade;
		const deltaX = end.x-start.x;
		const deltaY = end.y-start.y;
		const fPoint = point(start.x, start.y);
		const deltaCamada = (horzCam ? deltaY : deltaX)/(nCamadas > 1 ? nCamadas-1 : 1);
		const deltaBarra = (horzCam ? deltaX : deltaY)/(nBarras > 1? nBarras-1: 1);
		for(let i = 0; i < nCamadas; i++){
			fPoint.x = horzCam ? fPoint.x : fPoint.x+i*deltaCamada;
			fPoint.y = horzCam ? fPoint.y+i*deltaCamada : fPoint.y;
			for(let j = 0; j < nBarras; j++){
				const p = point();
				p.x = horzCam ? fPoint.x+j*deltaBarra : fPoint.x;
				p.y = horzCam ? fPoint.y : fPoint.y+j*deltaBarra;
				points.push(p);
			}
		}

		return this.cortaArmadura(armadura.barra, points, armadura.numero);
	}
}