import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  loading = true;
  error = '';
  leads: Lead[] = [];

  // notification settings (per signed-in user)
  notifyNewLead = false;
  notifyEmail = '';

  // save UI state
  saving = false;
  saveOk = false;
  saveError = '';

  // current user
  private userId: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  async ngOnInit() {
    const ok = await this.auth.isAdmin();
    if (!ok) { this.router.navigateByUrl('/login'); return; }

    try {
      // who is signed in?
      const { data: udata, error: uerr } = await supabase.auth.getUser();
      if (uerr) throw uerr;
      this.userId = udata.user?.id ?? null;
      if (!this.userId) throw new Error('No authenticated user.');

      // load this user's settings row (if any)
      const { data: mySettings, error: sErr } = await supabase
        .from('admin_settings')
        .select('user_id, notify_new_lead, email_to')
        .eq('user_id', this.userId)
        .maybeSingle();

      if (sErr && sErr.code !== 'PGRST116') { // PGRST116 = no rows
        throw sErr;
      }

      if (mySettings) {
        this.notifyNewLead = !!mySettings.notify_new_lead;
        this.notifyEmail = mySettings.email_to || '';
      }

      // load leads for the table
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
    if (!this.userId) return;
    this.saveOk = false;
    this.saveError = '';
    this.saving = true;

    try {
      // basic normalization
      this.notifyEmail = (this.notifyEmail || '').trim();
      if (!this.notifyEmail) this.notifyNewLead = false;

      // Use UPSERT keyed by user_id so it creates the row if missing
      // Requires a unique constraint on admin_settings.user_id (see note below)
      const { error } = await supabase
        .from('admin_settings')
        .upsert(
          {
            user_id: this.userId,
            notify_new_lead: this.notifyNewLead,
            email_to: this.notifyEmail || null,
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('saveSettings upsert error:', error);
        this.saveError = error.message || 'Failed to save settings';
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

  trackById(index: number, lead: Lead): string {
    return lead.id;
  }
}