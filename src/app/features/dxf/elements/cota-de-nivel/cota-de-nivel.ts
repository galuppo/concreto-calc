import { AttachmentPoint, Entity, MText, point, Polyline, Seeder } from "../../../../../../../dxf-writer/lib";

export class CotaDeNivel {

	private seeder: Seeder;
	private textSize: number = 2;

	constructor(seeder: Seeder){	
		this.seeder = seeder;
	}

	public setTextSize(tSize: number){
		this.textSize = tSize;
	}

	public criaCotaDeNivel(textoCota: string): Entity[]{
		const ent: Entity[] =[];

		const p0 = point(this.textSize, this.textSize);

		const mText = new MText({
			seeder: this.seeder,
			height: this.textSize,
			insertionPoint: point(p0.x, p0.y+0.5*this.textSize),
			attachmentPoint: AttachmentPoint.BottomLeft,
			value: textoCota
		});
		ent.push(mText);



		
		const pLine = new Polyline({
			seeder: this.seeder,
		});
		ent.push(pLine);

		pLine.add(p0);
		pLine.add(point());
		pLine.add(point(-this.textSize, this.textSize));
		pLine.add(point(p0.x+5*this.textSize, p0.y));
		




		return ent;
	}
}