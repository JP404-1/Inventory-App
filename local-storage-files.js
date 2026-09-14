// Local file storage for the offline inventory app.

const STORAGE_KEY = 'inventoryFiles';
const MAX_STORAGE_SIZE = 5 * 1024 * 1024;

class LocalStorageFiles {
  constructor() {
    this.files = this.load();
  }

  load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (error) {
      console.error('Failed to load local files:', error);
      return {};
    }
  }

  save() {
    const serialized = JSON.stringify(this.files);
    if (serialized.length > MAX_STORAGE_SIZE) {
      throw new Error('Local file storage is full. Remove an existing photo or receipt first.');
    }
    localStorage.setItem(STORAGE_KEY, serialized);
  }

  async uploadFile(file, path) {
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });

    this.files[path] = {
      data,
      type: file.type,
      size: file.size,
      timestamp: Date.now(),
    };
    this.save();
    return { success: true, source: 'localStorage', data: { path } };
  }

  async downloadFile(path) {
    const file = this.files[path];
    if (!file) return { success: false, error: 'File not found.' };

    const response = await fetch(file.data);
    return { success: true, source: 'localStorage', data: await response.blob() };
  }

  deleteFile(path) {
    delete this.files[path];
    this.save();
  }

  clearLocalCache() {
    this.files = {};
    localStorage.removeItem(STORAGE_KEY);
  }

  getStorageStatus() {
    const used = JSON.stringify(this.files).length;
    return {
      localStorage: {
        used,
        max: MAX_STORAGE_SIZE,
        percentage: (used / MAX_STORAGE_SIZE) * 100,
        fileCount: Object.keys(this.files).length,
      },
    };
  }
}

export const storage = new LocalStorageFiles();
