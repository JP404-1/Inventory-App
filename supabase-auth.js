// Magic link auth helper for plain static apps.

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

export async function initAuth() {
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
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
}

export async function sendMagicLink(email) {
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

