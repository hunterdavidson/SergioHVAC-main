import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from '../home/home.component';
import { ServicesComponent } from '../services/services.component';
import { PlanOverviewComponent } from '../plan-overview/plan-overview.component';
import { AboutComponent } from '../about/about.component';
import { TeamComponent } from '../team/team.component';
import { ReviewWidgetComponent } from '../review-widget/review-widget.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, HomeComponent, ServicesComponent, PlanOverviewComponent, ReviewWidgetComponent, AboutComponent, TeamComponent],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageComponent {}

