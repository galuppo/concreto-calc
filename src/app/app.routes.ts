import { Routes } from '@angular/router';
import { CaliceDetalhamentoComponent } from './features/calice/components/calice-detalhamento/calice-detalhamento';
import { EstacaDetalhamentoComponent } from './features/estacas/components/estaca-detalhamento/estaca-detalhamento';

export const routes: Routes = [
	{
		path:'calice/detalhamento',
		component: CaliceDetalhamentoComponent
	},
	{
		path:'estaca/detalhamento',
		component: EstacaDetalhamentoComponent
	}
];
