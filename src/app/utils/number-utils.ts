export function round(value: number, digits: number): number {
	return +Number(Math.round(Number(value + 'e' + digits)) + 'e-' + digits);
}

export function roundUp(value: number, digits: number): number {
	return Math.ceil(round(value, digits+1));
}