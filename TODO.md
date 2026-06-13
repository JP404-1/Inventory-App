- [ ] Inspect current index.html IndexedDB CRUD and media field usage
- [x] Add/ensure Supabase column `items.receipt_url` (text) for storing storage path (option A)
- [ ] Patch index.html to read/write rooms/items/collections from Supabase instead of IndexedDB
- [ ] Patch index.html to persist `items.image_url` and `items.receipt_url` after storage.uploadFile
- [ ] Patch render logic to download image/receipt from storage for items
- [ ] Disable destructive collection deletion; auto-create default collection per room (no UI creation)
- [ ] Manual test: signup/login, add room, add item, upload image/receipt, reload

