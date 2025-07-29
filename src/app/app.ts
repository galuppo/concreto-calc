import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterOutlet } from '@angular/router';

@Component({
	selector: 'app-root',
	imports: [
		MatToolbarModule,
		RouterOutlet,
		MatIconModule,
		MatButtonModule,
		MatSidenavModule,
		CommonModule
	],
	templateUrl: './app.html',
	styleUrl: './app.scss'
})
export class App {
	protected title = 'concreto-calc';
	protected toggleElements: Map<string, boolean> = new Map<string, boolean>;

	constructor(private router: Router){
	}

	protected toggle(element: string){
		const val = this.toggleElements.get(element);
		if(!val)
			this.toggleElements.set(element,true);
		else
			this.toggleElements.set(element, !val);
	}

	protected visible(element: string): boolean{
		const val = this.toggleElements.get(element);
		if(!val)
			return false;
		else 
			return val;
	}

	protected redirect(url: string) {
		this.router.navigateByUrl(url);
	}
}
