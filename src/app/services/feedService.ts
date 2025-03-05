import { Feed } from '../../types/feed';
import { setItem, STORAGE_KEYS } from '../utils/localStorage';

// Default feed URL for Ars Technica
export const DEFAULT_FEED_URL = 'https://feeds.arstechnica.com/arstechnica/index';

// Fetch RSS feed from API
export const fetchRSSFeed = async (url: string = DEFAULT_FEED_URL): Promise<Feed> => {
  try {
    // We need to use a server action or API route because RSS-Parser is a Node.js library
    // and can't run directly in the browser due to CORS restrictions
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
