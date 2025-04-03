import { Feed } from '../../types/feed';
import { setItem, STORAGE_KEYS } from '../utils/localStorage';

/** Default feed URL for Ars Technica */
export const DEFAULT_FEED_URL = 'https://feeds.arstechnica.com/arstechnica/index';

/**
 * Fetches an RSS feed from the API and saves it to localStorage
 *
 * Uses a server-side API route to avoid CORS issues when fetching RSS feeds
 *
 * @param url The RSS feed URL to fetch (defaults to Ars Technica)
 * @returns Parsed Feed object with title, description, and items
 */
export const fetchRSSFeed = async (url: string = DEFAULT_FEED_URL): Promise<Feed> => {
  try {
    const response = await fetch(`/api/fetchRSS?url=${encodeURIComponent(url)}`);

    if (!response.ok) {
      throw new Error('Failed to fetch RSS feed');
    }

    const data = await response.json();

    // Save feed data to localStorage
    setItem(STORAGE_KEYS.FEED_DATA, data);

    return data;
  } catch (err) {
    console.error('Error fetching RSS feed:', err);
    throw err;
  }
};
