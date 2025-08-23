import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

type LeadPayload = {
  name: string;
  email: string;
  phone: string;
  message?: string | null; // optional
  page_path?: string;
  utm?: { source?: string; medium?: string; campaign?: string };
};

@Component({
  selector: 'app-contact',
  standalone: true,
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  imports: [CommonModule, FormsModule, HttpClientModule]
})
export class ContactComponent {
  loading = false;
  isSubmitted = false;
  error = '';

  formData: { name: string; email: string; phone: string; message: string } = {
    name: '',
    email: '',
    phone: '',
    message: ''
  };

  constructor(private http: HttpClient) {}

  async onSubmit(form: NgForm) {
    this.error = '';
    if (form.invalid || this.loading) return;

    this.loading = true;
    try {
      const payload: LeadPayload = {
        name: this.formData.name.trim(),
        email: this.formData.email.trim(),
        phone: this.formData.phone.trim(),
        message: this.formData.message.trim() ? this.formData.message.trim() : null, // optional
        page_path: typeof window !== 'undefined' ? window.location.pathname : '',
        utm: this.getUtm(),
      };

      const res: any = await this.http
        .post('/api/leads', payload, {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        })
        .toPromise();

      if (res?.ok) {
        this.isSubmitted = true;
        form.resetForm();
      } else {
        this.error = res?.error || 'Something went wrong. Please try again.';
      }
    } catch {
      this.error = 'Could not send your message. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  private getUtm() {
    if (typeof window === 'undefined') return {};
    const q = new URLSearchParams(window.location.search);
    return {
      source: q.get('utm_source') || undefined,
      medium: q.get('utm_medium') || undefined,
      campaign: q.get('utm_campaign') || undefined,
    };
  }
}