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

type UserSettingsRow = {
  id?: number;
  user_id: string;
  notify_new_lead: boolean;
  email_to: string | null;
  updated_at?: string;
};

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  // auth / user
  userId: string | null = null;
  userEmail: string | null = null;

  // page state
  loading = true;
  error = '';
  leads: Lead[] = [];

  // per-user notification settings
  notifyNewLead = false;
  notifyEmail = '';

  // save UI state
  saving = false;
  saveOk = false;
  saveError = '';

  constructor(private auth: AuthService, private router: Router) {}

  async ngOnInit() {
    // Must be admin to view page
    const ok = await this.auth.isAdmin();
    if (!ok) {
      this.router.navigateByUrl('/login');
      return;
    }

    try {
      // get current user
      const { data: userData, error: uErr } = await supabase.auth.getUser();
      if (uErr || !userData?.user?.id) throw uErr ?? new Error('Not signed in');
      this.userId = userData.user.id;
      this.userEmail = userData.user.email ?? null;

      // load THIS USER'S settings row
      const { data: settings, error: sErr } = await supabase
        .from('admin_settings')
        .select('user_id, notify_new_lead, email_to')
        .eq('user_id', this.userId)
        .maybeSingle();

      if (sErr) throw sErr;

      if (settings) {
        this.notifyNewLead = !!settings.notify_new_lead;
        this.notifyEmail = settings.email_to ?? '';
      } else {
        // No row yet—don’t create one until they save.
        this.notifyNewLead = false;
        this.notifyEmail = '';
      }

      // load leads (unchanged)
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
      // if email is empty, force toggle off
      const email = (this.notifyEmail || '').trim();
      const notify = !!email && !!this.notifyNewLead;

      // upsert per-user row (unique on user_id)
      const row: UserSettingsRow = {
        user_id: this.userId,
        notify_new_lead: notify,
        email_to: email || null,
      };

      const { error } = await supabase
        .from('admin_settings')
        .upsert(row, { onConflict: 'user_id' });

      if (error) throw error;

      this.saveOk = true;
    } catch (e: any) {
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
    const header = ['created_at', 'name', 'email', 'phone', 'message'];
    const rows = this.leads.map((l) => [
      l.created_at,
      l.name,
      l.email,
      l.phone,
      l.message ?? '',
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  trackById = (_: number, l: Lead) => l.id;
}