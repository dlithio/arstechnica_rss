/**
 * Type-safe localStorage utility functions for managing client-side data
 */

/**
 * Gets an item from localStorage with type safety
 *
 * @param key The localStorage key to retrieve
 * @param defaultValue Default value to return if item doesn't exist
 * @returns The parsed value from localStorage or the default value
 */
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

/**
 * Sets an item in localStorage with type safety
 *
 * @param key The localStorage key to set
 * @param value The value to store (will be JSON stringified)
 */
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

/**
 * Removes an item from localStorage
 *
 * @param key The localStorage key to remove
 */
export function removeItem(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`Error removing ${key} from localStorage:`, err);
  }
}

/**
 * Constants for localStorage keys to avoid typos and ensure consistency
 */
export const STORAGE_KEYS = {
  BLOCKED_CATEGORIES: 'rssViewerBlockedCategories',
  BLOCKED_PHRASES: 'rssViewerBlockedPhrases',
};
