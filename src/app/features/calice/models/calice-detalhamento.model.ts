import { BoundingBox, Entity, Hatch, HatchPolyline, MText, point, Point3D, Polyline, PolylineFlags, Seeder } from "../../../../../../dxf-writer/lib";
import { BoundingBoxPoint, BoundingBoxUtils } from "../../../utils/bounding-box-utils";
import { EntityUtils } from "../../../utils/entity-utils";
import { directionVector, middlePoint, orthogonalVector, unitaryVector } from "../../../utils/geometry-utils";
import { round, roundUp } from "../../../utils/number-utils";
import { ArmaduraDetalhamento, ArmaduraDetalhamentoOptions } from "../../armaduras/armadura-detalhamento";
import { ArmaduraQuantitativo } from "../../armaduras/armadura-quantitativo";
import { FormaArmaduraFactory } from "../../armaduras/forma-factory";
import { Armadura } from "../../armaduras/models/armadura.model";
import { FormaArmadura, FormaArmaduraReta } from "../../armaduras/models/forma-armadura.model";
import { ClassesConcreto, TipoAncoragem } from "../../concreto/models/concreto.model";
import { AppDim } from "../../dxf/elements/dimension/app-dim";
import { ArrowHeadType } from "../../dxf/elements/dimension/arrow-head-factory";
import { AppHatchFactory } from "../../dxf/elements/hatches/app-hatches";
import { AppLayerNames } from "../../dxf/elements/layers/app-layers";
import { SectionMark } from "../../dxf/elements/section/section-mark";
import { Calice } from "./calice.model";

export class CaliceDetalhamento {
	private model: Calice;
	private seeder: Seeder;
	private _scale: number = 25; //1:25
	private prolongamentoCalice: number = 40;
	private prolongamentoPilar: number = 20;
	private defaultDetOp: ArmaduraDetalhamentoOptions;
	private armaduras: Armadura[] = [];


	//Este detalhamento considera que o desenho será representado em cm
	constructor(seeder: Seeder) {
		const c: Calice = {
			nome: "",
			pilarX: 0,
			pilarY: 0,
			espessuraColarinho: 0,
			espessuraJunta: 0,
			embutimento: 0,
			cobExterno: 0,
			cobInterno: 0,
			concreto: ClassesConcreto.C20,
			armHorzPrincipal: undefined,
			armHorzSecundaria: undefined,
			armVertPrincipal: undefined,
			armVertSecundaria: undefined
		};
		this.model = c;
		this.seeder = seeder;
		this.defaultDetOp = {
			seeder: this.seeder,
			textHeight: 2 * this.scaleCoef,
			layerName: AppLayerNames.ARMADURAS,

		}
	}

	public set scale(scl: number) {
		this._scale = scl;
		this.defaultDetOp.textHeight = 2 * this.scaleCoef;
	}

	private get scaleCoef(): number {
		return this.scale / 10;
	}

	public get scale(): number {
		return this._scale;
	}

	private get margemFormas(): number {
		return 5 * this.scaleCoef;
	}

	private get margemArmaduras(): number {
		return 10 * this.scaleCoef;
	}

	private get margemTitulo(): number {
		return 2 * this.scaleCoef;
	}

	private criaSecaoTitulo(multiplo: number): Entity[] {
		const ent: Entity[] =[];
		const margin: number = 2 * this.scaleCoef; //mm

		const mText1 = new MText({
			seeder: this.seeder,
			height: 3 * this.scaleCoef, //3.0mm
			insertionPoint: point(),
			value: this.model.nome,
			attachmentPoint: 1,
			layerName: AppLayerNames.TEXTOS
		});
		ent.push(mText1);

		const mText2 = new MText({
			seeder: this.seeder,
			height: 2 * this.scaleCoef, //2.0mm
			insertionPoint: point(),
			value: "Escala 1:" + this.scale,
			attachmentPoint: 1,
			layerName: AppLayerNames.TEXTOS
		});
		ent.push(mText2);

		const mText3 = new MText({
			seeder: this.seeder,
			height: 2 * this.scaleCoef, //2.0mm
			insertionPoint: point(),
			value: "(x"+multiplo.toLocaleString("pt", {minimumIntegerDigits: 2})+")",
			attachmentPoint: 1,
			layerName: AppLayerNames.TEXTOS
		});
		ent.push(mText3);
		
		EntityUtils.alignEntities([mText2], BoundingBoxPoint.TopLeft, [mText1], BoundingBoxPoint.BottomLeft, point(0, -margin));
		EntityUtils.alignEntities([mText3], BoundingBoxPoint.BottomLeft, [mText1], BoundingBoxPoint.BottomRight, point(margin));

		return ent;
	}

	private criaSecaoPilar(): Entity[] {
		const ent: Entity[] = []

		const secao = new Polyline({
			seeder: this.seeder,
			flags: PolylineFlags.Closed,
			layerName: AppLayerNames.FORMAS,
			lineWeight: -3 //standart
		});
		ent.push(secao);

		const vertices = [
			point(0,0),
			point(this.model.pilarX, 0),
			point(this.model.pilarX, -this.model.pilarY),
			point(0, -this.model.pilarY)
		]

		const hatch = new Hatch({
			seeder: this.seeder,
			fill: AppHatchFactory.LinhasParalelas(45, 5),
			layerName: secao.layerName,
			lineWeight: secao.lineWeight
		});

		const hatchPolyline = new HatchPolyline({ isClosed: true });
		for (let v of vertices){
			hatchPolyline.add(v);
			secao.add(v);
		}
			
		hatch.add().polyline(hatchPolyline);
		ent.push(hatch);

		const dimStyle = AppDim.getDefaultStyle(this.scaleCoef);
		dimStyle.precisionDigits = 0;
		dimStyle.textHeight = 2 * this.scaleCoef;
		dimStyle.supressDimensionLine = true;
		dimStyle.supressExtensionLine = true;
		dimStyle.offsetDimensionLineFromReference = 0.1;
		dimStyle.textOffsetFromDimline = 0.1;

		const dim = new AppDim(this.seeder, dimStyle);
		dim.linearDim([vertices[3], vertices[2]], true).forEach((e) => ent.push(e));
		dim.linearDim([vertices[2], vertices[1]], false).forEach((e) => ent.push(e));

		return ent;
	}

	private criaSecaoColarinho(): Entity[] {

		//Cria o retângulo externo
		let largura = 2 * (this.model.espessuraColarinho + this.model.espessuraJunta) + this.model.pilarX;
		let altura = 2 * (this.model.espessuraColarinho + this.model.espessuraJunta) + this.model.pilarY;
		const re = new Polyline({
			seeder: this.seeder,
			layerName: AppLayerNames.FORMAS,
			flags: PolylineFlags.Closed
		});
		re.add(point(0, 0));
		re.add(point(largura, 0));
		re.add(point(largura, -altura));
		re.add(point(0, -altura));

		//Cria o retângulo interno
		largura = 2 * this.model.espessuraJunta + this.model.pilarX;
		altura = 2 * this.model.espessuraJunta + this.model.pilarY;
		const ri = new Polyline({
			seeder: this.seeder,
			layerName: AppLayerNames.FORMAS,
			flags: PolylineFlags.Closed
		});
		const p0 = point(this.model.espessuraColarinho, - this.model.espessuraColarinho);
		ri.add(p0);
		ri.add(point(p0.x + largura, p0.y));
		ri.add(point(p0.x + largura, p0.y - altura));
		ri.add(point(p0.x, p0.y - altura));

		return [re, ri];
	}

