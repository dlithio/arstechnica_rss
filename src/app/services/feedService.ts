import { Feed } from '../../types/feed';
import { setItem, STORAGE_KEYS } from '../utils/localStorage';

/** Default feed URL for Ars Technica */
export const DEFAULT_FEED_URL = 'https://feeds.arstechnica.com/arstechnica/index';

// Helper function to log feed events
const logFeedEvent = (message: string, data?: any): void => {
  try {
    if (typeof window !== 'undefined' && window.emitDebugLog) {
      const stack = new Error().stack?.split('\n').slice(2, 4).join(' → ') || '';
      const dataStr = data
        ? typeof data === 'object'
          ? ' with data count: ' + (data.items?.length || 'unknown')
          : JSON.stringify(data)
        : '';

      window.emitDebugLog(`${message}${dataStr} | Location: ${stack}`, 'feed');
    }
  } catch (error) {
    console.error('Error in feed debug logging:', error);
  }
};

/**
 * Fetches an RSS feed from the API and saves it to localStorage
 *
 * Uses a server-side API route to avoid CORS issues when fetching RSS feeds
 *
 * @param url The RSS feed URL to fetch (defaults to Ars Technica)
 * @returns Parsed Feed object with title, description, and items
 */
export const fetchRSSFeed = async (url: string = DEFAULT_FEED_URL): Promise<Feed> => {
  logFeedEvent(`Starting to fetch RSS feed from URL: ${url}`);

  try {
    const fetchStartTime = new Date();
    logFeedEvent(`Fetch request initiated at: ${fetchStartTime.toISOString()}`);

    const response = await fetch(`/api/fetchRSS?url=${encodeURIComponent(url)}`);

    if (!response.ok) {
      logFeedEvent(`Feed fetch failed with status: ${response.status}`);
      throw new Error('Failed to fetch RSS feed');
    }

    const data = await response.json();
    const fetchEndTime = new Date();
    const fetchDuration = fetchEndTime.getTime() - fetchStartTime.getTime();

    logFeedEvent(`Feed fetch completed in ${fetchDuration}ms`, data);

    // Save feed data to localStorage
    setItem(STORAGE_KEYS.FEED_DATA, data);
    logFeedEvent('Feed data saved to localStorage');

    return data;
  } catch (err) {
    logFeedEvent(`Error fetching RSS feed: ${err instanceof Error ? err.message : String(err)}`);
    console.error('Error fetching RSS feed:', err);
    throw err;
  }
};
