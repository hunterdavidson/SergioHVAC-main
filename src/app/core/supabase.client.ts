// src/app/core/supabase.client.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

// Use globalThis so it works in browsers and won't explode if SSR is ever added
declare global {
  // eslint-disable-next-line no-var
  var __sb__: SupabaseClient | undefined;
}

function makeClient(): SupabaseClient {
  console.info('[supabase] client created'); // Should log once per full reload
  return createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Unique key to prevent lock collisions with other projects/domains
      storageKey: 'sb-ptuytccsuledaktkntzu-auth',
      // Detect OAuth redirect hash if you add OAuth
      detectSessionInUrl: true,
    },
  });
}

// HMR-safe singleton (Angular’s Vite builder can hot-replace modules)
export const supabase: SupabaseClient =
  (typeof window === 'undefined'
    ? makeClient() // Not in a browser (just in case)
    : (globalThis.__sb__ ||= makeClient())); // Browser: stash single instance
