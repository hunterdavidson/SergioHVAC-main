import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from './supabase.client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private started = false;

  private sessionSub = new BehaviorSubject<Session | null>(null);
  /** Emits current session (null if signed out) */
  readonly session$ = this.sessionSub.asObservable();

  private readySub = new BehaviorSubject<boolean>(false);
  /** Emits true once init() has completed at least once */
  readonly ready$ = this.readySub.asObservable();

  /** Call once at app start (safe to call multiple times). */
  async init(): Promise<void> {
    if (this.started) return;
    this.started = true;

    // 1) Restore session once
    const { data, error } = await supabase.auth.getSession();
    if (error) console.warn('[auth] getSession error:', error);
    this.sessionSub.next(data?.session ?? null);

    // 2) Subscribe to future changes (ONE listener total)
    supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      this.sessionSub.next(session ?? null);
    });

    this.readySub.next(true);
  }

  /** Ensure init finished before reading session (useful in guards). */
  async waitUntilReady(): Promise<void> {
    // If nobody started auth yet, start it now (idempotent)
    if (!this.started) await this.init();
    if (this.readySub.value) return;
    // Wait until ready === true (don’t resolve on initial false)
    await firstValueFrom(this.ready$.pipe(filter(Boolean), take(1)));
  }

  /** Sign in with email + password */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data; // onAuthStateChange will update the cache
  }

  /** Sign out current user */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /** Simple “logged-in means admin” check (cached; does NOT call Supabase). */
  isAdmin(): boolean {
    return !!this.sessionSub.value;
  }

  /** Convenience getter to read current session without network. */
  getSessionSync(): Session | null {
    return this.sessionSub.value;
  }
}
