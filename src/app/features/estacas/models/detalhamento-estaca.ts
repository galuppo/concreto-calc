import { angle, Arc, ArcOptions, AttachmentPoint, bbox, BoundingBox, Circle, Colors, Entity, MText, point, Point3D, Polyline, Seeder } from "../../../../../../dxf-writer/lib";
import { BoundingBoxPoint, BoundingBoxUtils } from "../../../utils/bounding-box-utils";
import { EntityUtils } from "../../../utils/entity-utils";
import { findAngleDegree, middlePoint, pointDistance, unitaryVector } from "../../../utils/geometry-utils";
import { roundUp, roundUpMultiple } from "../../../utils/number-utils";
import { ArmaduraDetalhamento, ArmaduraDetalhamentoOptions } from "../../armaduras/armadura-detalhamento";
import { FormaArmaduraFactory } from "../../armaduras/forma-factory";
import { Armadura } from "../../armaduras/models/armadura.model";
import { BarrasDeAco } from "../../armaduras/models/barra-aco.model";
import { FormaArmaduraCircular } from "../../armaduras/models/forma-armadura.model";
import { ClassesConcreto, TipoAncoragem } from "../../concreto/models/concreto.model";
import { CotaDeNivel } from "../../dxf/elements/cota-de-nivel/cota-de-nivel";
import { AppDim } from "../../dxf/elements/dimension/app-dim";
import { ArrowHeadType } from "../../dxf/elements/dimension/arrow-head-factory";
import { AppLayerNames } from "../../dxf/elements/layers/app-layers";
import { Estaca } from "./estaca.model";

export class DetalhamentoEstaca {

	private seeder: Seeder;
	private model: Estaca;
	private _escala: number = 25;
	private armaduras: Armadura[] = [];

	constructor(seeder: Seeder) {
		this.seeder = seeder;
		this.model = {
			nome: 'E01',
			diametro: 30,
			comprimento: 500,
			cobrimento: 5,
			concreto: ClassesConcreto.C30,
			armLong: new Armadura({
				barra: BarrasDeAco.Ø10,
				numero: 1,
				quantidade: 6,
				forma: FormaArmaduraFactory.retaVertical(300)
			}),
			armEstribo: new Armadura({
				barra: BarrasDeAco.Ø5,
				numero: 2,
				quantidade: 1,
				espacamento: 15
			})
		}
	}

	public set escala(s: number) {
		this._escala = s;
	}

	public get escala(): number {
		return this._escala;
	}

	private get coefEscala(): number {
		return this._escala / 10;
	}

	private get maxLenght(): number {
		return 80*this.coefEscala; //10 cm
	}

	private getDefaultArmDetOptions(): ArmaduraDetalhamentoOptions {
		return {
			seeder: this.seeder,
			textHeight: 2 * this.coefEscala,
			layerName: AppLayerNames.ARMADURAS,
			maxLengthSize: this.maxLenght
		}
	}

	private criaTituloDetalhamento(multiplo: number): Entity[] {
		const titulo = new MText({
			seeder: this.seeder,
			height: 4 * this.coefEscala,
			insertionPoint: point(),
			value: this.model.nome,
			attachmentPoint: AttachmentPoint.TopLeft,
			layerName: AppLayerNames.TEXTOS
		});

		const mult = new MText({
			seeder: this.seeder,
			height: 2.5 * this.coefEscala,
			insertionPoint: point(),
			value: "(" + multiplo.toLocaleString("pt", { minimumIntegerDigits: 2 }) + "x)",
			attachmentPoint: AttachmentPoint.TopLeft,
			layerName: AppLayerNames.TEXTOS
		});

		const escala = new MText({
			seeder: this.seeder,
			height: 2 * this.coefEscala, //2.0mm
			insertionPoint: point(),
			value: "Escala 1:" + this._escala,
			attachmentPoint: AttachmentPoint.TopLeft,
			layerName: AppLayerNames.TEXTOS
		});

		EntityUtils.alignEntities([mult], BoundingBoxPoint.BottomLeft, [titulo], BoundingBoxPoint.BottomRight, point(2 * this.coefEscala));
		EntityUtils.alignEntities([escala], BoundingBoxPoint.TopLeft, [titulo], BoundingBoxPoint.BottomLeft, point(0, -2 * this.coefEscala));


		return [titulo, mult, escala];
	}

