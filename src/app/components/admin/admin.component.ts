import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ngModel
import { Router } from '@angular/router';

import { supabase } from '../../core/supabase.client';
import { AuthService } from '../../core/auth.service';

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string | null;
  page_path: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
  source?: string | null;
};

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  loading = true;
  error = '';
  leads: Lead[] = [];

  // notification settings
  notifyNewLead = false;
  notifyEmail = '';

  // save UI state
  saving = false;
  saveOk = false;
  saveError = '';

  constructor(private auth: AuthService, private router: Router) {}

  async ngOnInit() {
    const ok = await this.auth.isAdmin();
    if (!ok) { this.router.navigateByUrl('/login'); return; }

    try {
      // load settings (single row)
      const { data: settings, error: sErr } = await supabase
        .from('admin_settings')
        .select('id, notify_new_lead, email_to')
        .limit(1)
        .maybeSingle();

      if (sErr) throw sErr;
      if (settings) {
        this.notifyNewLead = !!settings.notify_new_lead;
        this.notifyEmail = settings.email_to || '';
      }

      // load leads
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.leads = (data ?? []) as Lead[];
    } catch (e: any) {
      this.error = e?.message || 'Failed to load admin data';
    } finally {
      this.loading = false;
    }
  }

  async saveSettings() {
    this.saveOk = false;
    this.saveError = '';
    this.saving = true;

    try {
      if (!this.notifyEmail) this.notifyNewLead = false;

      // check if row exists
      const { data: existing, error: selErr } = await supabase
        .from('admin_settings')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (selErr) throw selErr;

      let err = null;

      if (existing?.id) {
        const { error } = await supabase
          .from('admin_settings')
          .update({
            notify_new_lead: this.notifyNewLead,
            email_to: this.notifyEmail
          })
          .eq('id', existing.id);
        err = error;
      } else {
        const { error } = await supabase
          .from('admin_settings')
          .insert({
            notify_new_lead: this.notifyNewLead,
            email_to: this.notifyEmail
          });
        err = error;
      }

      if (err) {
        console.error('saveSettings update/insert error:', err);
        this.saveError = err.message || 'Failed to save settings';
        this.saveOk = false;
      } else {
        this.saveOk = true;
      }
    } catch (e: any) {
      console.error('saveSettings exception:', e);
      this.saveError = e?.message || 'Failed to save settings';
      this.saveOk = false;
    } finally {
      this.saving = false;
      if (this.saveOk) setTimeout(() => (this.saveOk = false), 1500);
    }
  }

  async signOut() {
    await this.auth.signOut();
    this.router.navigateByUrl('/login');
  }

  exportCsv() {
    const header = ['created_at','name','email','phone','message'];
    const rows = this.leads.map(l => [
      l.created_at, l.name, l.email, l.phone, l.message ?? ''
    ]);
    const csv = [header, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'leads.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}