	private cotaSecaoEmPlanta(bboxCalice: BoundingBox): Entity[] {

		const dimStyle = AppDim.getDefaultStyle(this.scaleCoef);
		dimStyle.offsetDimensionLineFromReference = 3 * this.scaleCoef;
		const dim = new AppDim(this.seeder, dimStyle);

		const ent: Entity[] = [];

		//Pontos de referência
		const topLeft = BoundingBoxUtils.getTopLeft(bboxCalice);
		const botLeft = BoundingBoxUtils.getBottomLeft(bboxCalice);
		const topRight = BoundingBoxUtils.getTopRight(bboxCalice);
		const botRight = BoundingBoxUtils.getBottomRight(bboxCalice);

		//Cotas Horizontais
		let dimPoints: Point3D[] = [];
		
		let p = topLeft;
		dimPoints.push(p);

		p = point(p.x + this.model.espessuraColarinho, p.y);
		dimPoints.push(p);

		p = point(p.x + this.model.espessuraJunta, p.y);
		dimPoints.push(p);

		p = point(p.x + this.model.pilarX, p.y);
		dimPoints.push(p);

		p = point(p.x + this.model.espessuraJunta, p.y);
		dimPoints.push(p);

		p = point(p.x + this.model.espessuraColarinho, p.y);
		dimPoints.push(p);

		dim.linearDim(dimPoints, true).forEach((e) => ent.push(e));

		
		//Cotas Verticais
		dimPoints = [];
		p = botLeft;
		dimPoints.push(p);

		p = point(p.x, p.y + this.model.espessuraColarinho);
		dimPoints.push(p);

		p = point(p.x, p.y + this.model.espessuraJunta);
		dimPoints.push(p);

		p = point(p.x, p.y + this.model.pilarY);
		dimPoints.push(p);

		p = point(p.x, p.y + this.model.espessuraJunta);
		dimPoints.push(p);

		p = point(p.x, p.y + this.model.espessuraColarinho);
		dimPoints.push(p);
		dim.linearDim(dimPoints, false).forEach((e) => ent.push(e));

		//Cotas Gerais Horizontais
		dimPoints = [];
		p = point(botRight.x - this.model.espessuraColarinho, botRight.y);
		dimPoints.push(p);

		p = point(botLeft.x + this.model.espessuraColarinho, p.y);
		dimPoints.push(p);

		let entDim = dim.linearDim(dimPoints, true);
		entDim.forEach((e) => ent.push(e));

		let bboxDim = BoundingBoxUtils.getEntitiesBoundingBox(entDim);

		dimPoints = [];
		p = point(botRight.x, bboxDim.minY);
		dimPoints.push(p);

		p = point(botLeft.x, bboxDim.minY);
		dimPoints.push(p);

		dim.linearDim(dimPoints, true).forEach((e) => ent.push(e));

		//Cotas Gerais Verticais
		dimPoints = [];
		p = point(topRight.x, topRight.y - this.model.espessuraColarinho);
		dimPoints.push(p);

		p = point(p.x, botRight.y + this.model.espessuraColarinho);
		dimPoints.push(p);

		entDim = dim.linearDim(dimPoints, false);
		entDim.forEach((e) => ent.push(e));

		bboxDim = BoundingBoxUtils.getEntitiesBoundingBox(entDim);

		dimPoints = [];
		p = point(bboxDim.maxX, topRight.y);
		dimPoints.push(p);

		p = point(p.x, botRight.y);
		dimPoints.push(p);

		dim.linearDim(dimPoints, false).forEach((e) => ent.push(e));

		return ent;
	}

	private cotaFormaCorte(iPoint: Point3D, larguraPilar: number): Entity[] {
		const ent: Entity[] = [];
		const dimStyle = AppDim.getDefaultStyle(this.scaleCoef);
		dimStyle.offsetDimensionLineFromReference = 3 * this.scaleCoef;
		const dim = new AppDim(this.seeder, dimStyle);

		let dimPoints = [];
		//Cota do topo do cálice	
		let p = iPoint
		dimPoints.push(p);

		p = point(p.x + this.model.espessuraColarinho, p.y);
		dimPoints.push(p);

		p = point(p.x + this.model.espessuraJunta, p.y);
		dimPoints.push(p);

		p = point(p.x + larguraPilar, p.y);
		dimPoints.push(p);

		p = point(p.x + this.model.espessuraJunta, p.y);
		dimPoints.push(p);

		p = point(p.x + this.model.espessuraColarinho, p.y);
		dimPoints.push(p);

		dim.linearDim(dimPoints, true).forEach((e) => ent.push(e));

		dimPoints = [];
		//Cota do fundo do cálice	
		p = point(
			iPoint.x + this.model.espessuraColarinho + 2 * this.model.espessuraJunta + larguraPilar - (this.model.espessuraJunta - 5),
			iPoint.y - (this.model.embutimento + 5)
		);
		dimPoints.push(p);

		p = point(p.x - 5, p.y + 5);
		dimPoints.push(p);

		p = point(p.x - larguraPilar, p.y);
		dimPoints.push(p);

		p = point(p.x - 5, p.y - 5);
		dimPoints.push(p);
		dim.linearDim(dimPoints, true).forEach((e) => ent.push(e));

		//Cotas do embutimento
		dimPoints = [];
		p = point(
			iPoint.x + this.model.espessuraColarinho + (this.model.espessuraJunta - 5),
			iPoint.y - this.model.embutimento - 5
		);
		dimPoints.push(p);

		p = point(p.x + 5, p.y + 5);
		dimPoints.push(p);

		p = point(p.x - this.model.espessuraJunta, p.y + this.model.embutimento);
		dimPoints.push(p);

		dim.linearDim(dimPoints, false).forEach((e) => ent.push(e));
		return ent;
	}

	private criaLinhaDeCorte(start: Point3D, end: Point3D, title: string): Entity[] {
		const sectionMark = new SectionMark({
			scale: this.scale,
			headSize: 2.5 * 1.6,
			seeder: this.seeder,
			textSize: 2.5
		});

		return sectionMark.buildSectionMark(start, end, title);
	}

	private detalhaFormaSecao(): Entity[] {

		const ent: Entity[] = [];

		const pilar = this.criaSecaoPilar();
		pilar.forEach((e)=> ent.push(e));

		const calice = this.criaSecaoColarinho();
		calice.forEach((e)=> ent.push(e));
		
		EntityUtils.alignEntities(pilar, BoundingBoxPoint.Center, calice, BoundingBoxPoint.Center);

		const bboxCalice = BoundingBoxUtils.getEntitiesBoundingBox(calice);

		const cotas = this.cotaSecaoEmPlanta(bboxCalice);
		cotas.forEach((e)=> ent.push(e));
		
		let bboxSecao = BoundingBoxUtils.maxBoundingBox([bboxCalice, BoundingBoxUtils.getEntitiesBoundingBox(cotas)]);
		const midLeft = BoundingBoxUtils.getMidLeft(bboxSecao);
		const midRight = BoundingBoxUtils.getMidRight(bboxSecao);
		const midTop = BoundingBoxUtils.getTopCenter(bboxSecao);
		const midBot = BoundingBoxUtils.getBottomCenter(bboxSecao);


		const margemLinhaDeCorte = 4 * this.scaleCoef;
		const linCorteA = this.criaLinhaDeCorte(
			point(midLeft.x - margemLinhaDeCorte, midLeft.y),
			point(midRight.x + margemLinhaDeCorte, midRight.y),
			"A"
		);
		linCorteA.forEach((e)=>ent.push(e));

		const linCorteB = this.criaLinhaDeCorte(
			point(midTop.x, midTop.y + margemLinhaDeCorte),
			point(midBot.x, midBot.y - margemLinhaDeCorte),
			"B"
		);
		linCorteB.forEach((e)=>ent.push(e));

		bboxSecao = BoundingBoxUtils.getEntitiesBoundingBox(ent);


		const margemTexto = 0 * this.scaleCoef;
		const mTextTit = new MText({
			seeder: this.seeder,
			height: 2.5 * this.scaleCoef, //2.5mm
			insertionPoint: point(bboxSecao.minX + margemTexto, bboxSecao.minY - margemTexto),
			value: "Em Planta",
			attachmentPoint: 1,
			layerName: AppLayerNames.TEXTOS
		})
		ent.push(mTextTit);
		return ent;
	}

