import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  settings = inject(SettingsService).value;

  loading = false;
  isSubmitted = false;
  error = '';

  formData = {
    name: '',
    email: '',
    phone: '',
    message: '',
  };

  async onSubmit(form: NgForm) {
    if (form.invalid) return;
    this.loading = true;
    this.error = '';
    try {
      // TODO: send to backend
      await new Promise(r => setTimeout(r, 600));
      this.isSubmitted = true;
      form.resetForm();
    } catch (e: any) {
      this.error = e?.message || 'Failed to send';
    } finally {
      this.loading = false;
    }
  }
}