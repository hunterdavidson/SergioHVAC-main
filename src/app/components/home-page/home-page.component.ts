import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from '../home/home.component';
import { ServicesComponent } from '../services/services.component';
import { AboutComponent } from '../about/about.component';
import { TeamComponent } from '../team/team.component';
import { ContactComponent } from '../contact/contact.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, HomeComponent, ServicesComponent, AboutComponent, TeamComponent, ContactComponent],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageComponent {}
