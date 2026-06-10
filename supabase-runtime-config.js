// Runtime Supabase config for plain static hosting.
// Set these globals before importing other modules.
// NOTE: Replace SUPABASE_URL with your project URL.

window.SUPABASE_URL = window.SUPABASE_URL || '';
window.SUPABASE_URL = window.SUPABASE_URL || 'https://noiwkbfsgyqicxaoatfx.supabase.co';
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'sb_publishable_T_ad2hGo4-lZZBcFchUMyw_MuQN3TRV';

// Optional: expose redirect URL used for magic link.
// IMPORTANT: this must match your real deployed origin and what Supabase allows.
// Default to the current origin so magic-link callbacks work in local/dev builds.
window.SUPABASE_EMAIL_REDIRECT_TO = window.SUPABASE_EMAIL_REDIRECT_TO || window.location.origin;


