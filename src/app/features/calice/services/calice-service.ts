import { Injectable } from '@angular/core';
import { Calice } from '../models/calice.model';
import { Armadura } from '../../armaduras/models/armadura.model';
import { BarraDeAco, BarrasDeAco } from '../../armaduras/models/barra-aco.model';
import { Concreto } from '../../concreto/models/concreto.model';
import { BehaviorSubject } from 'rxjs';

export type CaliceRecord = {
	model: Calice,
	quantidade: number
}

interface CaliceJSONRecord {
	quantidade: number
	nome: string
	pilarX: number
	pilarY: number
	espessuraColarinho: number
	espessuraJunta: number
	embutimento: number
	cobExterno: number
	cobInterno: number
	fckConcreto: number
	armHorzPrincipal: ArmaduraCaliceJSONRecord
	armHorzSecundaria: ArmaduraCaliceJSONRecord
	armVertPrincipal: ArmaduraCaliceJSONRecord
	armVertSecundaria: ArmaduraCaliceJSONRecord
}

interface ArmaduraCaliceJSONRecord {
	multiplo?: number;
	quantidade: number;
	numero: number;
	bitBarra: number;
	espacamento?: number;
}

@Injectable({
	providedIn: 'root'
})
export class CaliceService {
	private calices: CaliceRecord[] = [];
	private index: Map<string, number> = new Map<string, number>();
	private itensChanged$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

	private createIndex() {
		this.index = new Map<string, number>();
		for (let i = 0; i < this.calices.length; i++){
			const c = this.calices[i];
			this.index.set(c.model.nome, i);
		}
	}

	private getBarraDeAco(bit: number): BarraDeAco {
		switch (bit) {
			case 5: return BarrasDeAco.Ø5;
			case 6.3: return BarrasDeAco.Ø6_3;
			case 8: return BarrasDeAco.Ø8;
			case 10: return BarrasDeAco.Ø10;
			case 12.5: return BarrasDeAco.Ø12_5;
			case 16: return BarrasDeAco.Ø16;
			case 20: return BarrasDeAco.Ø20;
			case 25: return BarrasDeAco.Ø25;
		}
		throw new Error("Bitola não identificada! (Ø="+bit+")");
		
	}

	private load() {
		const stor = localStorage.getItem("calices");
		if (stor) {
			const JSONRecords: CaliceJSONRecord[] = JSON.parse(stor);
			this.calices = [];

			JSONRecords.forEach((r) => {
				const asHPrinc = new Armadura({
					multiplo: r.armHorzPrincipal.multiplo,
					quantidade: r.armHorzPrincipal.quantidade,
					numero: r.armHorzPrincipal.numero,
					barra: this.getBarraDeAco(r.armHorzPrincipal.bitBarra),
					espacamento: r.armHorzPrincipal.espacamento
				});
				const asHSec = new Armadura({
					multiplo: r.armHorzSecundaria.multiplo,
					quantidade: r.armHorzSecundaria.quantidade,
					numero: r.armHorzSecundaria.numero,
					barra: this.getBarraDeAco(r.armHorzSecundaria.bitBarra),
					espacamento: r.armHorzSecundaria.espacamento
				});
				const asVPrinc = new Armadura({
					multiplo: r.armVertPrincipal.multiplo,
					quantidade: r.armVertPrincipal.quantidade,
					numero: r.armVertPrincipal.numero,
					barra: this.getBarraDeAco(r.armVertPrincipal.bitBarra),
					espacamento: r.armVertPrincipal.espacamento
				});
				const asVSec = new Armadura({
					multiplo: r.armVertSecundaria.multiplo,
					quantidade: r.armVertSecundaria.quantidade,
					numero: r.armVertSecundaria.numero,
					barra: this.getBarraDeAco(r.armVertSecundaria.bitBarra),
					espacamento: r.armVertSecundaria.espacamento
				});
				const cal: Calice = {
					nome: r.nome,
					pilarX: r.pilarX,
					pilarY: r.pilarY,
					espessuraColarinho: r.espessuraColarinho,
					espessuraJunta: r.espessuraJunta,
					embutimento: r.embutimento,
					cobExterno: r.cobExterno,
					cobInterno: r.cobInterno,
					concreto: new Concreto(r.fckConcreto),
					armHorzPrincipal: asHPrinc,
					armHorzSecundaria: asHSec,
					armVertPrincipal: asVPrinc,
					armVertSecundaria: asVSec
				}

				this.calices.push({model: cal, quantidade: r.quantidade});
			});
			this.createIndex();
		}
	}

