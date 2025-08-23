import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Sign in with email + password */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  /** Sign out current user */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /** Returns true if there is an active session */
  async isAdmin(): Promise<boolean> {
    const { data, error } = await supabase.auth.getSession();
    if (error) return false;
    return !!data.session; // simple “logged-in means admin” check
  }

  /** Convenience: get current user/session */
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }
}