	private criaLinhaDeParada(p1: Point3D, p2: Point3D): Entity[] {
		const diam = pointDistance(p1, p2);
		const midPoint = middlePoint(p1, p2);
		const uVector = unitaryVector(p1, p2);
		const angle = findAngleDegree(uVector.x, uVector.y);

		const first = new Arc({
			seeder: this.seeder,
			center: point(),
			radius: diam / 2,
			startAngle: 240,
			endAngle: 300
		});
		const second = new Arc({
			seeder: this.seeder,
			center: point(),
			radius: diam / 2,
			startAngle: 240,
			endAngle: 300
		});
		const third = new Arc({
			seeder: this.seeder,
			center: point(),
			radius: diam / 2,
			startAngle: 60,
			endAngle: 120
		});

		const ent = [first, second, third];

		EntityUtils.alignEntities([second], BoundingBoxPoint.TopLeft, [first], BoundingBoxPoint.TopRight);
		EntityUtils.alignEntities([third], BoundingBoxPoint.BottomCenter, [second], BoundingBoxPoint.TopCenter);

		EntityUtils.moveEntities(ent, BoundingBoxUtils.getTopLeft(BoundingBoxUtils.getBoundingBox(first)), p1);
		EntityUtils.rotateEntities(ent, BoundingBoxUtils.getTopLeft(BoundingBoxUtils.getBoundingBox(first)), angle);


		return ent;
	}

	private criaCorteLongitudinal(): Entity[] {
		const ent: Entity[] = [];

		const gapInterrupcao: number = 15;

		const compEstaca = this.maxLenght*1.3;

		const pLineContorno = new Polyline({
			seeder: this.seeder,
			layerName: AppLayerNames.FORMAS,
			lineWeight: -2
		});
		ent.push(pLineContorno);

		pLineContorno.add(point(0, -compEstaca));
		pLineContorno.add(point());
		pLineContorno.add(point(this.model.diametro, 0));
		pLineContorno.add(point(this.model.diametro, -compEstaca));
		pLineContorno.add(point(0, -compEstaca));
		
		return ent;
	}

	private cotaTamanhoEstaca(bboxCorteLong: BoundingBox): Entity[] {
		const corteTopLeft = BoundingBoxUtils.getTopLeft(bboxCorteLong);
		const corteBotLeft = BoundingBoxUtils.getBottomLeft(bboxCorteLong);

		const dimStyle = AppDim.getDefaultStyle(this.coefEscala);
		dimStyle.arrowHead = ArrowHeadType.ArchTick;
		dimStyle.offsetDimensionLineFromReference = 4 * this.coefEscala;
		dimStyle.colorNumber = Colors.Green;
		dimStyle.arrowHeadSize = 3 * this.coefEscala;

		const dim = new AppDim(this.seeder, dimStyle);

		const compEstaca = (this.model.comprimento / 100) + " m";

		return dim.linearDim([corteBotLeft, corteTopLeft], false, compEstaca);

	}

	private criaN1(): Armadura {
		const n1 = new Armadura();

		n1.barra = this.model.armLong.barra;
		n1.forma = this.model.armLong.forma;
		n1.numero = 1;
		n1.quantidade = this.model.armLong.quantidade;
		return n1;
	}

	private getLbNecN1(): number {
		const lbNecN1 = this.model.concreto.comprimentoAncoragemNecessario({
			barra: this.model.armLong.barra,
			situacaoBoaAderencia: true,
			AsCalc: 1,
			AsEf: 1,
			tpAncoragem: TipoAncoragem.BarraReta
		});

		return roundUpMultiple(lbNecN1, 5);
	}

	private criaN2(): Armadura {
		const n2 = new Armadura();

		n2.barra = this.model.armEstribo.barra;
		n2.numero = 2;
		n2.espacamento = this.model.armEstribo.espacamento!;

		const compN1 = this.model.armLong.comprimento;
		n2.quantidade = roundUp((compN1 - this.getLbNecN1()) / n2.espacamento, 0) + 1;

		n2.forma = FormaArmaduraFactory.estriboCircular(this.model.diametro - 2 * this.model.cobrimento, 5, roundUp(Math.max(this.model.armEstribo.barra.dmm, 7),0));

		return n2;
	}

	private criaArmaduras() {
		this.armaduras = [
			this.criaN1(),
			this.criaN2()
		];
	}