	private criaLinhaDeParada(start: Point3D, end: Point3D): Polyline {
		const vDir = directionVector(start, end);
		const u = unitaryVector(start, end);
		const uOrtho = orthogonalVector(u);
		const midPoint = middlePoint(start, end);

		const pline = new Polyline({
			seeder: this.seeder
		});

		pline.add(point(start.x - 5 * u.x, start.y - 5 * u.y));
		pline.add(point(midPoint.x - 2.5 * u.x, midPoint.y - 2.5 * u.y));
		pline.add(point(midPoint.x + 5 * uOrtho.x, midPoint.y + 5 * uOrtho.y));
		pline.add(point(midPoint.x - 5 * uOrtho.x, midPoint.y - 5 * uOrtho.y));
		pline.add(point(midPoint.x + 2.5 * u.x, midPoint.y + 2.5 * u.y));
		pline.add(point(end.x + 5 * u.x, end.y + 5 * u.y));


		return pline;
	}

	private criaCortePilar(largura: number): Entity[] {
		const plinePilar = new Polyline({
			seeder: this.seeder,
			layerName: AppLayerNames.FORMAS,
			lineWeight: -3
		})
		
		let p = point();
		plinePilar.add(p);

		p.y -= this.prolongamentoPilar + this.model.embutimento;
		plinePilar.add(p);

		p.x += largura;
		plinePilar.add(p);

		p.y += this.prolongamentoPilar + this.model.embutimento;
		plinePilar.add(p);

		const linhaParada = this.criaLinhaDeParada(point(), point(largura));
		linhaParada.layerName = plinePilar.layerName;
		linhaParada.lineWeight = plinePilar.lineWeight;
	
		return [plinePilar,linhaParada];
	}

	private criaCorteCalice(larguraPilar: number, comLinhaDeParada: boolean): Entity[] {
		const ent: Entity[] = [];


		const plineCalice = new Polyline({
			seeder: this.seeder,
			layerName: AppLayerNames.FORMAS
		});

		ent.push(plineCalice);


		const start = point(0, -(this.model.embutimento + 5 + this.prolongamentoCalice));
		const end = point(start.x + larguraPilar + 2 * (this.model.espessuraColarinho + this.model.espessuraJunta), start.y);
		if (comLinhaDeParada) {
			const linhaParada = this.criaLinhaDeParada(start, end);
			linhaParada.layerName = plineCalice.layerName;
			ent.push(linhaParada);
		}


		plineCalice.add(start);

		const p = point(start.x, start.y + this.prolongamentoCalice + this.model.embutimento + 5);
		plineCalice.add(p);

		p.x += this.model.espessuraColarinho;
		plineCalice.add(p);

		p.x += this.model.espessuraJunta - 5;
		p.y -= (this.model.embutimento + 5);
		plineCalice.add(p);

		p.x += 5 + larguraPilar + 5;
		plineCalice.add(p);

		p.y += this.model.embutimento + 5;
		p.x += this.model.espessuraJunta - 5;
		plineCalice.add(p);

		p.x += this.model.espessuraColarinho;
		plineCalice.add(p);

		plineCalice.add(end);

		return ent;
	}

	private detalhaFormaCorteA(): Entity[] {
		const ent: Entity[] = [];
		
		const cortePilar = this.criaCortePilar(this.model.pilarX);
		cortePilar.forEach((e)=>ent.push(e));

		EntityUtils.moveEntities(cortePilar, point(), point(this.model.espessuraColarinho+this.model.espessuraJunta, this.prolongamentoPilar));

		const corteCalice = this.criaCorteCalice(this.model.pilarX, true);
		corteCalice.forEach((e)=> ent.push(e));

		this.cotaFormaCorte(point(), this.model.pilarX).forEach((e) => ent.push(e));

		const margemTexto = 0 * this.scaleCoef;
		const mTextTit = new MText({
			seeder: this.seeder,
			height: 2.5 * this.scaleCoef, //2.5mm
			insertionPoint: point(),
			value: "Corte A",
			attachmentPoint: 1,
			layerName: AppLayerNames.TEXTOS
		});
		ent.push(mTextTit);

		EntityUtils.alignEntities([mTextTit], BoundingBoxPoint.TopLeft, corteCalice, BoundingBoxPoint.BottomLeft, point(margemTexto, - margemTexto));

		return ent;
	}

	private detalhaFormaCorteB(): Entity[] {
		const ent: Entity[] = [];
		
		const cortePilar = this.criaCortePilar(this.model.pilarY);
		cortePilar.forEach((e)=>ent.push(e));

		EntityUtils.moveEntities(cortePilar, point(), point(this.model.espessuraColarinho+this.model.espessuraJunta, this.prolongamentoPilar));

		const corteCalice = this.criaCorteCalice(this.model.pilarY, true);
		corteCalice.forEach((e)=> ent.push(e));

		this.cotaFormaCorte(point(), this.model.pilarY).forEach((e) => ent.push(e));

		const margemTexto = 0 * this.scaleCoef;
		const mTextTit = new MText({
			seeder: this.seeder,
			height: 2.5 * this.scaleCoef, //2.5mm
			insertionPoint: point(),
			value: "Corte B",
			attachmentPoint: 1,
			layerName: AppLayerNames.TEXTOS
		});
		ent.push(mTextTit);
		EntityUtils.alignEntities([mTextTit], BoundingBoxPoint.TopLeft, corteCalice, BoundingBoxPoint.BottomLeft, point(margemTexto, - margemTexto));
		
		return ent;
	}

	private criaFormas(): Entity[] {
		const ent: Entity[] = [];

		const secao = this.detalhaFormaSecao();
		secao.forEach((e)=>ent.push(e));
		
		const corteA = this.detalhaFormaCorteA();
		corteA.forEach((e) => ent.push(e));

		const corteB = this.detalhaFormaCorteB();
		corteB.forEach((e) => ent.push(e));

		const margem = 10 * this.scaleCoef;
		EntityUtils.alignEntities(corteA, BoundingBoxPoint.MidLeft, secao, BoundingBoxPoint.MidRight, point(margem));
		EntityUtils.alignEntities(corteB, BoundingBoxPoint.MidLeft, corteA, BoundingBoxPoint.MidRight, point(margem));

		return ent;
	}

	private criaContornoFerroN1N2(p0: Point3D, largura: number, altura: number, colorNumber: number): Polyline {
		const pLine = new Polyline({
			seeder: this.defaultDetOp.seeder,
			layerName: this.defaultDetOp.layerName,
			colorNumber: colorNumber,
			lineWeight: 15,
			flags: PolylineFlags.Closed
		});
		pLine.add(p0);
		pLine.add(point(p0.x + largura, p0.y));
		pLine.add(point(p0.x + largura, p0.y - altura));
		pLine.add(point(p0.x, p0.y - altura));

		return pLine;
	}

	private criaContornosFerrosHorizontais(bboxColarinho: BoundingBox): Entity[] {
		const ent: Entity[] = [];
		//Cria contorno n1 superior
		let p0 = point(bboxColarinho.minX + this.model.cobExterno, bboxColarinho.maxY - this.model.cobExterno);
		let largura = 2 * (this.model.espessuraColarinho + this.model.espessuraJunta - this.model.cobExterno) + this.model.pilarX;
		let altura = this.model.espessuraColarinho - (this.model.cobExterno + this.model.cobInterno);
		ent.push(this.criaContornoFerroN1N2(p0, largura, altura, 1));

		//Cria contorno n1 inferior
		p0 = point(bboxColarinho.minX + this.model.cobExterno, bboxColarinho.minY + this.model.cobExterno);
		ent.push(this.criaContornoFerroN1N2(p0, largura, -altura, 1));

		//Cria contorno n2 esquerda
		p0 = point(bboxColarinho.minX + this.model.cobExterno, bboxColarinho.maxY - this.model.cobExterno);
		altura = 2 * (this.model.espessuraColarinho + this.model.espessuraJunta - this.model.cobExterno) + this.model.pilarY;
		largura = this.model.espessuraColarinho - (this.model.cobExterno + this.model.cobInterno);
		ent.push(this.criaContornoFerroN1N2(p0, largura, altura, 2));

		//Cria contorno n2 direita
		p0 = point(bboxColarinho.maxX - this.model.cobExterno, bboxColarinho.maxY - this.model.cobExterno);
		ent.push(this.criaContornoFerroN1N2(p0, -largura, altura, 2));
		return ent;
	}

