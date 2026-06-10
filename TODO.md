# TODO - Magic link fix (Supabase + PWA)

## Plan
- Diagnose why magic link doesn’t change auth/session state.
- Add debug output to confirm whether Supabase URL params are present and whether Supabase auth parsing runs.
- Ensure `emailRedirectTo` matches the actual origin where the app is hosted.
- Add safety refresh of session after page load.

## Steps
1. Patch `index.html` to show current URL params and auth/session state in a visible debug panel, plus console logs.
2. Patch `index.html` to re-check `supabaseClient.auth.getSession()` after initAuth and after DOM loaded.
3. Update magic link `emailRedirectTo` logic to default to current `window.location.origin` (not GitHub pages).
4. Clear/disable service worker cache during debugging.
5. Re-test magic link end-to-end.

