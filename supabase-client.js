// Loads @supabase/supabase-js (via CDN import) for plain static apps.
// This module creates the Supabase client using globals provided by supabase-runtime-config.js.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

// IMPORTANT: this app must still render offline if Supabase config is missing.
// So we do NOT throw during module load.
const hasConfig = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

export const supabaseClient = hasConfig
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getSupabaseClient() {
  return supabaseClient;
}


