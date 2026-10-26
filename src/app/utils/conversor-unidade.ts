export class ConversorUnidades {

	public static MPa2tfcm2(MPA: number): number {
		return MPA/100;
	}

	public static MPa2kgcm2(MPA: number): number {
		return MPA*10;
	}
}