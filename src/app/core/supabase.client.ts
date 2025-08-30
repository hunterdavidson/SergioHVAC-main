// src/app/core/supabase.client.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

// Type signature Supabase expects
type LockFunc = <R>(name: string, acquireTimeout: number, fn: () => Promise<R>) => Promise<R>;

/**
 * Production-safe navigator lock:
 * - If Locks API is missing, just run fn (same as Supabase fallback).
 * - If acquireTimeout > 0, respect it.
 * - If acquireTimeout === 0 (Supabase's "immediate" path), wait for the lock,
 *   but with our own MAX_WAIT_MS so we never hang forever.
 */
const MAX_WAIT_MS = 5000; // tweak if you want
const waitNavigatorLock: LockFunc = async (name, acquireTimeout, fn) => {
  const n: any = typeof navigator !== 'undefined' ? navigator : undefined;
  const supportsLocks = !!n?.locks?.request;

  if (!supportsLocks) {
    // No Web Locks API: run without cross-tab coordination (Supabase does similar).
    return await fn();
  }

  if (acquireTimeout > 0) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), acquireTimeout);
    try {
      return await n.locks.request(
        name,
        { mode: 'exclusive', signal: ac.signal },
        fn
      );
    } finally {
      clearTimeout(t);
    }
  }

  // Supabase uses { ifAvailable: true } here and throws if unavailable.
  // We wait instead BUT cap the wait so we don't hang indefinitely.
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), MAX_WAIT_MS);
  try {
    return await n.locks.request(
      name,
      { mode: 'exclusive', signal: ac.signal },
      fn
    );
  } finally {
    clearTimeout(t);
  }
};

// HMR-safe singleton
declare global { var __sb__: SupabaseClient | undefined; }

function makeClient(): SupabaseClient {
  return createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sb-ptuytccsuledaktkntzu-auth',
      // 👇 prevent the "immediate lock failed" noise by waiting
      lock: waitNavigatorLock,
    },
  });
}

export const supabase: SupabaseClient =
  typeof window === 'undefined' ? makeClient() : (globalThis.__sb__ ||= makeClient());