	private criaDetalheCorteN5(bboxColarinho: BoundingBox): Entity[] {
		const ent: Entity[] = [];
		const det: ArmaduraDetalhamento = new ArmaduraDetalhamento(this.defaultDetOp);

		const n5 = this.armaduras[4];
		const n5raio = n5.barra.dmm / 10 / 2;
		const n1 = this.armaduras[0];
		const n1diam = n1.barra.dmm / 10;

		//Cria as armaduras N5 superior
		//Calcula ponto de início da N5 superior
		let sPoint = point(
			bboxColarinho.minX + this.model.espessuraColarinho - this.model.cobInterno + n5raio,
			bboxColarinho.maxY - (this.model.cobExterno + n1diam)
		);
		//Calcula ponto de fim da N5 superior
		let ePoint = point(
			bboxColarinho.maxX - this.model.espessuraColarinho + this.model.cobInterno - n5raio,
			bboxColarinho.maxY - this.model.espessuraColarinho + this.model.cobInterno + n1diam
		);
		det.detalhaArmaduraCamadas(n5, 2, sPoint, ePoint, true).forEach((e) => ent.push(e));

		//Cria as armaduras N5 inferior
		//Calcula ponto de início da N5 inferior
		sPoint = point(
			sPoint.x,
			bboxColarinho.minY + this.model.cobExterno + n1diam + n5raio
		);
		//Calcula ponto de fim da N5 inferior
		ePoint = point(
			ePoint.x,
			bboxColarinho.minY + (this.model.espessuraColarinho - this.model.cobInterno - n1diam - n5raio)
		);

		det.detalhaArmaduraCamadas(n5, 2, sPoint, ePoint, true).forEach((e) => ent.push(e));

		return ent;
	}

	private criaDetalheCorteN6(bboxColarinho: BoundingBox): Entity[] {
		const ent: Entity[] = [];
		const det: ArmaduraDetalhamento = new ArmaduraDetalhamento(this.defaultDetOp);

		const n6 = this.armaduras[5];
		const n6raio = n6.barra.dmm / 10 / 2;
		const n2 = this.armaduras[1];
		const n2diam = n2.barra.dmm / 10;

		//Cria as armaduras N6 da esquerda
		//Calcula ponto de início da N6 esquerda
		let sPoint = point(
			bboxColarinho.minX + this.model.cobExterno + n2diam + n6raio,
			bboxColarinho.maxY - (this.model.espessuraColarinho - this.model.cobInterno + n6raio));
		//Calcula ponto de fim da N6 esquerda
		let ePoint = point(
			bboxColarinho.minX + this.model.espessuraColarinho - (this.model.cobInterno + n2diam + n6raio),
			bboxColarinho.minY + this.model.espessuraColarinho - (this.model.cobInterno - n6raio)
		);
		let entN6 = det.detalhaArmaduraCamadas(n6, 2, sPoint, ePoint, false);
		for (let e of entN6)
			ent.push(e);

		//Cria as armaduras N6 da direita
		//Calcula ponto de início da N6 direita
		sPoint = point(
			bboxColarinho.maxX - (this.model.espessuraColarinho - this.model.cobInterno - n2diam - n6raio),
			sPoint.y);
		//Calcula ponto de fim da N6 direita
		ePoint = point(
			bboxColarinho.maxX - this.model.cobExterno - n2diam - n6raio,
			ePoint.y
		);
		entN6 = det.detalhaArmaduraCamadas(n6, 2, sPoint, ePoint, false);
		for (let e of entN6)
			ent.push(e);

		return ent;
	}

	private criaDetalheCorteN7(bboxColarinho: BoundingBox): Entity[] {
		const ent: Entity[] = [];
		const det: ArmaduraDetalhamento = new ArmaduraDetalhamento(this.defaultDetOp);

		const n7 = this.armaduras[6];
		const n7raio = n7.barra.dmm / 10 / 2;
		const n1 = this.armaduras[0];
		const n1diam = n1.barra.dmm / 10;

		//Cria as armaduras N7 superior esquerda
		let sPoint = point(
			bboxColarinho.minX + this.model.cobExterno + n1diam + n7raio,
			bboxColarinho.maxY - (this.model.cobExterno + n1diam + n7raio)
		);
		let ePoint = point(
			bboxColarinho.minX + this.model.espessuraColarinho - (this.model.cobInterno + n1diam + n7raio),
			bboxColarinho.maxY - (this.model.espessuraColarinho - (this.model.cobInterno + n1diam + n7raio))
		);
		let entN7 = det.detalhaArmaduraCamadas(n7, 2, sPoint, ePoint, true);
		for (let e of entN7)
			ent.push(e);

		//Cria as armaduras N7 superior direita
		sPoint = point(
			bboxColarinho.maxX - (this.model.espessuraColarinho - this.model.cobInterno - n1diam - n7raio),
			sPoint.y
		);
		ePoint = point(
			bboxColarinho.maxX - this.model.cobExterno - n1diam - n7raio,
			ePoint.y
		);
		entN7 = det.detalhaArmaduraCamadas(n7, 2, sPoint, ePoint, true);
		for (let e of entN7)
			ent.push(e);

		//Cria as armaduras N7 inferior esquerda
		sPoint = point(
			bboxColarinho.minX + this.model.cobExterno + n1diam + n7raio,
			bboxColarinho.minY + (this.model.espessuraColarinho - this.model.cobInterno - n1diam - n7raio)
		);
		ePoint = point(
			bboxColarinho.minX + this.model.espessuraColarinho - (this.model.cobInterno + n1diam + n7raio),
			bboxColarinho.minY + this.model.cobExterno + n1diam + n7raio
		);
		entN7 = det.detalhaArmaduraCamadas(n7, 2, sPoint, ePoint, true);
		for (let e of entN7)
			ent.push(e);

		//Cria as armaduras N7 inferior direita
		sPoint = point(
			bboxColarinho.maxX - (this.model.espessuraColarinho - this.model.cobInterno - n1diam - n7raio),
			sPoint.y
		);
		ePoint = point(
			bboxColarinho.maxX - this.model.cobExterno - n1diam - n7raio,
			ePoint.y
		);
		entN7 = det.detalhaArmaduraCamadas(n7, 2, sPoint, ePoint, true);
		for (let e of entN7)
			ent.push(e);

		return ent;
	}

