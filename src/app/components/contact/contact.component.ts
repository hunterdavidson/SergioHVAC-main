import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  private settingsService = inject(SettingsService);
  get settings() {
    return this.settingsService.value;
  }

  loading = false;
  isSubmitted = false;
  error = '';
  fieldErrors: Record<'name' | 'email' | 'phone' | 'message', string> = {
    name: '',
    email: '',
    phone: '',
    message: ''
  };

  formData = {
    name: '',
    email: '',
    phone: '',
    message: '',
  };

  // simple honeypot field (bots tend to fill it)
  hp: string = '';

  private getUtmParams() {
    const p = new URLSearchParams(window.location.search);
    return {
      utm_source: p.get('utm_source'),
      utm_medium: p.get('utm_medium'),
      utm_campaign: p.get('utm_campaign'),
    };
  }

  private clearErrors() {
    this.error = '';
    this.fieldErrors = { name: '', email: '', phone: '', message: '' };
  }

  private validateBeforeSend(form: NgForm): boolean {
    // Basic client-side validation to avoid noisy 400s
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRe = /^[0-9()+\-.\s]{7,20}$/;

    const name = this.formData.name?.trim();
    const email = this.formData.email?.trim();
    const phone = this.formData.phone?.trim();
    const message = this.formData.message?.trim();

    let ok = true;
    if (!name) {
      this.fieldErrors.name = 'Please enter your name.';
      ok = false;
    }
    if (!email) {
      this.fieldErrors.email = 'Please enter your email address.';
      ok = false;
    } else if (!emailRe.test(email)) {
      this.fieldErrors.email = 'Please enter a valid email address.';
      ok = false;
    }
    if (!phone) {
      this.fieldErrors.phone = 'Please enter your phone number.';
      ok = false;
    } else if (!phoneRe.test(phone)) {
      this.fieldErrors.phone = 'Please enter a valid phone number.';
      ok = false;
    }
    if (message && message.length > 4000) {
      this.fieldErrors.message = 'Message is too long (max 4000 characters).';
      ok = false;
    }

    if (!ok) {
      this.error = 'Please fix the highlighted fields below.';
    }
    return ok;
  }

  async onSubmit(form: NgForm) {
    if (form.invalid || this.loading) return;

    this.loading = true;
    this.clearErrors();
    this.isSubmitted = false;

    try {
      const { name, email, phone, message } = this.formData;
      const utms = this.getUtmParams();
      const body = {
        name: name?.trim() || '',
        email: email?.trim() || '',
        phone: phone?.trim() || '',
        message: (message || '').trim() || '',
        page_path: window.location?.pathname ?? '/',
        utm: {
          source: utms.utm_source || undefined,
          medium: utms.utm_medium || undefined,
          campaign: utms.utm_campaign || undefined,
        },
        hp: this.hp || ''
      } as const;

      // Client-side validation pass
      if (!this.validateBeforeSend(form)) {
        return;
      }

      const resp = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await resp.json().catch(() => ({} as any));
      if (!resp.ok || data?.error) {
        // Map known server responses to friendly, field-level messages
        const errMsg = (data?.error || '').toString();
        if (resp.status === 429) {
          this.error = 'Too many requests. Please try again in a few minutes.';
          return;
        }
        if (resp.status === 400) {
          if (/Invalid email/i.test(errMsg)) this.fieldErrors.email = 'Please enter a valid email address.';
          if (/Invalid phone/i.test(errMsg)) this.fieldErrors.phone = 'Please enter a valid phone number.';
          if (/Missing required fields/i.test(errMsg)) {
            if (!body.name) this.fieldErrors.name = 'Please enter your name.';
            if (!body.email) this.fieldErrors.email = 'Please enter your email address.';
            if (!body.phone) this.fieldErrors.phone = 'Please enter your phone number.';
          }
          if (/Message too long/i.test(errMsg)) this.fieldErrors.message = 'Message is too long (max 4000 characters).';
          this.error = 'Please fix the highlighted fields below.';
          return;
        }
        // Fallback for other errors
        this.error = 'Sorry, something went wrong. Please try again.';
        return;
      }

      // Success
      this.isSubmitted = true;
      form.resetForm();
      this.hp = '';

    } catch (e: any) {
      console.error('[contact submit] exception:', e);
      // Do not surface raw error; show friendly fallback
      if (!this.error && !Object.values(this.fieldErrors).some(Boolean)) {
        this.error = 'Sorry, something went wrong. Please try again.';
      }
    } finally {
      this.loading = false;
    }
  }
}