	private criaArmadurasCorteLong(bboxCorte: BoundingBox): Entity[] {
		const ent: Entity[] = [];

		

		const forma = FormaArmaduraFactory.retaVertical(this.maxLenght);
		forma.cotaSegmento[0] = false;

		const lbNecN1 = this.getLbNecN1();

		const detArm = new ArmaduraDetalhamento(this.getDefaultArmDetOptions());

		const ferro1 = detArm.criaDetalheFormaArmadura(forma, 1);
		ferro1.forEach((e) => ent.push(e));

		const ferro2 = detArm.criaDetalheFormaArmadura(forma, 1);
		ferro2.forEach((e) => ent.push(e));

		const corteTopLeft = BoundingBoxUtils.getTopLeft(bboxCorte);
		const corteTopRight = BoundingBoxUtils.getTopRight(bboxCorte);

		const arranque = 25;

		EntityUtils.moveEntities(ferro1, point(), point(corteTopLeft.x + this.model.cobrimento, corteTopLeft.y - (this.maxLenght - arranque)));
		EntityUtils.moveEntities(ferro2, point(), point(corteTopRight.x - this.model.cobrimento, corteTopRight.y - (this.maxLenght - arranque)));


		//Cota as armaduras
		const ferro2Bbox = BoundingBoxUtils.getEntitiesBoundingBox(ferro2);
		const tR = BoundingBoxUtils.getTopRight(ferro2Bbox);

		const dimStyle = AppDim.getDefaultStyle(this.coefEscala);
		dimStyle.arrowHead = ArrowHeadType.ArchTick;
		dimStyle.arrowHeadSize = 3 * this.coefEscala;
		dimStyle.colorNumber = Colors.Green;
		dimStyle.offsetDimensionLineFromReference = 3 * this.coefEscala;

		const dim = new AppDim(this.seeder, dimStyle);

		const p1 = point(tR.x + this.model.cobrimento, tR.y);
		const p2 = point(p1.x, p1.y - arranque);
		const p3 = point(p1.x, p1.y - this.maxLenght);
		const d1 = dim.linearDim([p1, p2], false, lbNecN1.toString());
		d1.forEach((e) => ent.push(e));
		const bboxD1 = BoundingBoxUtils.getEntitiesBoundingBox(d1);

		const comp = this.armaduras[0].comprimento - lbNecN1;
		dim.linearDim([p2, p3], false, comp.toString()).forEach((e) => ent.push(e));

		//Cota N2
		const n2 = this.armaduras[1];
		dimStyle.colorNumber = 2;
		dimStyle.arrowHead = ArrowHeadType.OpenCirce;
		dimStyle.arrowHeadSize = 1 * this.coefEscala;
		dimStyle.offsetDimensionLineFromReference = 3 * this.coefEscala;
		dim.setCurrentStyle(dimStyle);
		const d2 = dim.linearDim([point(bboxD1.maxX, p2.y), point(bboxD1.maxX, p3.y)], false, n2.quantidade + " N2 c/ " + n2.espacamento! + " cm");
		d2.forEach((e) => ent.push(e));

		return ent;
	}

	private criaDetalheLongitudinal(): Entity[] {
		const ent: Entity[] = [];

		const corte = this.criaCorteLongitudinal();
		corte.forEach((e) => ent.push(e));

		const bboxCorte = BoundingBoxUtils.getEntitiesBoundingBox(corte);

		this.cotaTamanhoEstaca(bboxCorte).forEach((e) => ent.push(e));

		this.criaArmadurasCorteLong(bboxCorte).forEach((e) => ent.push(e));

		const cotaNivel = new CotaDeNivel(this.seeder);
		cotaNivel.setTextSize(2.5 * this.coefEscala);

		const cotaArrasa = cotaNivel.criaCotaDeNivel("Cota Arrasamento");
		cotaArrasa.forEach((e) => ent.push(e));

		EntityUtils.alignEntities(cotaArrasa, BoundingBoxPoint.BottomLeft, corte, BoundingBoxPoint.TopRight, point(10 * this.coefEscala));

		return ent;
	}