	private criaCotasArmadurasSecao(bboxColarinho: BoundingBox): Entity[] {
		const dimStyle = AppDim.getDefaultStyle(this.scaleCoef);
		dimStyle.textHeight = this.defaultDetOp.textHeight;
		dimStyle.arrowHead = ArrowHeadType.OpenCirce;
		dimStyle.arrowHeadSize = 1.5 * this.scaleCoef;
		dimStyle.offsetDimensionLineFromReference = 5 * this.scaleCoef;
		const dim = new AppDim(this.seeder, dimStyle);
		const ent: Entity[] = [];

		const n5 = this.armaduras[4];
		const n6 = this.armaduras[5];
		const n7 = this.armaduras[6];

		const cobExt = this.model.cobExterno;
		const cobInt = this.model.cobInterno;
		const esp = this.model.espessuraColarinho;

		//N7 Superior esquerda
		let start = point(bboxColarinho.minX + cobExt, bboxColarinho.maxY - cobExt);
		let end = point(bboxColarinho.minX + (esp - cobInt), start.y);
		dimStyle.colorNumber = 7;
		dim.setCurrentStyle(dimStyle);
		dim.linearDim([start, end], true, n7.quantidade + " N7").forEach((e) => ent.push(e));

		//N5 Superior
		start.x = end.x;
		end.x = bboxColarinho.maxX - (esp - cobInt);
		dimStyle.colorNumber = 5;
		dim.setCurrentStyle(dimStyle);
		dim.linearDim([start, end], true, n5.quantidade + " N5").forEach((e) => ent.push(e));

		//N7 Superior direita
		start.x = end.x;
		end.x = bboxColarinho.maxX - (cobExt);
		dimStyle.colorNumber = 7;
		dim.setCurrentStyle(dimStyle);
		dim.linearDim([start, end], true, n7.quantidade + " N7").forEach((e) => ent.push(e));

		//N6 direita
		start.x = end.x;
		start.y = bboxColarinho.maxY - (esp - cobInt);
		end.y = bboxColarinho.minY + (esp - cobInt);
		dimStyle.colorNumber = 6;
		dim.setCurrentStyle(dimStyle);
		dim.linearDim([start, end], false, n6.quantidade + " N6").forEach((e) => ent.push(e));

		//N7 inferior direita
		start.y = bboxColarinho.minY + cobExt;
		end.x = bboxColarinho.maxX - (esp - cobInt);
		end.y = start.y;
		dimStyle.colorNumber = 7;
		dim.setCurrentStyle(dimStyle);
		dim.linearDim([start, end], true, n7.quantidade + " N7").forEach((e) => ent.push(e));

		//N5 inferior
		start.x = end.x;
		end.x = bboxColarinho.minX + (esp - cobInt);
		dimStyle.colorNumber = 5;
		dim.setCurrentStyle(dimStyle);
		dim.linearDim([start, end], true, n5.quantidade + " N5").forEach((e) => ent.push(e));

		//N7 inferior esquerda
		start.x = end.x;
		end.x = bboxColarinho.minX + cobExt;
		dimStyle.colorNumber = 7;
		dim.setCurrentStyle(dimStyle);
		dim.linearDim([start, end], true, n7.quantidade + " N7").forEach((e) => ent.push(e));

		//N6 esquerda
		start.x = end.x;
		start.y = bboxColarinho.minY + (esp - cobInt);
		end.y = bboxColarinho.maxY - (esp - cobInt);
		dimStyle.colorNumber = 6;
		dim.setCurrentStyle(dimStyle);
		dim.linearDim([start, end], false, n6.quantidade + " N6").forEach((e) => ent.push(e));

		return ent;
	}

	private detalhaSecaoCalice(): Entity[] {
		const ent: Entity[] = [];

		const secaoColarinho = this.criaSecaoColarinho();
		secaoColarinho.forEach((e) => ent.push(e));

		const bboxSecaoColarinho = BoundingBoxUtils.getEntitiesBoundingBox(secaoColarinho);

		this.criaContornosFerrosHorizontais(bboxSecaoColarinho).forEach((e) => ent.push(e));;
		this.criaDetalheCorteN5(bboxSecaoColarinho).forEach((e) => ent.push(e));;
		this.criaDetalheCorteN6(bboxSecaoColarinho).forEach((e) => ent.push(e));;
		this.criaDetalheCorteN7(bboxSecaoColarinho).forEach((e) => ent.push(e));;
		this.criaCotasArmadurasSecao(bboxSecaoColarinho).forEach((e) => ent.push(e));;
		return ent;
	}

	private detalhaCorteCalice(larguraPilar: number, asPrinc: Armadura, asSec: Armadura, asVert: Armadura): Entity[] {

		const ent: Entity[] = [];
		const det = new ArmaduraDetalhamento(this.defaultDetOp);
		const dimStyle = AppDim.getDefaultStyle(this.scaleCoef);
		dimStyle.arrowHead = ArrowHeadType.OpenCirce;
		dimStyle.arrowHeadSize = 1.5 * this.scaleCoef;
		dimStyle.offsetDimensionLineFromReference = 5 * this.scaleCoef;
		const dim = new AppDim(this.seeder, dimStyle);

		const corteColarinho = this.criaCorteCalice(larguraPilar, false);
		corteColarinho.forEach((e) => ent.push(e));
		const bboxCorte = BoundingBoxUtils.getEntitiesBoundingBox(corteColarinho);

		const cobExt = this.model.cobExterno;
		const cobInt = this.model.cobInterno;
		const esp = this.model.espessuraColarinho;
		const emb3 = this.model.embutimento / 3;
		const as1Raio = asPrinc.barra.dmm/10/2;
		const as2Raio = asSec.barra.dmm/10/2;


		const topLeft = BoundingBoxUtils.getTopLeft(bboxCorte);
		const topRight = BoundingBoxUtils.getTopRight(bboxCorte);
		
		
		
		//Armadura horizontal principal superior
		dimStyle.colorNumber = asPrinc.numero;
		dim.setCurrentStyle(dimStyle);
		//Esquerda
		let startEsq = point(topLeft.x + cobExt, topLeft.y - cobExt);
		let endEsq = point(topLeft.x + (esp-cobInt), topLeft.y - emb3);
		//Cota		
		dim.linearDim([point(startEsq.x, endEsq.y), startEsq], false, asPrinc.quantidade + " N" + asPrinc.numero).forEach((e) => ent.push(e));
		//Armadura
		det.detalhaArmaduraCamadas(asPrinc, 2, startEsq, endEsq, false).forEach((e) => ent.push(e));
		
		//Direita
		//Cota
		let startDir = point(topRight.x - cobExt, topRight.y - cobExt);
		let endDir = point(topRight.x - (esp-cobInt), topRight.y - emb3);
		dim.linearDim([startDir, point(startDir.x, endDir.y)], false, asPrinc.quantidade + " N" + asPrinc.numero).forEach((e) => ent.push(e));
		//Armadura
		det.detalhaArmaduraCamadas(asPrinc, 2, startDir, endDir, false).forEach((e) => ent.push(e));

		//Armadura horizontal secundária 
		dimStyle.colorNumber = asSec.numero;
		dim.setCurrentStyle(dimStyle);
		//Esquerda
		//Cota
		startEsq.y = endEsq.y;
		endEsq.y = endEsq.y - emb3;
		dim.linearDim([point(startEsq.x, endEsq.y), startEsq], false, asSec.quantidade + " N" + asSec.numero).forEach((e) => ent.push(e));
		//Armadura
		startEsq.y = startEsq.y - asSec.espacamento!;
		endEsq.y = endEsq.y + asSec.espacamento!;
		det.detalhaArmaduraCamadas(asSec, 2, startEsq, endEsq, false).forEach((e) => ent.push(e));

		//Direita
		//Cota
		startDir.y = endDir.y;
		endDir.y = endDir.y - emb3;
		dim.linearDim([startDir, point(startDir.x, endDir.y)], false, asSec.quantidade + " N" + asSec.numero).forEach((e) => ent.push(e));
		//Armadura
		startDir.y = startDir.y - asSec.espacamento!;
		endDir.y = endDir.y + asSec.espacamento!;
		det.detalhaArmaduraCamadas(asSec, 2, startDir, endDir, false).forEach((e) => ent.push(e));

		//Armadura horizontal principal inferior
		dimStyle.colorNumber = asPrinc.numero;
		dim.setCurrentStyle(dimStyle);
		//Esquerda
		//Cota
		startEsq.y = endEsq.y - asSec.espacamento!;
		endEsq.y = startEsq.y - emb3;
		dim.linearDim([point(startEsq.x, endEsq.y), startEsq], false, asPrinc.quantidade + " N" + asPrinc.numero).forEach((e) => ent.push(e));
		//Armadura
		det.detalhaArmaduraCamadas(asPrinc, 2, startEsq, endEsq, false).forEach((e) => ent.push(e));
		//Direita
		//Cota
		startDir.y = endDir.y - asSec.espacamento!;
		endDir.y = startDir.y - emb3;
		dim.linearDim([startDir, point(startDir.x, endDir.y)], false, asPrinc.quantidade + " N" + asPrinc.numero).forEach((e) => ent.push(e));
		//Armadura
		det.detalhaArmaduraCamadas(asPrinc, 2, startDir, endDir, false).forEach((e) => ent.push(e));

		//Armadura vertical
		const formaOri = asVert.forma! as FormaArmaduraReta;
		const forma: FormaArmaduraReta = {
			segmentos: Object.assign([], formaOri.segmentos),
			dobras: Object.assign([], formaOri.dobras),
			cotaSegmento: Object.assign([], formaOri.cotaSegmento),
			cotaAcimaDoSegmento: Object.assign([], formaOri.cotaAcimaDoSegmento)
		}
		for(let i = 0; i < forma.cotaSegmento.length ; i++)
			forma.cotaSegmento[i] = false;
		//Esquerda
		let detForma = det.criaDetalheFormaArmadura(forma, asVert.numero);
		detForma.forEach((e) => ent.push(e));
		let pOri = point(0, forma.segmentos[0]);
		let pDes = point(topLeft.x + cobExt + 2*as1Raio, topLeft.y - cobExt);
		EntityUtils.moveEntities(detForma, pOri, pDes);

		//direita
		detForma = det.criaDetalheFormaArmadura(forma, asVert.numero);
		detForma.forEach((e) => ent.push(e));
		pDes = point(topRight.x - (esp - cobInt - 2*as1Raio), topRight.y - cobExt);
		EntityUtils.moveEntities(detForma, pOri, pDes);

		return ent;

	}


