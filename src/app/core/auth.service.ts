import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async signOut() {
    await supabase.auth.signOut();
  }

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session ?? null;
  }

  async isAdmin(): Promise<boolean> {
    const session = await this.getSession();
    const role = (session?.user?.app_metadata as Record<string, unknown>)?.['role'];
    return role === 'admin';
  }  
}
