export function round(value: number, digits: number): number {
	return +Number(Math.round(Number(value + 'e' + digits)) + 'e-' + digits);
}

export function roundUp(value: number, digits: number): number {
	return Math.ceil(round(value, digits+1));
}

export function roundUpMultiple(value: number, multiple: number): number {
	if(multiple == 0)
		return value;
	const rest = Math.abs(value) % multiple;
	if(rest == 0)
		return value;
	if(value < 0)
		return -(Math.abs(value) - rest);
	else
		return value + multiple - rest;
}