	private criaN1(): Armadura {
		const n1 = new Armadura({
			barra: this.model.armHorzPrincipal!.barra,
			numero: 1,
			quantidade: this.model.armHorzPrincipal!.quantidade,
			multiplo: 2
		});
		n1.espacamento = round(((this.model.embutimento / 3) - this.model.cobExterno) / (n1.quantidade - 1), 0);
		const largura = this.model.espessuraColarinho - (this.model.cobExterno + this.model.cobInterno);
		const altura = 2 * (this.model.espessuraColarinho + this.model.espessuraJunta) + this.model.pilarX - 2 * this.model.cobExterno;
		const gancho = roundUp(n1.barra.dmm, 0);
		n1.forma = FormaArmaduraFactory.estribo02(largura, altura, gancho);
		return n1;
	}

	private criaN2(): Armadura {
		const n2 = new Armadura({
			barra: this.model.armHorzPrincipal!.barra,
			numero: 2,
			quantidade: this.model.armHorzPrincipal!.quantidade,
			multiplo: 2
		});
		n2.espacamento = round(((this.model.embutimento / 3) - this.model.cobExterno) / (n2.quantidade - 1), 0);
		const largura = this.model.espessuraColarinho - (this.model.cobExterno + this.model.cobInterno);
		const altura = 2 * (this.model.espessuraColarinho + this.model.espessuraJunta) + this.model.pilarY - 2 * this.model.cobExterno;
		const gancho = roundUp(n2.barra.dmm, 0);
		n2.forma = FormaArmaduraFactory.estribo01(largura, altura, gancho);
		return n2;
	}

	private criaN3(): Armadura {
		const n3 = new Armadura({
			barra: this.model.armHorzSecundaria!.barra,
			numero: 3,
			quantidade: this.model.armHorzSecundaria!.quantidade,
			multiplo: 1
		});
		n3.espacamento = round((this.model.embutimento / 3) / (n3.quantidade + 1), 0);
		const largura = this.model.espessuraColarinho - (this.model.cobExterno + this.model.cobInterno);
		const altura = 2 * (this.model.espessuraColarinho + this.model.espessuraJunta) + this.model.pilarX - 2 * this.model.cobExterno;
		const gancho = roundUp(n3.barra.dmm, 0);
		n3.forma = FormaArmaduraFactory.estribo02(largura, altura, gancho);
		return n3;
	}

	private criaN4(): Armadura {
		const n4 = new Armadura({
			barra: this.model.armHorzSecundaria!.barra,
			numero: 4,
			quantidade: this.model.armHorzSecundaria!.quantidade,
			multiplo: 1
		});
		n4.espacamento = round((this.model.embutimento / 3) / (n4.quantidade + 1), 0);
		const largura = this.model.espessuraColarinho - (this.model.cobExterno + this.model.cobInterno);
		const altura = 2 * (this.model.espessuraColarinho + this.model.espessuraJunta) + this.model.pilarY - 2 * this.model.cobExterno;
		const gancho = roundUp(n4.barra.dmm, 0);
		n4.forma = FormaArmaduraFactory.estribo01(largura, altura, gancho);

		return n4;
	}

	private criaN5(): Armadura {
		const n5 = new Armadura({
			barra: this.model.armVertSecundaria!.barra,
			numero: 5,
			quantidade: this.model.armVertSecundaria!.quantidade,
			multiplo: 1
		});
		n5.espacamento = round((this.model.pilarX + 2 * (this.model.espessuraJunta + this.model.cobInterno)) / (n5.quantidade - 1), 0);
		const largura = this.model.espessuraColarinho - (this.model.cobExterno + this.model.cobInterno + 2 * this.model.armHorzPrincipal!.barra.dmm / 10);
		const lbNec = roundUp(this.model.concreto.comprimentoAncoragemNecessario({
			barra: n5.barra,
			situacaoBoaAderencia: true,
			AsCalc: 1,
			AsEf: 1,
			tpAncoragem: TipoAncoragem.BarraReta
		}), 0);
		const altura = this.model.embutimento + lbNec;
		n5.forma = FormaArmaduraFactory.uInvertido01(altura, largura);

		return n5;
	}

	private criaN6(): Armadura {
		const n6 = new Armadura({
			barra: this.model.armVertSecundaria!.barra,
			numero: 6,
			quantidade: this.model.armVertSecundaria!.quantidade,
			multiplo: 1
		});
		n6.espacamento = round((this.model.pilarY + 2 * (this.model.espessuraJunta + this.model.cobInterno)) / (n6.quantidade - 1), 0);
		const largura = this.model.espessuraColarinho - (this.model.cobExterno + this.model.cobInterno + 2 * this.model.armHorzPrincipal!.barra.dmm / 10);
		const lbNec = roundUp(this.model.concreto.comprimentoAncoragemNecessario({
			barra: n6.barra,
			situacaoBoaAderencia: true,
			AsCalc: 1,
			AsEf: 1,
			tpAncoragem: TipoAncoragem.BarraReta
		}), 0);
		const altura = this.model.embutimento + lbNec;
		n6.forma = FormaArmaduraFactory.uInvertido01(altura, largura);

		return n6;
	}

	private criaN7(): Armadura {
		const n7 = new Armadura({
			barra: this.model.armVertPrincipal!.barra,
			numero: 7,
			quantidade: this.model.armVertPrincipal!.quantidade,
			multiplo: 4
		});
		const largura = this.model.espessuraColarinho - (this.model.cobExterno + this.model.cobInterno + 2 * this.model.armHorzPrincipal!.barra.dmm / 10);
		const lbNec = roundUp(this.model.concreto.comprimentoAncoragemNecessario({
			barra: n7.barra,
			situacaoBoaAderencia: true,
			AsCalc: 1,
			AsEf: 1,
			tpAncoragem: TipoAncoragem.BarraReta
		}), 0);
		const altura = this.model.embutimento + lbNec;
		n7.forma = FormaArmaduraFactory.uInvertido01(altura, largura);

		return n7;
	}

	private criaArmaduras() {
		this.armaduras = [
			this.criaN1(),
			this.criaN2(),
			this.criaN3(),
			this.criaN4(),
			this.criaN5(),
			this.criaN6(),
			this.criaN7()
		];

	}

