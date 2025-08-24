import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { SettingsService } from '../../core/settings.service';
import { supabase } from '../../core/supabase.client';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  private settingsService = inject(SettingsService);
  get settings() {
    return this.settingsService.value;
  }

  loading = false;
  isSubmitted = false;
  error = '';

  formData = {
    name: '',
    email: '',
    phone: '',
    message: '',
  };

  private getUtmParams() {
    const p = new URLSearchParams(window.location.search);
    return {
      utm_source: p.get('utm_source'),
      utm_medium: p.get('utm_medium'),
      utm_campaign: p.get('utm_campaign'),
    };
  }

  async onSubmit(form: NgForm) {
    if (form.invalid || this.loading) return;

    this.loading = true;
    this.error = '';
    this.isSubmitted = false;

    try {
      const { name, email, phone, message } = this.formData;

      // Construct payload for the "leads" table
      const utms = this.getUtmParams();
      const payload = {
        name: name?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        message: (message || '').trim() || null,
        page_path: window.location?.pathname ?? null,
        source: 'website',
        utm_source: utms.utm_source,
        utm_medium: utms.utm_medium,
        utm_campaign: utms.utm_campaign,
      };

      const { error } = await supabase.from('leads').insert(payload);

      if (error) {
        console.error('[leads.insert] error:', error);
        this.error = error.message || 'Failed to send your request.';
        return;
      }

      // Success
      this.isSubmitted = true;
      form.resetForm();
    } catch (e: any) {
      console.error('[contact submit] exception:', e);
      this.error = e?.message || 'Failed to send your request.';
    } finally {
      this.loading = false;
    }
  }
}