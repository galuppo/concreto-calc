import { Component, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { EstacaRecord, EstacaService } from '../../services/estaca-service';
import { BehaviorSubject, Subscription } from 'rxjs';

@Component({
	selector: 'estaca-list',
	imports: [
		MatTableModule,
		MatButtonModule,
		MatIconModule
	],
	templateUrl: './estaca-list.html',
	styleUrl: './estaca-list.scss'
})
export class EstacaListComponent implements OnDestroy {
	protected estacas: EstacaRecord[] = [];
	private serviceSubscription?: Subscription;
	private onClickEdit$: BehaviorSubject<EstacaRecord | undefined> = new BehaviorSubject<EstacaRecord | undefined>(undefined);

	constructor(private estacaService: EstacaService) {
		this.updateList();
		this.serviceSubscription = this.estacaService.getItensChanged().subscribe(() => this.updateList());
	}

	private updateList() {
		this.estacas = this.estacaService.getAll();
	}

	protected onClickEdit(est: EstacaRecord) {
		this.onClickEdit$.next(est);
	}

	protected onClickDelete(est: EstacaRecord) {
		this.estacaService.remove(est.model.nome);
	}

	ngOnDestroy(): void {
		this.serviceSubscription?.unsubscribe();
	}

	onEdit(): BehaviorSubject<EstacaRecord | undefined> {
		return this.onClickEdit$;
	}

}
