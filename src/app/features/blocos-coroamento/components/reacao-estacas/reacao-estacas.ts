import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';

@Component({
	selector: 'reacao-estacas',
	imports: [
		MatCardModule,
		MatButtonModule,
		MatTabsModule,
		CommonModule,
		FormsModule
	],
	templateUrl: './reacao-estacas.html',
	styleUrl: './reacao-estacas.scss'
})
export class ReacaoEstacasComponent implements AfterViewInit {
	@ViewChild('canConvencao') canvasConvencao!: ElementRef<HTMLCanvasElement>;
	@ViewChild('can2Estacas') canvasBloco2Estacas!: ElementRef<HTMLCanvasElement>;
	N: number = 10;
	Mx: number = 0;
	My: number = 0;
	dEixoEstaca: number = 90;
	hBloco: number = 90;
	dFaceBloco: number = 15;
	dEstaca: number = 30;


	constructor() {

	}



	private criaImagemConvencaoCargas() {
		const context = this.canvasConvencao.nativeElement.getContext("2d")!;
		const cWidth = this.canvasConvencao.nativeElement.clientWidth;
		const cHeight = this.canvasConvencao.nativeElement.clientHeight;
		context.fillStyle = "white";
		context.fillRect(0, 0, cWidth, cHeight);
		//Contorno
		// context.strokeRect(0, 0, cWidth, cHeight);

		//Eixos
		const pOri = { x: cWidth * .15, y: cHeight * .8 };
		const p0 = { x: pOri.x, y: pOri.y * 0.2 };
		const p1 = { x: pOri.x + pOri.y * 0.8, y: pOri.y };

		context.beginPath();
		context.moveTo(p0.x, p0.y);
		context.lineTo(pOri.x, pOri.y);
		context.lineTo(p1.x, p1.y);
		context.stroke();

		//Setas eixos
		const l = cHeight * 0.10;
		//Eixo Y
		context.beginPath();
		context.moveTo(p0.x, p0.y);
		context.lineTo(p0.x + l / 2, p0.y + l);
		context.lineTo(p0.x - l / 2, p0.y + l);
		context.lineTo(p0.x, p0.y);
		context.fillStyle = "black";
		context.fill();
		context.strokeText("y", p0.x, p0.y * 0.8);
		//Eixo x
		context.beginPath();
		context.moveTo(p1.x, p1.y);
		context.lineTo(p1.x - l, p1.y - l / 2);
		context.lineTo(p1.x - l, p1.y + l / 2);
		context.lineTo(p1.x, p1.y);
		context.fill();
		context.strokeText("x", p1.x * 1.01, p1.y);

		//Seta My
		const p3 = { x: pOri.x, y: (p0.y + pOri.y) / 2 };
		const r = cWidth * .1;

		context.beginPath();
		context.arc(p3.x, p3.y, r, Math.PI, 0);
		context.stroke();

		context.beginPath();
		context.moveTo(p3.x + r, p3.y);
		context.lineTo(p3.x + r * 1.5, p3.y - r * .5);
		context.lineTo(p3.x + r * 0.5, p3.y - r * .5);
		context.lineTo(p3.x + r, p3.y);
		context.fill();

		context.strokeText("My", p3.x + r * 1.5, p3.y);

		//Seta Mx
		const p4 = { x: (p1.x + pOri.x) / 2, y: pOri.y };
		context.beginPath();
		context.arc(p4.x, p4.y, r, 1.5 * Math.PI, 0.5 * Math.PI);
		context.stroke();

		context.beginPath();
		context.moveTo(p4.x, p4.y + r);
		context.lineTo(p4.x + r * .5, p4.y + r * 1.5);
		context.lineTo(p4.x + r * .5, p4.y + r * 0.5);
		context.lineTo(p4.x, p4.y + r);
		context.fill();

		context.strokeText("Mx", p4.x - r * 1.5, p4.y + r * 1.5);



	}

	private getWidthBloco2Estacas(): number {
		//considerando na horizontal (ângulo 0)
		return 2 * (this.dFaceBloco + this.dEstaca) + this.dEixoEstaca;
	}

	private getLengthBloco2Estacas(): number {
		return 2 * (this.dFaceBloco) + this.dEstaca;
	}

	private criaImagemBloco2Estacas() {
		const canvas = this.canvasBloco2Estacas.nativeElement;
		const ctx = canvas.getContext("2d");
		const cWidth = canvas.clientWidth;
		const cHeight = canvas.clientHeight;

	}

	onTabChange($event: MatTabChangeEvent) {
		console.log($event.tab.textLabel);
		switch ($event.tab.textLabel) {
			case "2 Estacas":
				this.criaImagemBloco2Estacas();
				break;
		
			default:
				break;
		}		
		
	}

	ngAfterViewInit(): void {
		// this.criaImagemConvencaoCargas();
	}
}
