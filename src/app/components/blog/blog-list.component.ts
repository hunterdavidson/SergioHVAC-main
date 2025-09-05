import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../core/settings.service';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogListComponent {
  settings = inject(SettingsService);
  private seo = inject(SeoService);
  imageError: Record<string, boolean> = {};

  constructor() {
    this.seo.setTitle('HVAC Blog — SV HVAC');
    this.seo.setCanonical('/blog');
    this.seo.setDescription('Tips, guides, and updates about HVAC systems in Dallas–Fort Worth.');
  }

  get posts() {
    return (this.settings.value.blog?.posts || []).filter(p => p?.published !== false);
  }

  markImgError(slug: string) {
    if (slug) this.imageError[slug] = true;
  }
}
