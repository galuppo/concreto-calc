import { Component, OnDestroy } from '@angular/core';
import { CaliceRecord, CaliceService } from '../../services/calice-service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { DecimalPipe } from '@angular/common';
import { BehaviorSubject, Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

@Component({
	selector: 'calice-list',
	imports: [
		MatTableModule,
		MatButtonModule,
		DecimalPipe,
		MatIconModule
	],
	templateUrl: './calice-list.html',
	styleUrl: './calice-list.scss'
})
export class CaliceListComponent implements OnDestroy {
	protected calices: CaliceRecord[] = [];
	private serviceSubscription?: Subscription;
	private onClickEdit$: BehaviorSubject<CaliceRecord | undefined> = new BehaviorSubject<CaliceRecord | undefined>(undefined);

	constructor(private caliceService: CaliceService) {
		this.updateList();
		this.serviceSubscription = this.caliceService.getItensChanged().subscribe(() => this.updateList());
	}

	ngOnDestroy(): void {
		this.serviceSubscription?.unsubscribe();
	}

	private updateList() {
		this.calices = this.caliceService.getAll();
	}

	protected onClickEdit(cal: CaliceRecord) {
		this.onClickEdit$.next(cal);
	}

	protected onClickDelete(cal: CaliceRecord) {
		this.caliceService.remove(cal.model.nome);
	}

	onEdit(): BehaviorSubject<CaliceRecord | undefined> {
		return this.onClickEdit$;
	}
}
