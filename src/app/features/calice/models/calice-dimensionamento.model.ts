import { ConversorUnidades } from "../../../utils/conversor-unidade";
import { Concreto } from "../../concreto/models/concreto.model";

export interface CaliceDimensionamentoParams {
	nome: string;
	pilarX: number;
	pilarY: number; 
	espColarinho: number; 
	espJunta: number; 
	compEmbutimento: number;
	concreto: Concreto;
}

export interface Cargas {
	N: number;
	Mx: number;
	My: number;
	Fx: number;
	Fy: number;
}

export interface CaliceDimensionamentoResultado {
	erros: string[];
	Ashp: number;
	Ashs: number;
	Asvp: number;
	Asvs: number;
}

export class CaliceDimensionamento {

	yf: number = 1.4; //fator de majoração de cargas
	yn: number = 1.2; //coeficiente de ajustamento de cargas normais

	private logMem(line: string){
		console.log(line);
	}

	private calculaEmbutimentoMinimoLado(h: number, e: number): number {
		if(e <= 0.15)
			return 1.5*h;
		if (e >= 2)
			return 2*h;
		const i = (e - 0.15)/(2 - 0.15);
		return (1.5 + 0.5*i)*h;
	}

	private calculaEmbutimentoMinimo(pilarX: number, pilarY: number, N:number, Mx: number, My: number): number {
		let embMinimo = 40;
		//Direção x	
		const embX = this.calculaEmbutimentoMinimoLado(pilarX, My/(N*(pilarX/100)));
		//Direção y
		const embY = this.calculaEmbutimentoMinimoLado(pilarY, Mx/(N*(pilarY/100)));

		return Math.max(embX, embY, embMinimo);
	}

	private calculaArmaduraLado(h: number, Nd: number, Md: number, Fd: number, emb: number, hc: number, hj: number): number[] {
		h = h/100; //cm to m
		emb = emb/100; //cm to m
		hc = hc/100; //cm to m
		hj = hj/100; //cm to m
		Md = Math.abs(Md);
		Fd = Math.abs(Fd);
		const e = Md/(Nd*h);

		this.logMem("h:"+h+" m");
		this.logMem("Nd:"+Nd.toFixed(4)+" tf");
		this.logMem("Md:"+Md.toFixed(4)+" tf.m");
		this.logMem("Fd:"+Fd.toFixed(4)+" tf");

		this.logMem("Md/(Nd*h):"+e.toFixed(4));

		const eNb = e <= 0.15 ? 0 : h/4;
		const aEmb = e <= 0.15 ? emb/6 : emb/10;
		const uSup = e <= 0.15 ? 0 : 0.3;

		this.logMem("e,Nb:"+eNb+" m");
		this.logMem("a,emb:"+aEmb+" m");
		this.logMem("μ,sup:"+uSup);

		const MNd = Nd*(eNb+uSup*((aEmb-0.75*uSup*h)/(1+uSup*uSup)));
		const MFd = Fd*(emb-((0.1*emb-0.75*uSup*h)/(1+uSup*uSup)));
		const Hsfd = Math.abs(Md-MNd+MFd)/(0.8*emb+uSup*h);
		this.logMem("Resultante da pressão horizontal na parte superior do cálice Hsfd:"+Hsfd.toFixed(4)+" tf");

		const Nbd = (Nd-uSup*Fd)/(1+uSup*uSup);
		this.logMem("Resultante da pressão normal na base do cálice Nbd:"+Nbd.toFixed(4)+" tf");

		const y = emb/10;
		this.logMem("Altura de aplicação da força y="+y.toFixed(4)+" m");

		const betha = Math.atan((emb + 0.05-y)/(h+2*hj+2*(hc/2)))*(180/Math.PI);
		this.logMem("Ângulo de inclinação da biela β="+betha.toFixed(4)+"°");

		const hBiela = hc*100*Math.sin(betha*Math.PI/180);
		this.logMem("Altura da biela h="+hBiela.toFixed(4)+" cm");

		const Rcd = Hsfd/(2*Math.cos(betha*Math.PI/180));
		this.logMem("Esforço na biela Rcd:"+Rcd.toFixed(4)+" tf");

		const sigmaCd = Rcd*1000/(hBiela*hc*100);
		this.logMem("Tensão na biela σcd:"+sigmaCd.toFixed(4)+" kgf/cm²");

		const Fvd = Hsfd/(2*Math.sin(betha*Math.PI/180));
		this.logMem("Força Vertical atuante nos vértices Fvd:"+Fvd.toFixed(4)+" tf");

		const fyd = 500/1.15/100;

		const Ashp = Hsfd/(2*fyd);
		this.logMem("Armadura horizontal principal necessária Ashp:"+Ashp.toFixed(4)+" cm²");

		const Ashs = 0.1/100*(emb*100*hc*100);
		this.logMem("Armadura horizontal de distribuição Ashs:"+Ashs.toFixed(4)+" cm²");

		const Asvp = Fvd/fyd;
		this.logMem("Armadura vertical principal necessária Asvp:"+Asvp.toFixed(4)+" cm²");	

		const Asvs = 0.1/100*(h*100+2*hj*100+2*hc*100)*hc*100;
		this.logMem("Armadura vertical de distribuição Asvs:"+Asvs.toFixed(4)+" cm²");

		return [sigmaCd, Ashp, Ashs, Asvp, Asvs];
	}

