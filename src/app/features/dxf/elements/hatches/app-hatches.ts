import { HatchGradient, HatchPattern, point2d } from "../../../../../../../dxf-writer/lib";

export class AppHatchFactory {

	public static LinhasParalelas(angle: number, scale: number): HatchPattern {

		const pattern = new HatchPattern({
			name: "Linhas Paralelas",
		});

		pattern.add({
			angle: 0+angle,
			base: point2d(),
			offset: point2d(0, 1*scale),
			dashLengths: [9999999]
		});

		return pattern;
	}
	public static AR_CONC(scale?: number): HatchPattern {
		if(!scale)
			scale = 1;

		const pattern = new HatchPattern({
			name: "AR_CONC"
		});

		//first triangle
		let base = point2d(Math.random()*100,Math.random()*100);
		pattern.add({
			angle: -8.81583601,
			base: base,
			offset: point2d(46.73309724*scale, 48.70593001*scale),
			dashLengths: [4.5*scale, -49.49999919*scale]
		});
		pattern.add({
			angle: 46.1842,
			base: base,
			offset: point2d(53.36204643*scale, -8.27598363*scale),
			dashLengths: [5.62500006*scale, -61.87499991*scale]
		});
		pattern.add({
			angle: 96.63563531,
			base: point2d(base.x+4.44683727*scale, base.y-0.68966535*scale),
			offset: point2d(53.36204643*scale, -8.27598363*scale),
			dashLengths: [4.78051717*scale, -52.58568824*scale]
		});

		// second triangle
		base = point2d(Math.random()*100,Math.random()*100);
		pattern.add({
			angle: -34.00000704,
			base: base,
			offset: point2d(42.01112355*scale, 16.12655771*scale),
			dashLengths: [2.99999973*scale, -33.00000027*scale]
		});
		pattern.add({
			angle: 21,
			base: base,
			offset: point2d(29.84535271*scale, -20.13094439*scale),
			dashLengths: [3.75*scale, -41.25000461*scale]
		});
		pattern.add({
			angle: 71.45143881,
			base: point2d(base.x+2.48711235*scale, base.y-1.67757887*scale),
			offset: point2d(29.84535271*scale, -20.13094439*scale),
			dashLengths: [3.18700989*scale, -35.05710579*scale]
		});

		//third triangle
		base = point2d(Math.random()*100,Math.random()*100);
		pattern.add({
			angle: -4.99999973,
			base: base,
			offset: point2d(28.92544032*scale, 34.47199925*scale),
			dashLengths: [3.00000003*scale, -32.99999922*scale]
		});
		pattern.add({
			angle: 49.99999529,
			base: base,
			offset: point2d(35.86300825*scale, -3.13761961*scale),
			dashLengths: [3.74998434*scale, -41.24999966*scale]
		});
		pattern.add({
			angle: 100.45173882,
			base: point2d(base.x+2.98858412*scale, base.y-0.26146722*scale),
			offset: point2d(35.86300825*scale, -3.13761961*scale),
			dashLengths: [3.18702133*scale, -35.05710700*scale]
		});



		base = point2d(Math.random()*100,Math.random()*100);
		pattern.add({
			angle: 37.5,
			base: base,
			offset: point2d(53.9242*scale, 65.2018*scale),
			dashLengths: [0, -165.608*scale, 0, -170.18*scale, 0, -168.275*scale]
		});
		base = point2d(Math.random()*100,Math.random()*100);
		pattern.add({
			angle: 7.5,
			base: base,
			offset: point2d(79.3242*scale, 90.6018*scale),
			dashLengths: [0, -97.028*scale, 0, -161.798*scale, 0, -64.135*scale]
		});
		base = point2d(Math.random()*100,Math.random()*100);
		pattern.add({
			angle: -32.5,
			base: base,
			offset: point2d(117.434*scale, 68.0212*scale),
			dashLengths: [0, -63.5*scale, 0, -198.12*scale, 0, -262.89*scale]
		});
		base = point2d(Math.random()*100,Math.random()*100);
		pattern.add({
			angle: -42.5,
			base: base,
			offset: point2d(92.0344*scale, 118.821*scale),
			dashLengths: [0, -82.55*scale, 0, -131.572*scale, 0, -186.69*scale]
		});


		return pattern;
	}
	public static Solid(color: number): HatchGradient {
		const grad = new HatchGradient({
			first: color,
			second: color
		});
		return grad;
	}
	public static teste(): HatchPattern {
		const pattern = new HatchPattern({
			name: "Teste",
		});

		let op = {
			angle: -5,
			base: point2d(),
			offset: point2d(0, 1),
			dashLengths: [1, -1]
		}
		pattern.add(op);
		pattern.add({
			angle: 42.5,
			base: point2d(0, 0),
			offset: point2d(0, 1),
			dashLengths: [1, -1.7024]
		});

		return pattern;
	}



	
}