# TODO

## Plan
- Add ability for users to change an item’s name (especially after barcode scan).
- Keep current IndexedDB storage behavior.

## Steps
1. Update `buildItemCard()` to add a "Change Name" action button.
2. Implement `updateItemName(id)` to prompt for a non-empty name and persist it via `putRecord(STORE_ITEMS, item)`.
3. Update UI by re-rendering after the name change.
4. Verify scanned items can have their name edited and the change persists after refresh.