	private save() {
		const JSONRecords: CaliceJSONRecord[] = [];
		this.calices.forEach((c) => {
			const asHPrinc: ArmaduraCaliceJSONRecord = {
				multiplo: c.model.armHorzPrincipal!.multiplo,
				quantidade: c.model.armHorzPrincipal!.quantidade,
				numero: c.model.armHorzPrincipal!.numero,
				bitBarra: c.model.armHorzPrincipal!.barra.dmm,
				espacamento: c.model.armHorzPrincipal!.espacamento,
			};
			const asHSec: ArmaduraCaliceJSONRecord = {
				multiplo: c.model.armHorzSecundaria!.multiplo,
				quantidade: c.model.armHorzSecundaria!.quantidade,
				numero: c.model.armHorzSecundaria!.numero,
				bitBarra: c.model.armHorzSecundaria!.barra.dmm,
				espacamento: c.model.armHorzSecundaria!.espacamento,
			};
			const asVPrinc: ArmaduraCaliceJSONRecord = {
				multiplo: c.model.armVertPrincipal!.multiplo,
				quantidade: c.model.armVertPrincipal!.quantidade,
				numero: c.model.armVertPrincipal!.numero,
				bitBarra: c.model.armVertPrincipal!.barra.dmm,
				espacamento: c.model.armVertPrincipal!.espacamento,
			};
			const asVSec: ArmaduraCaliceJSONRecord = {
				multiplo: c.model.armVertSecundaria!.multiplo,
				quantidade: c.model.armVertSecundaria!.quantidade,
				numero: c.model.armVertSecundaria!.numero,
				bitBarra: c.model.armVertSecundaria!.barra.dmm,
				espacamento: c.model.armVertSecundaria!.espacamento,
			};
			const caliceJSON: CaliceJSONRecord = {
				quantidade: c.quantidade,
				nome: c.model.nome,
				pilarX: c.model.pilarX,
				pilarY: c.model.pilarY,
				espessuraColarinho: c.model.espessuraColarinho,
				espessuraJunta: c.model.espessuraJunta,
				embutimento: c.model.embutimento,
				cobExterno: c.model.cobExterno,
				cobInterno: c.model.cobInterno,
				fckConcreto: c.model.concreto.fckMPa,
				armHorzPrincipal: asHPrinc,
				armHorzSecundaria: asHSec,
				armVertPrincipal: asVPrinc,
				armVertSecundaria: asVSec
			}
			JSONRecords.push(caliceJSON);			
		});

		localStorage.setItem("calices", JSON.stringify(JSONRecords));
	}

	public getAll(): CaliceRecord[] {
		this.load();
		return this.calices;
	}

	public insert(record: CaliceRecord) {
		if(this.index.has(record.model.nome)){
			this.calices[this.index.get(record.model.nome)!] = record;
		} else {
			this.calices.push(record);		
			this.index.set(record.model.nome, this.calices.length-1);
		}	
		this.save();
		this.itensChanged$.next(true);
	}

	public remove(nome: string) {
		if(this.index.has(nome)){
			this.calices.splice(this.index.get(nome)!,1);
			this.save();
			this.itensChanged$.next(true);
		}
	}

	public getItensChanged(): BehaviorSubject<boolean>{
		return this.itensChanged$;
	}
}