	private criaDetalheArmadurasHorizontais(bboxColarinho: BoundingBox): Entity[] {
		const det = new ArmaduraDetalhamento(this.defaultDetOp);
		const ent: Entity[] = [];

		const margemSecao = 5 * this.scaleCoef;
		const margemFerros = this.defaultDetOp.textHeight;

		//Calcula os pontos de referência
		const top = BoundingBoxUtils.getTopCenter(bboxColarinho);
		top.y += margemSecao;

		const bottom = BoundingBoxUtils.getBottomCenter(bboxColarinho);
		bottom.y -= margemSecao;

		const left = BoundingBoxUtils.getMidLeft(bboxColarinho);
		left.x -= margemSecao;

		const right = BoundingBoxUtils.getMidRight(bboxColarinho);
		right.x += margemSecao;

		//Cria o detalhamento das armaduras
		const n1 = det.detalhaArmadura(this.armaduras[0]);
		n1.forEach((e) => ent.push(e));

		const n1_2 = det.detalhaArmadura(this.armaduras[0]);
		n1_2.forEach((e) => ent.push(e));

		const n2 = det.detalhaArmadura(this.armaduras[1], false);
		n2.forEach((e) => ent.push(e));

		const n2_2 = det.detalhaArmadura(this.armaduras[1], false);
		n2_2.forEach((e) => ent.push(e));

		const n3 = det.detalhaArmadura(this.armaduras[2]);
		n3.forEach((e) => ent.push(e));

		const n3_2 = det.detalhaArmadura(this.armaduras[2]);
		n3_2.forEach((e) => ent.push(e));

		const n4 = det.detalhaArmadura(this.armaduras[3], false);
		n4.forEach((e) => ent.push(e));

		const n4_2 = det.detalhaArmadura(this.armaduras[3], false);
		n4_2.forEach((e) => ent.push(e));

		//Move N1 para cima da secao do colarinho
		let bboxN1 = BoundingBoxUtils.getEntitiesBoundingBox(n1);
		EntityUtils.moveEntities(n1, BoundingBoxUtils.getBottomCenter(bboxN1), top);

		//Move N1_2 para baixo da secao do colarinho
		let bboxN1_2 = BoundingBoxUtils.getEntitiesBoundingBox(n1_2);
		EntityUtils.moveEntities(n1_2, BoundingBoxUtils.getTopCenter(bboxN1_2), bottom);

		//Move N2 para esquerda da secao do colarinho
		let bboxN2 = BoundingBoxUtils.getEntitiesBoundingBox(n2);
		EntityUtils.moveEntities(n2, BoundingBoxUtils.getMidRight(bboxN2), left);

		//Move N2_2 para direita da secao do colarinho
		let bboxN2_2 = BoundingBoxUtils.getEntitiesBoundingBox(n2_2);
		EntityUtils.moveEntities(n2_2, BoundingBoxUtils.getMidLeft(bboxN2_2), right);

		//Move N3 para cima do N1
		bboxN1 = BoundingBoxUtils.getEntitiesBoundingBox(n1);
		const n1Top = BoundingBoxUtils.getTopCenter(bboxN1);
		n1Top.y += margemFerros;
		let bboxN3 = BoundingBoxUtils.getEntitiesBoundingBox(n3);
		EntityUtils.moveEntities(n3, BoundingBoxUtils.getBottomCenter(bboxN3), n1Top);

		//Move N3_2 para baixo do N1_2
		bboxN1_2 = BoundingBoxUtils.getEntitiesBoundingBox(n1_2);
		const n1Bot = BoundingBoxUtils.getBottomCenter(bboxN1_2);
		n1Bot.y -= margemFerros;
		let bboxN3_2 = BoundingBoxUtils.getEntitiesBoundingBox(n3_2);
		EntityUtils.moveEntities(n3_2, BoundingBoxUtils.getTopCenter(bboxN3_2), n1Bot);

		//Move N4 para esquerda do N2
		bboxN2 = BoundingBoxUtils.getEntitiesBoundingBox(n2);
		const n2Left = BoundingBoxUtils.getMidLeft(bboxN2);
		n2Left.x -= margemFerros;
		let bboxN4 = BoundingBoxUtils.getEntitiesBoundingBox(n4);
		EntityUtils.moveEntities(n4, BoundingBoxUtils.getMidRight(bboxN4), n2Left);

		//Move N4_2 para direita do N2_2
		bboxN2_2 = BoundingBoxUtils.getEntitiesBoundingBox(n2_2);
		const n2Right = BoundingBoxUtils.getMidRight(bboxN2_2);
		n2Right.x += margemFerros;
		let bboxN4_2 = BoundingBoxUtils.getEntitiesBoundingBox(n4_2);
		EntityUtils.moveEntities(n4_2, BoundingBoxUtils.getMidLeft(bboxN4_2), n2Right);

		return ent;
	}

	private criaDetalheArmadurasVerticais(bboxCorteA: BoundingBox, bboxCorteB: BoundingBox): Entity[] {
		const ent: Entity[] =[];
		const det = new ArmaduraDetalhamento(this.defaultDetOp);

		const n1 = this.armaduras[0];
		const n2 = this.armaduras[1];

		//N6 Esquerda
		const n6 = this.armaduras[5];
		const n6Forma = n6.forma! as FormaArmaduraReta;
		const detN6_e = det.detalhaArmadura(n6, false);
		detN6_e.forEach((e) => ent.push(e));
		//Posiciona a armadura
		let pOri = point(n6Forma.segmentos[1], n6Forma.segmentos[0]);
		let pDest = BoundingBoxUtils.getBottomCenter(bboxCorteA);
		pDest.x -= this.model.pilarX/2+this.model.espessuraJunta+this.model.cobInterno+n2.barra.dmm/10;
		pDest.y -= this.margemArmaduras;
		EntityUtils.moveEntities(detN6_e, pOri, pDest);

		//N6 direita
		const detN6_d = det.detalhaArmadura(n6, false);
		detN6_d.forEach((e) => ent.push(e));
		//Posiciona armadura
		pOri = point(0, n6Forma.segmentos[0]);
		pDest = BoundingBoxUtils.getBottomCenter(bboxCorteA);
		pDest.x += this.model.pilarX/2+this.model.espessuraJunta+this.model.cobInterno+n2.barra.dmm/10;
		pDest.y -= this.margemArmaduras;
		EntityUtils.moveEntities(detN6_d, pOri, pDest);

		//N7
		const n7 = this.armaduras[6];
		const n7Forma = n7.forma! as FormaArmaduraReta;
		const detN7 = det.detalhaArmadura(n7, false);
		detN7.forEach((e) => ent.push(e));
		//Posiciona armadura
		pOri = point(n7Forma.segmentos[1]/2, n7Forma.segmentos[0]);
		pDest = middlePoint(BoundingBoxUtils.getBottomRight(bboxCorteA), BoundingBoxUtils.getBottomLeft(bboxCorteB));
		EntityUtils.moveEntities(detN7, pOri, pDest);

		//N5 esquerda
		const n5 = this.armaduras[4];
		const n5Forma = n5.forma! as FormaArmaduraReta;
		const detN5_e = det.detalhaArmadura(n5, false);
		detN5_e.forEach((e) => ent.push(e));
		//Posiciona a armadura
		pOri = point(n5Forma.segmentos[1], n5Forma.segmentos[0]);
		pDest = BoundingBoxUtils.getBottomCenter(bboxCorteB);
		pDest.x -= this.model.pilarY/2+this.model.espessuraJunta+this.model.cobInterno+n1.barra.dmm/10;
		pDest.y -= this.margemArmaduras;
		EntityUtils.moveEntities(detN5_e, pOri, pDest);

		//N5 direita

		const detN5_d = det.detalhaArmadura(n5, false);
		detN5_d.forEach((e) => ent.push(e));
		//Posiciona a armadura
		pOri = point(0, n5Forma.segmentos[0]);
		pDest = BoundingBoxUtils.getBottomCenter(bboxCorteB);
		pDest.x += this.model.pilarY/2+this.model.espessuraJunta+this.model.cobInterno+n1.barra.dmm/10;
		pDest.y -= this.margemArmaduras;
		EntityUtils.moveEntities(detN5_d, pOri, pDest);






		return ent;
	}

