/**
 * Type-safe localStorage utility functions
 */

// Get item from localStorage with type safety
export function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error retrieving ${key} from localStorage:`, err);
    return defaultValue;
  }
}

// Set item in localStorage with type safety
export function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

// Remove item from localStorage
export function removeItem(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(key, '');
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`Error removing ${key} from localStorage:`, err);
  }
}

// Constants for localStorage keys to avoid typos
export const STORAGE_KEYS = {
  FEED_DATA: 'rssViewerFeedData',
  BLOCKED_CATEGORIES: 'rssViewerBlockedCategories',
};