	public dimensionaCalice(params: CaliceDimensionamentoParams, loads: Cargas[]) {
		this.logMem("---------------------------------------------------------------------------");
		this.logMem("Dimensionamento cálice: "+params.nome);
		this.logMem("Seção pilar x:"+params.pilarX+" cm -- y:"+params.pilarY+" cm");
		this.logMem("Espessura colarinho:"+params.espColarinho+" cm");
		this.logMem("Espessura junta:"+params.espJunta+" cm");
		this.logMem("Embutimento:"+params.compEmbutimento+" cm");
		this.logMem("Concreto:"+params.concreto.fckMPa+" MPa");
		this.logMem("γf: "+this.yf);
		this.logMem("γn: "+this.yn);

		const sigmaLimite = ConversorUnidades.MPa2kgcm2(0.4*params.concreto.fcdMPa);
		this.logMem("Tensão limite admissível na parede do cálice: "+sigmaLimite.toFixed(2)+" kgf/cm²");
		const sigmaBielaLimite = ConversorUnidades.MPa2kgcm2(0.72*(1-params.concreto.fckMPa/250)*params.concreto.fcdMPa);
		this.logMem("Tensão limite admissível na biela do cálice: "+sigmaBielaLimite.toFixed(2)+" kgf/cm²");
		let Ashp: number = 0;
		let Ashs: number = 0;
		let Asvp: number = 0;
		let Asvs: number = 0;
		let maxSigmaParede: number = 0;
		let maxSigmaBiela: number = 0;
		const Asmin = 0.25* params.espColarinho;
		this.logMem("Armadura mínima total horizontal, Asmin: "+Asmin.toFixed(2)+" cm²");
		this.logMem("Armadura mínima total vertical, Asmin: "+Asmin.toFixed(2)+" cm²");
		const areaColarinho = 4*params.espColarinho*params.espColarinho + 2*(params.pilarX+params.pilarY+4*params.espJunta)*params.espColarinho;
		const areaVertices = 4*params.espColarinho*params.espColarinho;
		const percAreaVertices = areaVertices/areaColarinho;

		for (let index = 0; index < loads.length; index++) {
			const load = loads[index];
			this.logMem("-------------------------------CASO "+(index+1)+"-----------------------");
			this.logMem("Cargas")
			this.logMem("Nk:"+load.N+" tf");
			this.logMem("Mx,k:"+load.Mx+" tf.m");
			this.logMem("My,k:"+load.My+" tf.m");
			this.logMem("Fx,k:"+load.Fx+" tf");
			this.logMem("Fy,k:"+load.Fy+" tf");

			const Nsd = load.N*this.yf*this.yn;
			const Mxd = load.Mx*this.yf*this.yn;
			const Myd = load.My*this.yf*this.yn;
			const Fxd = load.Fx*this.yf*this.yn;
			const Fyd = load.Fy*this.yf*this.yn;
			this.logMem("Cargas de cálculo:")
			this.logMem("Nsd:"+Nsd.toFixed(4)+" tf");
			this.logMem("Mx,d:"+Mxd.toFixed(4)+" tf.m");
			this.logMem("My,d:"+Myd.toFixed(4)+" tf.m");
			this.logMem("Fx,d:"+Fxd.toFixed(4)+" tf");
			this.logMem("Fy,d:"+Fyd.toFixed(4)+" tf");


			this.logMem("---------------------------------------------------------------------------");
			const embMinimo = this.calculaEmbutimentoMinimo(params.pilarX, params.pilarY, Nsd, Mxd, Myd);
			this.logMem("Embutimento mínimo requerido: "+embMinimo.toFixed(2)+" cm");
			this.logMem("Embutimento adotado: "+params.compEmbutimento.toFixed(2)+" cm");
			if(params.compEmbutimento < embMinimo){
				this.logMem("AVISO: Embutimento adotado é menor que o mínimo requerido!");
			} else {
				this.logMem("OK: Embutimento adotado atende o mínimo requerido.");
			}

			this.logMem("---------------------------------------------------------------------------");
			this.logMem("Verificação da tensão frontal da parede do cálice:");
			const sigmaParedeX = Fyd*1000/(params.pilarX*0.2*params.compEmbutimento);
			const sigmaParedeY = Fxd*1000/(params.pilarY*0.2*params.compEmbutimento);
			maxSigmaParede = sigmaParedeX > maxSigmaParede ? sigmaParedeX: maxSigmaParede;
			maxSigmaParede = sigmaParedeY > maxSigmaParede ? sigmaParedeY: maxSigmaParede;
			

			this.logMem("Tensão na parede na direção x: "+sigmaParedeX.toFixed(2)+" kgf/cm²");
			if(sigmaParedeX > sigmaLimite)
				this.logMem("ERRO: Tensão na parede do cálice na direção x é maior que a tensão limite admissível!");

			this.logMem("Tensão na parede na direção y: "+sigmaParedeY.toFixed(2)+" kgf/cm²");
			if(sigmaParedeY > sigmaLimite)
				this.logMem("ERRO: Tensão na parede do cálice na direção y é maior que a tensão limite admissível!");

			this.logMem("---------------------------------------------------------------------------");
			this.logMem("Cálculo da armadura do cálice:");
			const fyd = 500/1.15/100;
			const AsSusp = 0.4*Nsd/fyd;
			this.logMem("Armadura de suspensão total necessária As,susp: "+AsSusp.toFixed(2)+" cm²");
			const AsSuspVertices = percAreaVertices*AsSusp/4;
			this.logMem("Armadura de suspensão necessária por vértice As,susp,vert: "+AsSuspVertices.toFixed(2)+" cm²");
			const AsSuspLateral = (1-percAreaVertices)*AsSusp/4;
			this.logMem("Armadura de suspensão necessária por face lateral As,susp,lat: "+AsSuspLateral.toFixed(2)+" cm²");

			
			this.logMem("-----------------------------Sentido x:--------------------------------"); 
			const Asx = this.calculaArmaduraLado(params.pilarX, Nsd, Myd, Fxd, params.compEmbutimento, params.espColarinho, params.espJunta);
			const sigmaBielaX = Asx[0];
			if(sigmaBielaX > sigmaBielaLimite)
				this.logMem("ERRO: Tensão na biela do cálice na direção x é maior que a tensão limite admissível!");
			
			maxSigmaBiela = sigmaBielaX > maxSigmaBiela ? sigmaBielaX : maxSigmaBiela;
			Ashp = Asx[1] > Ashp ? Asx[1] : Ashp;
			Ashs = Asx[2] > Ashs ? Asx[2] : Ashs;
			Asvp = Asx[3]+AsSuspVertices > Asvp ? Asx[3]+AsSuspVertices : Asvp;
			Asvs = Asx[4]+AsSuspLateral > Asvs ? Asx[4]+AsSuspLateral : Asvs;

			this.logMem("-----------------------------Sentido y:--------------------------------");
			const Asy = this.calculaArmaduraLado(params.pilarY, Nsd, Mxd, Fyd, params.compEmbutimento, params.espColarinho, params.espJunta);
			const sigmaBielaY = Asy[0];
			if(sigmaBielaY > sigmaBielaLimite)
				this.logMem("ERRO: Tensão na biela do cálice na direção y é maior que a tensão limite admissível!");

			maxSigmaBiela = sigmaBielaY > maxSigmaBiela ? sigmaBielaY : maxSigmaBiela;
			Ashp = Asy[1] > Ashp ? Asy[1] : Ashp;
			Ashs = Asy[2] > Ashs ? Asy[2] : Ashs;
			Asvp = Asy[3]+AsSuspVertices > Asvp ? Asy[3]+AsSuspVertices : Asvp;
			Asvs = Asy[4]+AsSuspLateral > Asvs ? Asy[4]+AsSuspLateral : Asvs;

		}
		if((Ashp+Ashs) < Asmin ){
			Ashp = Ashp + (0.5*Asmin - Ashp);
			Ashs = Ashs + (0.5*Asmin - Ashs);
		}
		if((Asvp+Asvs) < Asmin ){
			Asvp = Asvp + (0.5*Asmin - Asvp);
			Asvs = Asvs + (0.5*Asmin - Asvs);
		}
		this.logMem("-------------------------Final-------------------------------");
		this.logMem("Armadura horizontal principal necessária Ashp:"+Ashp.toFixed(2)+" cm²");
		this.logMem("Armadura horizontal de distribuição Ashs:"+Ashs.toFixed(2)+" cm²");
		this.logMem("Armadura vertical principal necessária Asvp:"+Asvp.toFixed(2)+" cm²");		
		this.logMem("Armadura vertical de distribuição Asvs:"+Asvs.toFixed(2)+" cm²");

	}
}