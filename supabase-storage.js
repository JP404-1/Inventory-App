// Supabase Storage Initialization with localStorage Fallback
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Storage configuration
const STORAGE_CONFIG = {
  bucket: 'inventory-items',
  localStorageKey: 'inventoryFiles',
  maxLocalStorageSize: 5 * 1024 * 1024, // 5MB
};

class HybridStorage {
  constructor() {
    this.supabase = supabase;
    this.localCache = this.loadLocalCache();
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
  async uploadFile(file, path) {
    try {
      // Try Supabase first
      const { data, error } = await this.supabase.storage
        .from(STORAGE_CONFIG.bucket)
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
  async downloadFile(path) {
    try {
      const { data, error } = await this.supabase.storage
        .from(STORAGE_CONFIG.bucket)
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
  async deleteFile(path) {
    try {
      // Try Supabase first
      const { error } = await this.supabase.storage
        .from(STORAGE_CONFIG.bucket)
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
  async listFiles() {
    try {
      const { data, error } = await this.supabase.storage
        .from(STORAGE_CONFIG.bucket)
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

  // Get file URL (Supabase public URL)
  async getPublicUrl(path) {
    try {
      const { data } = this.supabase.storage
        .from(STORAGE_CONFIG.bucket)
        .getPublicUrl(path);

      return { success: true, url: data.publicUrl };
    } catch (e) {
      console.error('Failed to get public URL:', e);
      return { success: false, error: e.message };
    }
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
