import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent implements OnInit, OnDestroy {
  private seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.setTitle('Page Not Found — SV HVAC');
    this.seo.setRobots('noindex,follow');
  }

  ngOnDestroy(): void {
    this.seo.setRobots('index,follow,max-image-preview:large');
  }
}