	private criaDetalhentoArmaduras(): Entity[] {
		//Cria as formas de todas as armaduras do cálice
		this.criaArmaduras();

		const ent: Entity[] = [];


		const detArmSecao = this.detalhaSecaoCalice();
		detArmSecao.forEach((e) => ent.push(e));
		const bboxArmSecao = BoundingBoxUtils.getEntitiesBoundingBox(detArmSecao);

		const detArmHorz = this.criaDetalheArmadurasHorizontais(bboxArmSecao);
		detArmHorz.forEach((e) => ent.push(e));

		const detCorteA = this.detalhaCorteCalice(this.model.pilarX, this.armaduras[1], this.armaduras[3], this.armaduras[5]);
		detCorteA.forEach((e) => ent.push(e));
		
		const detCorteB = this.detalhaCorteCalice(this.model.pilarY, this.armaduras[0], this.armaduras[2], this.armaduras[4]);
		detCorteB.forEach((e) => ent.push(e));
		
		EntityUtils.alignEntities(detCorteA, BoundingBoxPoint.TopLeft, detArmHorz, BoundingBoxPoint.TopRight, point(this.margemArmaduras));		
		EntityUtils.alignEntities(detCorteB, BoundingBoxPoint.TopLeft, detCorteA, BoundingBoxPoint.TopRight, point(this.margemArmaduras));

		const bboxCorteA = BoundingBoxUtils.getEntitiesBoundingBox(detCorteA);
		const bboxCorteB = BoundingBoxUtils.getEntitiesBoundingBox(detCorteB);
		
		const detArmVert = this.criaDetalheArmadurasVerticais(bboxCorteA, bboxCorteB);
		detArmVert.forEach((e) => ent.push(e));

		return ent;
	}

	private criaContorno(titulo: Entity[], formas: Entity[], armaduras: Entity[]): Entity[] {
		const ent: Entity[] = [];

		const bboxTitulo = BoundingBoxUtils.getEntitiesBoundingBox(titulo);
		const heightTitulo = BoundingBoxUtils.getHeight(bboxTitulo)+2*this.margemTitulo;
		const widthTitulo = BoundingBoxUtils.getWidth(bboxTitulo)+2*this.margemTitulo ;

		const bboxFormas = BoundingBoxUtils.getEntitiesBoundingBox(formas);
		const heightFormas = BoundingBoxUtils.getHeight(bboxFormas)+2*this.margemFormas;
		const widthFormas = BoundingBoxUtils.getWidth(bboxFormas)+2*this.margemFormas;

		const bboxArmaduras = BoundingBoxUtils.getEntitiesBoundingBox(armaduras);
		const heightArmaduras = BoundingBoxUtils.getHeight(bboxArmaduras)+2*this.margemArmaduras;
		const widthArmaduras = BoundingBoxUtils.getWidth(bboxArmaduras)+2*this.margemArmaduras;

		const maxWidth = Math.max(widthTitulo, widthFormas, widthArmaduras);

		const pLineTitulo = new Polyline({
			seeder: this.seeder,
			layerName: AppLayerNames.TEXTOS,
			lineWeight: 50,
			flags: PolylineFlags.Closed
		});
		ent.push(pLineTitulo);
		pLineTitulo.add(point());
		pLineTitulo.add(point(maxWidth, 0));
		pLineTitulo.add(point(maxWidth, -heightTitulo));
		pLineTitulo.add(point(0, -heightTitulo));

		const pLineFormas = new Polyline({
			seeder: this.seeder,
			layerName: AppLayerNames.TEXTOS,
			lineWeight: 50,
			flags: PolylineFlags.Closed
		});
		ent.push(pLineFormas);
		pLineFormas.add(point());
		pLineFormas.add(point(maxWidth, 0));
		pLineFormas.add(point(maxWidth, -heightFormas));
		pLineFormas.add(point(0, -heightFormas));

		const pLineArmaduras = new Polyline({
			seeder: this.seeder,
			layerName: AppLayerNames.TEXTOS,
			lineWeight: 50,
			flags: PolylineFlags.Closed
		});
		ent.push(pLineArmaduras);
		pLineArmaduras.add(point());
		pLineArmaduras.add(point(maxWidth, 0));
		pLineArmaduras.add(point(maxWidth, -heightArmaduras));
		pLineArmaduras.add(point(0, -heightArmaduras));

		EntityUtils.alignEntities([pLineFormas], BoundingBoxPoint.TopLeft, [pLineTitulo], BoundingBoxPoint.BottomLeft);
		EntityUtils.alignEntities([pLineArmaduras], BoundingBoxPoint.TopLeft, [pLineFormas], BoundingBoxPoint.BottomLeft);

		EntityUtils.alignEntities(titulo, BoundingBoxPoint.TopLeft, [pLineTitulo], BoundingBoxPoint.TopLeft, point(this.margemTitulo, -this.margemTitulo));
		EntityUtils.alignEntities(formas, BoundingBoxPoint.TopCenter, [pLineFormas], BoundingBoxPoint.TopCenter, point(0, -this.margemFormas));
		EntityUtils.alignEntities(armaduras, BoundingBoxPoint.TopCenter, [pLineArmaduras], BoundingBoxPoint.TopCenter, point(0, -this.margemArmaduras));

		return ent;
	}

	public criaDetalhamento(calice: Calice, multiplo: number = 1): Entity[] {
		const ent: Entity[] = [];
		this.model = calice;

		const titulo = this.criaSecaoTitulo(multiplo);
		titulo.forEach((e) => ent.push(e));

		const formas = this.criaFormas();
		formas.forEach((e) => ent.push(e));
	
		const armaduras = this.criaDetalhentoArmaduras();
		armaduras.forEach((e) => ent.push(e));

		this.criaContorno(titulo, formas, armaduras).forEach((e) => ent.push(e));

		return ent;
				
	}

	public quantificaFerros(calice: Calice): Armadura[] {
		this.model = calice;
		const arm: Armadura[] = [
			this.criaN1(),
			this.criaN2(),
			this.criaN3(),
			this.criaN4(),
			this.criaN5(),
			this.criaN6(),
			this.criaN7()
		];

		arm[0].multiplo! *= 2;
		arm[1].multiplo! *= 2;
		arm[2].multiplo! *= 2;
		arm[3].multiplo! *= 2;
		arm[4].multiplo! *= 2;
		arm[5].multiplo! *= 2;

		return arm;
	}

	public quantificaForma(calice: Calice): number {
		let forma = 0;
		const xExt = 2*(calice.espessuraColarinho+calice.espessuraJunta)+calice.pilarX;
		const yExt = 2*(calice.espessuraColarinho+calice.espessuraJunta)+calice.pilarY;
		const xInt = 2*calice.espessuraJunta+calice.pilarX;
		const yInt = 2*calice.espessuraJunta+calice.pilarY;

		forma += (calice.embutimento)*2*((xExt+yExt));//Forma externa
		forma += (calice.embutimento+5)*2*((xInt+yInt));//Forma interna
		forma += xInt*yInt;//Forma fundo

		return forma/(100*100);
	}

	public quantificaConcreto(calice: Calice): number {
		let vol = 0;

		const xExt = 2*(calice.espessuraColarinho+calice.espessuraJunta)+calice.pilarX;
		const yExt = 2*(calice.espessuraColarinho+calice.espessuraJunta)+calice.pilarY;
		const xInt = 2*calice.espessuraJunta+calice.pilarX;
		const yInt = 2*calice.espessuraJunta+calice.pilarY;

		vol += calice.embutimento*xExt*yExt;//Volume externo
		vol -= calice.embutimento*xInt*yInt;//Volume interno


		return vol/(100*100*100);
	}
	
}


