// Usage examples for Supabase Storage with localStorage fallback

import { storage, supabase } from './supabase-storage.js';

// ===== UPLOADING FILES =====

// Upload a file (auto-falls back to localStorage if Supabase fails)
async function uploadInventoryImage(file, itemId) {
  const path = `items/${itemId}/${file.name}`;
  const result = await storage.uploadFile(file, path);
  
  if (result.success) {
    console.log(`File saved to ${result.source}`);
    return result;
  } else {
    console.error('Upload failed:', result.error);
  }
}

// Upload multiple files
async function uploadMultipleFiles(files, itemId) {
  const results = [];
  for (const file of files) {
    const result = await storage.uploadFile(file, `items/${itemId}/${file.name}`);
    results.push(result);
  }
  return results;
}

// ===== DOWNLOADING FILES =====

// Download a file
async function getItemImage(itemId, fileName) {
  const path = `items/${itemId}/${fileName}`;
  const result = await storage.downloadFile(path);
  
  if (result.success) {
    console.log(`File retrieved from ${result.source}`);
    return result.data;
  } else {
    console.error('Download failed:', result.error);
  }
}

// ===== LISTING FILES =====

// List all files (from available source)
async function listItemImages(itemId) {
  const result = await storage.listFiles();
  
  if (result.success) {
    console.log(`Files from ${result.source}:`, result.data);
    return result.data.filter(f => f.name.startsWith(`items/${itemId}`));
  }
}

// ===== GETTING PUBLIC URLS =====

// Get public URL for Supabase files
async function getImageUrl(itemId, fileName) {
  const path = `items/${itemId}/${fileName}`;
  const result = await storage.getPublicUrl(path);
  
  if (result.success) {
    return result.url;
  }
  // Fallback: return localStorage data URL
  const download = await storage.downloadFile(path);
  return download.data;
}

// ===== DELETING FILES =====

// Delete a file (removes from both sources)
async function deleteItemImage(itemId, fileName) {
  const path = `items/${itemId}/${fileName}`;
  await storage.deleteFile(path);
  console.log('File deleted from all sources');
}

// ===== MONITORING STORAGE =====

// Check storage status
function checkStorageUsage() {
  const status = storage.getStorageStatus();
  console.log('Storage Status:', status);
  
  const { localStorage } = status;
  console.log(`LocalStorage: ${(localStorage.used / 1024).toFixed(2)}MB / ${(localStorage.max / 1024).toFixed(2)}MB`);
  console.log(`Files: ${localStorage.fileCount}`);
}

// ===== USING WITH INDEXEDDB (Your existing setup) =====

// Save file metadata to IndexedDB
async function saveItemWithImage(itemData, file) {
  // Save item to IndexedDB
  const itemId = await db.transaction('items', 'readwrite')
    .objectStore('items')
    .add(itemData);
  
  // Upload file to storage
  const uploadResult = await uploadInventoryImage(file, itemId);
  
  // Update item with file info
  itemData.fileInfo = {
    fileName: file.name,
    uploadedTo: uploadResult.source,
    uploadedAt: new Date().toISOString(),
  };
  
  await db.transaction('items', 'readwrite')
    .objectStore('items')
    .put(itemData);
  
  return itemData;
}

// ===== AUTHENTICATION (Optional) =====

// Set up auth session
async function initializeAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    console.log('User authenticated:', session.user.email);
    return session;
  } else {
    console.log('No active session');
  }
}

// Sign up
async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) {
    console.error('Sign up failed:', error.message);
    return null;
  }
  
  return data.user;
}

// Sign in
async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Sign in failed:', error.message);
    return null;
  }
  
  return data.session;
}

// Sign out
async function signOut() {
  await supabase.auth.signOut();
  console.log('Signed out');
}

// Export all functions
export {
  uploadInventoryImage,
  uploadMultipleFiles,
  getItemImage,
  listItemImages,
  getImageUrl,
  deleteItemImage,
  checkStorageUsage,
  saveItemWithImage,
  initializeAuth,
  signUp,
  signIn,
  signOut,
};