	private criaDetalheSecao(): Entity[] {
		const ent: Entity[] = [];

		//Contorno da seção de concreto
		const secao = new Circle({
			seeder: this.seeder,
			center: point(),
			radius: this.model.diametro / 2,
			layerName: AppLayerNames.FORMAS
		});
		ent.push(secao);

		//Armaduras longitudinais
		const detArm = new ArmaduraDetalhamento(this.getDefaultArmDetOptions());
		const armLong = detArm.detalhaArmaduraSecaoCircular(this.armaduras[0], this.model.diametro - 2 * this.model.cobrimento, point());
		armLong.forEach((e) => ent.push(e));

		//Estribos
		const n2 = this.criaN2();
		const n2Forma = n2.forma! as FormaArmaduraCircular
		n2Forma.cotaDiametro = false;
		n2Forma.cotaGancho = false;
		n2Forma.cotaTranspasse = false;
		const detEstribo = detArm.criaDetalheFormaArmadura(n2Forma, 2);
		detEstribo.forEach((e) => ent.push(e));

		//Cota
		const p1 = point(secao.center.x - secao.radius, secao.center.y);
		const p2 = point(p1.x + 2 * secao.radius, p1.y);

		const dimStyle = AppDim.getDefaultStyle(this.coefEscala);
		dimStyle.textHeight = this.getDefaultArmDetOptions().textHeight;
		dimStyle.extensionLineGapFromReference = 3 * this.coefEscala;
		dimStyle.offsetDimensionLineFromReference = (p1.y+secao.radius) + 1.5*this.coefEscala;
		dimStyle.textOffsetFromDimline = 0.5 * this.coefEscala;
		dimStyle.arrowHead = ArrowHeadType.ArchTick;
		dimStyle.arrowHeadSize = 3 * this.coefEscala;

		const dim = new AppDim(this.seeder, dimStyle);		
		const dimSecao = dim.linearDim([p1, p2], true, "Ø"+this.model.diametro);
		dimSecao.forEach((e) => ent.push(e));

		//Texto Armadura Longitudinal
		const mText = new MText({
			seeder: this.seeder,
			height: this.getDefaultArmDetOptions().textHeight,
			insertionPoint: point(),
			attachmentPoint: AttachmentPoint.TopCenter,
			value: this.model.armLong.quantidade+" N"+this.model.armLong.numero+" Ø"+this.model.armLong.barra.dmm.toLocaleString("pt", {minimumFractionDigits:1}),
			layerName: AppLayerNames.ARMADURAS,
			colorNumber: this.model.armLong.numero
		});
		ent.push(mText);
		EntityUtils.alignEntities([mText], BoundingBoxPoint.TopCenter, [secao], BoundingBoxPoint.BottomCenter, point(0, -1.5*this.coefEscala));

		return ent;
	}

	private criaDetalheEstribo(): Entity[] {
		const det = new ArmaduraDetalhamento(this.getDefaultArmDetOptions());

		const n2 = this.armaduras[1];
		const detEstribo = det.detalhaArmadura(n2);

		return detEstribo;
	}

	private criaDetalheArmaduraLongitudinal(): Entity[] {
		const det = new ArmaduraDetalhamento(this.getDefaultArmDetOptions());
		
		const n1 = this.armaduras[0];
		const detArmLong = det.detalhaArmadura(n1, false);

		return detArmLong;

	}

	public criaDetalhamento(estaca: Estaca, multiplo: number = 1): Entity[] {
		const ent: Entity[] = [];
		this.model = estaca;
		this.criaArmaduras();

		const titulo = this.criaTituloDetalhamento(multiplo);
		titulo.forEach((e) => ent.push(e));

		const detLong = this.criaDetalheLongitudinal();
		detLong.forEach((e) => ent.push(e));

		const detLongHeight = BoundingBoxUtils.getHeight(BoundingBoxUtils.getEntitiesBoundingBox(detLong));

		const detSecao = this.criaDetalheSecao();
		detSecao.forEach((e) => ent.push(e));

		const detEstribo = this.criaDetalheEstribo();
		detEstribo.forEach((e) => ent.push(e));

		const detArmLong = this.criaDetalheArmaduraLongitudinal();
		
		EntityUtils.alignEntities(detLong, BoundingBoxPoint.TopLeft, titulo, BoundingBoxPoint.BottomLeft, point(0, -10 * this.coefEscala));
		EntityUtils.alignEntities(detSecao, BoundingBoxPoint.TopLeft, detLong, BoundingBoxPoint.TopRight, point(1 * this.coefEscala, -(1/4)*detLongHeight));
		EntityUtils.alignEntities(detEstribo, BoundingBoxPoint.TopCenter, detSecao, BoundingBoxPoint.BottomCenter, point(0, -10*this.coefEscala));
		EntityUtils.alignEntities(detArmLong, BoundingBoxPoint.MidLeft, ent, BoundingBoxPoint.MidRight, point(10 * this.coefEscala));

		detArmLong.forEach((e) => ent.push(e));


		return ent;
	}

	public quantificaFerros(estaca: Estaca): Armadura[] {
		this.model = estaca;
		this.criaArmaduras();		
		return this.armaduras;
	}

	public quantificaConcreto(estaca: Estaca): number {
		const raio = estaca.diametro/100/2;
		const comp = estaca.comprimento/100;
		const area = 2*Math.PI*raio*raio;
		return area*comp;
	}

}