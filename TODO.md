# Inventory App

The app stores inventory data in IndexedDB and photos/receipts in localStorage.
There is no account, sign-up, login, or Supabase dependency.

Barcode lookups validate UPC/EAN/GTIN/ISBN checksums before making a request,
try Open Library first, and fall back to UPCitemdb when no Open Library result
is found.

## Manual verification

- Add a room and item, reload, and confirm the data remains.
- Attach a photo and receipt, reload, and open both files.
- Scan a valid ISBN and confirm Open Library data is used when available.
- Scan a valid retail barcode and confirm UPCitemdb fallback works.
- Try an invalid or damaged barcode and confirm no API request is made.
