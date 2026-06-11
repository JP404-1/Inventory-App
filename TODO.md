# TODO

## Auth updates: remove magic link, add email/password login + signup
- [x] Inspect current auth implementation and identify magic link usage.
- [x] Update `supabase-auth.js` to remove `sendMagicLink` and add `signInWithPassword` + `signUpWithPassword`.
- [x] Update `index.html` UI/logic: replace magic link fields/buttons with email+password login + signup controls.
- [x] Implement behavior: try login first; if email not recognized, switch UI to signup mode (or show signup option) and allow user to create account.
- [ ] Verify sign-out still works and authenticated uploads/deletes still gate by `session.user`.
- [ ] Manual test: existing user login; unknown email signup; persistence after refresh.


