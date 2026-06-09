# Supabase Storage Setup Guide

## Prerequisites
```bash
npm install @supabase/supabase-js
```

## Step 1: Get Supabase Credentials
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings → API**
4. Copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

## Step 2: Create Storage Bucket
1. In Supabase Dashboard, go to **Storage**
2. Click **Create new bucket**
3. Name it: `inventory-items`
4. Set to **Public** for file URLs, or **Private** for authenticated access

## Step 3: Set Bucket Policies (if Private)
Go to **Storage → Policies** for `inventory-items` bucket and add:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'inventory-items' AND auth.uid()::text = owner);

-- Allow users to read their own files
CREATE POLICY "Users can read own files" ON storage.objects
  FOR SELECT TO authenticated
  WHERE (bucket_id = 'inventory-items' AND auth.uid()::text = owner);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE TO authenticated
  WHERE (bucket_id = 'inventory-items' AND auth.uid()::text = owner);
```

## Step 4: Initialize in Your App
```javascript
import { storage } from './supabase-storage.js';

// Upload file
const result = await storage.uploadFile(file, 'items/123/image.jpg');

// Download file
const data = await storage.downloadFile('items/123/image.jpg');

// Get public URL
const url = await storage.getPublicUrl('items/123/image.jpg');

// List files
const files = await storage.listFiles();

// Check storage usage
const status = storage.getStorageStatus();
```

## Step 5: Configure Environment
Create `.env` file:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## How Fallback Works
1. **Supabase First**: Tries to upload/download from Supabase
2. **Fallback to localStorage**: If Supabase fails (offline, quota exceeded, etc.), uses localStorage with base64 encoding
3. **Data Persistence**: localStorage cache is saved to browser's localStorage for offline access
4. **Size Limit**: localStorage has a 5MB default limit (configurable in supabase-storage.js)

## Storage Capacity
- **Supabase**: 100GB free per month
- **localStorage**: ~5-10MB per domain (browser dependent)

## Best Practices
- Use Supabase for large files and long-term storage
- localStorage for temporary cache and offline support
- Monitor storage status with `storage.getStorageStatus()`
- Clear cache when needed: `storage.clearLocalCache()`
- Store file metadata in IndexedDB (your existing DB)

## Combined with Your IndexedDB
```javascript
// Save item with image
async function createItem(itemData, imageFile) {
  // Upload file
  const { data } = await storage.uploadFile(imageFile, `items/${itemData.id}/${imageFile.name}`);
  
  // Store metadata in IndexedDB
  itemData.imageInfo = {
    fileName: imageFile.name,
    path: `items/${itemData.id}/${imageFile.name}`,
    uploadedAt: new Date()
  };
  
  await putRecord('items', itemData);
  return itemData;
}
```

## Troubleshooting
- **"Bucket does not exist"**: Ensure bucket name is "inventory-items"
- **CORS errors**: Check Supabase Storage settings for CORS configuration
- **localStorage full**: Check `storage.getStorageStatus()` and clear if needed
- **Offline behavior**: App automatically uses localStorage when Supabase is unavailable
