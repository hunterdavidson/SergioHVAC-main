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

  // pagination
  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 1;
  pages: number[] = [];

  constructor(private auth: AuthService, private router: Router) {}

  private computePages() {
    this.totalPages = Math.max(1, Math.ceil(this.total / this.pageSize));
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    if (this.page > this.totalPages) this.page = this.totalPages;
  }

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
      // load first page of leads
      await this.loadLeads(1);
    } catch (e: any) {
      this.error = e?.message || 'Failed to load admin data';
    } finally {
      this.loading = false;
    }
  }

  async loadLeads(page: number = 1) {
    this.loading = true;
    this.error = '';

    // guard: never request negative ranges
    const desiredPage = Math.max(1, page);
    const from = (desiredPage - 1) * this.pageSize;
    const to = from + this.pageSize - 1;

    try {
      const { data, error, count } = await supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // If API ever returns undefined count, derive a fallback when on first page
      this.total = typeof count === 'number' ? count : (from === 0 ? (data?.length ?? 0) : this.total);
      this.leads = (data ?? []) as Lead[];

      // If we somehow navigated beyond the last page (e.g., items deleted), pull the last page
      this.computePages();
      if (this.leads.length === 0 && desiredPage > 1 && this.total > 0) {
        const last = Math.max(1, Math.ceil(this.total / this.pageSize));
        if (last !== desiredPage) {
          await this.loadLeads(last);
          return;
        }
      }

      this.page = desiredPage;
    } catch (e: any) {
      this.error = e?.message || 'Failed to load leads';
      this.leads = [];
      // keep existing total so pagination UI doesn’t jump to 0 on transient error
    } finally {
      this.computePages();
      this.loading = false;
    }
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.page) return;
    void this.loadLeads(page);
  }

  nextPage() { this.changePage(this.page + 1); }
  prevPage() { this.changePage(this.page - 1); }

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