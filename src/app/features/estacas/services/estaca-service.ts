import { Injectable } from '@angular/core';
import { Estaca } from '../models/estaca.model';
import { BehaviorSubject } from 'rxjs';
import { BarraDeAco, BarrasDeAco, getBarraDeAco } from '../../armaduras/models/barra-aco.model';
import { Armadura } from '../../armaduras/models/armadura.model';
import { FormaArmaduraFactory } from '../../armaduras/forma-factory';
import { Concreto } from '../../concreto/models/concreto.model';

export type EstacaRecord = {
	model: Estaca,
	quantidade: number
}

interface EstacaJSONRecord {
	quantidade: number,
	nome: string;
	diametro: number;
	comprimento: number;
	cobrimento: number;
	fckConcreto: number;
	armLong: ArmaduraLongJSON;
	armEstribo: EstriboJSON;
}

interface ArmaduraLongJSON {
	bit: number,
	quantidade: number,
	comprimento: number
}

interface EstriboJSON {
	bit: number,
	quantidade: number,
	espacamento: number
}


@Injectable({
	providedIn: 'root'
})
export class EstacaService {
	private estacas: EstacaRecord[] = [];
	private index: Map<string, number> = new Map<string, number>();
	private itensChanged$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

	private createIndex() {
		this.index = new Map<string, number>();
		for (let i = 0; i < this.estacas.length; i++) {
			const c = this.estacas[i];
			this.index.set(c.model.nome, i);
		}
	}

	private load() {
		const stor = localStorage.getItem("estacas");
		if(!stor)
			return;
		const JSONRecord: EstacaJSONRecord[] = JSON.parse(stor);
		this.estacas = [];
		JSONRecord.forEach((r) => {
			const asLong = new Armadura({
				quantidade: r.armLong.quantidade,
				numero: 1,
				barra: getBarraDeAco(r.armLong.bit),
				forma: FormaArmaduraFactory.retaVertical(r.armLong.comprimento)
			});
			const asEstribo = new Armadura({
				quantidade: r.armEstribo.quantidade,
				numero: 2,
				barra: getBarraDeAco(r.armEstribo.bit),
				espacamento: r.armEstribo.espacamento
			});
			const est: Estaca = {
				nome: r.nome,
				diametro: r.diametro,
				comprimento: r.comprimento,
				cobrimento: r.cobrimento,
				concreto: new Concreto(r.fckConcreto),
				armLong: asLong,
				armEstribo: asEstribo
			}
			this.estacas.push({model: est, quantidade: r.quantidade});
		});
		this.createIndex();
	}

	private save() {
		const JSONRecords: EstacaJSONRecord[] =[];
		this.estacas.forEach((e) => {
			const asLong: ArmaduraLongJSON = {
				bit: e.model.armLong.barra.dmm,
				quantidade: e.model.armLong.quantidade,
				comprimento: e.model.armLong.comprimento
			};
			const asEstribo: EstriboJSON = {
				bit: e.model.armEstribo.barra.dmm,
				quantidade: e.model.armEstribo.quantidade,
				espacamento: e.model.armEstribo.espacamento!
			};
			const estacaJSON: EstacaJSONRecord = {
				quantidade: e.quantidade,
				nome: e.model.nome,
				diametro: e.model.diametro,
				comprimento: e.model.comprimento,
				cobrimento: e.model.cobrimento,
				fckConcreto: e.model.concreto.fckMPa,
				armLong: asLong,
				armEstribo: asEstribo
			};
			JSONRecords.push(estacaJSON);
		});
		localStorage.setItem("estacas", JSON.stringify(JSONRecords));
	}

	public getAll(): EstacaRecord[] {
		this.load();
		return this.estacas;
	}

	public insert(record: EstacaRecord) {
		if(this.index.has(record.model.nome)){
			this.estacas[this.index.get(record.model.nome)!] = record;
		} else {
			this.estacas.push(record);		
			this.index.set(record.model.nome, this.estacas.length-1);
		}	
		this.save();
		this.itensChanged$.next(true);
	}

	public remove(nome: string) {
		if(this.index.has(nome)){
			this.estacas.splice(this.index.get(nome)!,1);
			this.save();
			this.itensChanged$.next(true);
		}
	}


	public getItensChanged(): BehaviorSubject<boolean> {
		return this.itensChanged$;
	}
}
