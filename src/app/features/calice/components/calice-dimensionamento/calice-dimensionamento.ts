import { AfterViewInit, Component } from '@angular/core';
import { CaliceDimensionamento, CaliceDimensionamentoParams, Cargas } from '../../models/calice-dimensionamento.model';
import { ClassesConcreto, Concreto } from '../../../concreto/models/concreto.model';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
	selector: 'app-calice-dimensionamento',
	imports: [
		MatCardModule,
		MatButtonModule,
		FormsModule,
		DecimalPipe,
		MatExpansionModule
	],
	templateUrl: './calice-dimensionamento.html',
	styleUrl: './calice-dimensionamento.scss'
})
export class CaliceDimensionamentoComponent implements AfterViewInit {

	protected classesConcreto: Concreto[] = [
		ClassesConcreto.C20,
		ClassesConcreto.C25,
		ClassesConcreto.C30,
		ClassesConcreto.C35,
		ClassesConcreto.C40];

	protected caliceDimParams: CaliceDimensionamentoParams = {
		nome: 'Cal01',
		pilarX: 60,
		pilarY: 40,
		espColarinho: 20,
		espJunta: 7.5,
		compEmbutimento: 120,
		concreto: ClassesConcreto.C30
	};

	ngAfterViewInit(): void {
		const calDim: CaliceDimensionamento = new CaliceDimensionamento();
		const loads: Cargas = {
			N: 32.37,
			Mx: 0.79,
			My: 7.02,
			Fx: 1.92,
			Fy: 0.15
		}

		calDim.dimensionaCalice(this.caliceDimParams, [loads]);
	}

}
