// src/app/core/email.service.ts
import { Injectable } from '@angular/core';
import { supabase } from '../core/supabase.client';

export type LeadPayload = {
  name: string; email: string; phone: string;
  message?: string | null; page_path?: string | null;
  utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null;
};

@Injectable({ providedIn: 'root' })
export class EmailService {
  async sendLeadEmail(lead: LeadPayload, to?: string, subject?: string) {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { lead, to, subject }
    });
    if (error) throw error;
    return data;
  }
}