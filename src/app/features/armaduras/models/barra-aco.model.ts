enum BitolaBarraDeAco {
	Ø5,
	Ø6_3,
	Ø8,
	Ø10,
	Ø12_5,
	Ø16,
	Ø20,
	Ø25
}

export class BarraDeAco {
	private bit: BitolaBarraDeAco

	constructor(d: BitolaBarraDeAco) {
		this.bit = d;
	}

	get dmm(): number {
		switch (this.bit) {
			case BitolaBarraDeAco.Ø5: return 5;
			case BitolaBarraDeAco.Ø6_3: return 6.3;
			case BitolaBarraDeAco.Ø8: return 8;
			case BitolaBarraDeAco.Ø10: return 10;
			case BitolaBarraDeAco.Ø12_5: return 12.5;
			case BitolaBarraDeAco.Ø16: return 16;
			case BitolaBarraDeAco.Ø20: return 20;
			case BitolaBarraDeAco.Ø25: return 25;
		}
	}

	get asCm2(): number {
		switch (this.bit) {
			case BitolaBarraDeAco.Ø5: return 0.196;
			case BitolaBarraDeAco.Ø6_3: return 0.312;
			case BitolaBarraDeAco.Ø8: return 0.503;
			case BitolaBarraDeAco.Ø10: return 0.785;
			case BitolaBarraDeAco.Ø12_5: return 1.227;
			case BitolaBarraDeAco.Ø16: return 2.011;
			case BitolaBarraDeAco.Ø20: return 3.142;
			case BitolaBarraDeAco.Ø25: return 4.909;
		}
	}

	get kgM(): number {
		switch (this.bit) {
			case BitolaBarraDeAco.Ø5: return 0.154;
			case BitolaBarraDeAco.Ø6_3: return 0.245;
			case BitolaBarraDeAco.Ø8: return 0.395;
			case BitolaBarraDeAco.Ø10: return 0.617;
			case BitolaBarraDeAco.Ø12_5: return 0.963;
			case BitolaBarraDeAco.Ø16: return 1.578;
			case BitolaBarraDeAco.Ø20: return 2.466;
			case BitolaBarraDeAco.Ø25: return 3.853;
		}
	}
}

export const BarrasDeAco = {
	Ø5: new BarraDeAco(BitolaBarraDeAco.Ø5),
	Ø6_3: new BarraDeAco(BitolaBarraDeAco.Ø6_3),
	Ø8: new BarraDeAco(BitolaBarraDeAco.Ø8),
	Ø10: new BarraDeAco(BitolaBarraDeAco.Ø10),
	Ø12_5: new BarraDeAco(BitolaBarraDeAco.Ø12_5),
	Ø16: new BarraDeAco(BitolaBarraDeAco.Ø16),
	Ø20: new BarraDeAco(BitolaBarraDeAco.Ø20),
	Ø25: new BarraDeAco(BitolaBarraDeAco.Ø25)
}