import { Routes } from '@angular/router';
import { CaliceDetalhamentoComponent } from './features/calice/components/calice-detalhamento/calice-detalhamento';
import { EstacaDetalhamentoComponent } from './features/estacas/components/estaca-detalhamento/estaca-detalhamento';
import { ReacaoEstacasComponent } from './features/blocos-coroamento/components/reacao-estacas/reacao-estacas';
import { CaliceDimensionamentoComponent } from './features/calice/components/calice-dimensionamento/calice-dimensionamento';

export const routes: Routes = [
	{
		path:'calice/detalhamento',
		component: CaliceDetalhamentoComponent
	},
	{
		path:'calice/dimensionamento',
		component: CaliceDimensionamentoComponent
	},
	{
		path:'estaca/detalhamento',
		component: EstacaDetalhamentoComponent
	},
	{
		path:'bloco/reacao_estacas',
		component: ReacaoEstacasComponent
	}
];
