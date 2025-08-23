import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule],   // add modules here if you use directives like *ngIf, *ngFor
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']  // <-- plural
})
export class ServicesComponent {}
