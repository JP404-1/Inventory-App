# TODO - Supabase + Magic Link + Offline-Backup (Option A)

## Plan
- Use **IndexedDB as source of truth** (offline-first).
- Add **Supabase magic-link auth** to get `auth.uid()` for per-user access.
- Use Supabase Storage (private buckets `item-photos` + `receipts`) authenticated by the logged-in user.
- Implement **sync-on-reconnect**:
  - When online and auth/session exists, upload any locally-stored Blobs to Supabase Storage.
  - After upload success, store returned URLs/paths in IndexedDB metadata fields (and optionally later mirror to Supabase tables if you provide schema).

## Steps (track progress)
1. Fix `supabase-storage.js` fully (auth-aware, two buckets, private download).
2. Add Supabase CDN + magic-link auth bootstrap in `index.html`.
3. Add UI state gating (disable uploads/edits while logged out).
4. Refactor item file handling:
   - When online+authed: upload photo/receipt Blobs to the right bucket.
   - Save returned metadata in IndexedDB and render via Blob while offline.
5. Add a minimal outbox/sync tracker in IndexedDB (e.g., `uploadStatus` + `updatedAt`).
6. Implement sync-on-reconnect.
7. Test flow: magic link login -> add item with photo/receipt -> reload -> ensure storage fetches work.


