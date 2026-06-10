// Supabase Storage helper for plain static apps.
// NOTE: Your bucket(s) are PRIVATE, so callers must use an authenticated Supabase client.
// This module expects a globally available Supabase instance via setSupabaseClient().

import { STORAGE_BUCKET_PHOTOS, STORAGE_BUCKET_RECEIPTS } from './supabase-config.js';

let supabase = null;

// Storage configuration
const STORAGE_CONFIG = {
  localStorageKey: 'inventoryFiles',
  maxLocalStorageSize: 5 * 1024 * 1024, // 5MB (small offline fallback only)
};

export function setSupabaseClient(client) {
  supabase = client;
}

function assertSupabase() {
  if (!supabase) throw new Error('Supabase client not initialized. Call setSupabaseClient() first.');
}

function getBucket(type) {
  if (type === 'image') return STORAGE_BUCKET_PHOTOS;
  if (type === 'receipt') return STORAGE_BUCKET_RECEIPTS;
  throw new Error(`Unknown file type: ${type}`);
}

class HybridStorage {
  constructor() {
    this.localCache = this.loadLocalCache();
  }

  get client() {
    assertSupabase();
    return supabase;
  }

  // Load cache from localStorage
  loadLocalCache() {
    try {
      const cached = localStorage.getItem(STORAGE_CONFIG.localStorageKey);
      return cached ? JSON.parse(cached) : {};
    } catch (e) {
      console.error('Failed to load local cache:', e);
      return {};
    }
  }

  // Save cache to localStorage
  saveLocalCache() {
    try {
      const size = JSON.stringify(this.localCache).length;
      if (size > STORAGE_CONFIG.maxLocalStorageSize) {
        console.warn('Local storage cache exceeds max size');
        return false;
      }
      localStorage.setItem(STORAGE_CONFIG.localStorageKey, JSON.stringify(this.localCache));
      return true;
    } catch (e) {
      console.error('Failed to save local cache:', e);
      return false;
    }
  }

  // Upload file to Supabase with localStorage fallback
  async uploadFile(file, path, type) {
    try {
      // Try Supabase first
      const { data, error } = await this.client.storage
        .from(getBucket(type))
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      console.log('Uploaded to Supabase:', data);
      return { success: true, source: 'supabase', data };
    } catch (supabaseError) {
      console.warn('Supabase upload failed, using localStorage:', supabaseError);
      return this.uploadToLocalStorage(file, path);
    }
  }

  // Upload to localStorage as fallback
  async uploadToLocalStorage(file, path) {
    try {
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onload = (e) => {
          this.localCache[path] = {
            data: e.target.result, // base64
            type: file.type,
            size: file.size,
            timestamp: Date.now(),
          };
          this.saveLocalCache();
          resolve({
            success: true,
            source: 'localStorage',
            data: { path },
          });
        };
        reader.onerror = () => {
          resolve({ success: false, error: 'Failed to read file' });
        };
        reader.readAsDataURL(file);
      });
    } catch (e) {
      console.error('localStorage upload failed:', e);
      return { success: false, error: e.message };
    }
  }

  // Download file from Supabase with localStorage fallback
  async downloadFile(path, type) {
    try {
      const { data, error } = await this.client.storage
        .from(getBucket(type))
        .download(path);

      if (error) throw error;

      console.log('Downloaded from Supabase:', path);
      return { success: true, source: 'supabase', data };
    } catch (supabaseError) {
      console.warn('Supabase download failed, checking localStorage:', supabaseError);
      return this.downloadFromLocalStorage(path);
    }
  }

  // Download from localStorage as fallback
  downloadFromLocalStorage(path) {
    const cached = this.localCache[path];
    if (cached) {
      return {
        success: true,
        source: 'localStorage',
        data: cached.data,
      };
    }
    return { success: false, error: 'File not found' };
  }

  // Delete file
  async deleteFile(path, type) {
    try {
      // Try Supabase first
      const { error } = await this.client.storage
        .from(getBucket(type))
        .remove([path]);

      if (error) throw error;

      console.log('Deleted from Supabase:', path);
    } catch (supabaseError) {
      console.warn('Supabase delete failed:', supabaseError);
    }

    // Also delete from localStorage
    if (this.localCache[path]) {
      delete this.localCache[path];
      this.saveLocalCache();
    }
  }

  // List files from Supabase
  async listFiles(type) {
    try {
      const { data, error } = await this.client.storage
        .from(getBucket(type))
        .list();

      if (error) throw error;

      console.log('Files from Supabase:', data);
      return { success: true, source: 'supabase', data };
    } catch (supabaseError) {
      console.warn('Supabase list failed, using localStorage:', supabaseError);
      const localFiles = Object.keys(this.localCache).map((path) => ({
        name: path,
        ...this.localCache[path],
      }));
      return { success: true, source: 'localStorage', data: localFiles };
    }
  }

  // Get file URL for private buckets is NOT recommended.
  // Keep this method stubbed to avoid accidental public URL usage.
  async getPublicUrl() {
    return { success: false, error: 'Bucket is PRIVATE; use authenticated downloadFile(path, type) instead.' };
  }

  // Clear localStorage cache
  clearLocalCache() {
    this.localCache = {};
    localStorage.removeItem(STORAGE_CONFIG.localStorageKey);
  }

  // Get storage status
  getStorageStatus() {
    const localSize = JSON.stringify(this.localCache).length;
    return {
      localStorage: {
        used: localSize,
        max: STORAGE_CONFIG.maxLocalStorageSize,
        percentage: (localSize / STORAGE_CONFIG.maxLocalStorageSize) * 100,
        fileCount: Object.keys(this.localCache).length,
      },
    };
  }
}

// Export singleton instance
export const storage = new HybridStorage();
export { supabase };
