import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'app-review-widget',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './review-widget.component.html',
  styleUrls: ['./review-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewWidgetComponent implements OnInit {
  settings = inject(SettingsService);
  private http = inject(HttpClient);

  get rating(): number | null {
    const r = this.settings.value?.reviews?.rating;
    return typeof r === 'number' ? r : null;
  }
  get count(): number | null {
    const c = this.settings.value?.reviews?.count;
    return typeof c === 'number' ? c : null;
  }
  get reviewUrl(): string | null {
    return this.settings.value?.reviews?.googleReviewUrl || null;
  }

  // Derived/loaded reviews to display
  public reviews: Array<{
    author: string;
    rating: number;
    text: string;
    relativeTimeDescription?: string;
    profilePhotoUrl?: string;
    source: 'google' | 'local';
  }> = [];
  public loading = false;
  public loadError: string | null = null;

  ngOnInit(): void {
    // Prefer server-fetched Google reviews if we can resolve a Place ID
    const placeId = this.resolvePlaceId();
    if (placeId) {
      this.loading = true;
      this.http
        .get<any>('/api/google-reviews', { params: { placeId } })
        .subscribe({
          next: (resp) => {
            if (resp && resp.status === 'ok') {
              // If API returned fresher rating/count, use them
              const cfg: any = this.settings.value as any;
              if (cfg && typeof cfg === 'object') {
                cfg.reviews = cfg.reviews || {};
                if (typeof resp.rating === 'number') cfg.reviews.rating = resp.rating;
                if (typeof resp.count === 'number') cfg.reviews.count = resp.count;
              }
              const list = Array.isArray(resp.reviews) ? resp.reviews : [];
              this.reviews = list.slice(0, 6).map((r: any) => ({
                author: r.author_name || r.author || 'Anonymous',
                rating: Number(r.rating || 5),
                text: String(r.text || r.snippet || ''),
                relativeTimeDescription: r.relative_time_description || r.timeDescription,
                profilePhotoUrl: r.profile_photo_url || undefined,
                source: 'google',
              })).filter((r: any) => r.text);
            } else if (resp && resp.status === 'no_key') {
              // No server key configured — gracefully fallback to local testimonials
              this.fallbackToLocalTestimonials();
            } else {
              this.fallbackToLocalTestimonials();
            }
            this.loading = false;
          },
          error: () => {
            this.loading = false;
            this.fallbackToLocalTestimonials();
          }
        });
    } else {
      this.fallbackToLocalTestimonials();
    }
  }

  private resolvePlaceId(): string | null {
    const direct = (this.settings.value?.reviews?.googlePlaceId || '').trim();
    if (direct) return direct;
    const url = (this.settings.value?.reviews?.googleReviewUrl || '').trim();
    if (!url) return null;
    try {
      const u = new URL(url);
      const pid = u.searchParams.get('placeid');
      return pid || null;
    } catch {
      return null;
    }
  }

  private fallbackToLocalTestimonials() {
    const local = this.settings.value?.reviews?.testimonials || [];
    this.reviews = (local || []).slice(0, 6).map((t: any) => ({
      author: t?.author || 'Anonymous',
      rating: Number(t?.rating || this.rating || 5),
      text: String(t?.text || ''),
      source: 'local' as const,
    })).filter((r: any) => r.text);
  }

  starsArray(n: number): number[] {
    const full = Math.round(Math.max(0, Math.min(5, n)));
    return Array.from({ length: 5 }, (_, i) => i < full ? 1 : 0);
  }

  formattedRating(n: number | null): string {
    if (typeof n !== 'number') return '';
    const isWhole = Math.abs(n - Math.round(n)) < 1e-9;
    return (isWhole ? Math.round(n).toString() : n.toFixed(1)) + '/5';
  }
}
