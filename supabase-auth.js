// Magic link auth helper for plain static apps.
//
// IMPORTANT: supabaseClient may be null when Supabase config is missing.
// All exported functions will throw if called without a valid client.

import { supabaseClient } from './supabase-client.js';

export let currentSession = null;

let authStateCallbacks = new Set();

function notify(session) {
  for (const cb of authStateCallbacks) {
    try {
      cb(session);
    } catch (e) {
      console.error('Auth state callback failed:', e);
    }
  }
}

function assertSupabaseClient() {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized (missing SUPABASE_URL / SUPABASE_ANON_KEY).');
  }
}

export async function initAuth() {
  assertSupabaseClient();

  const { data } = await supabaseClient.auth.getSession();
  currentSession = data.session || null;
  notify(currentSession);

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    currentSession = session || null;
    notify(currentSession);
  });

  return currentSession;
}

export function getSession() {
  return currentSession;
}

export function onAuthStateChange(cb) {
  authStateCallbacks.add(cb);
  // Fire immediately with current state
  try {
    cb(currentSession);
  } catch (e) {
    console.error('Auth state callback failed:', e);
  }
  return () => authStateCallbacks.delete(cb);
}

export async function signOut() {
  assertSupabaseClient();

  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
}

export async function sendMagicLink(email) {
  assertSupabaseClient();

  const emailRedirectTo = window.SUPABASE_EMAIL_REDIRECT_TO || window.location.origin;

  const { data, error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo,
    },
  });

  if (error) throw error;
  return data;
}

export { supabaseClient as supabase };

