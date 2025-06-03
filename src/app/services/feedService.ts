import { Feed } from '../../types/feed';
import { BlockedPhrase } from '../services/blockedPhrases';

/** Default feed URL for Ars Technica */
export const DEFAULT_FEED_URL = 'https://feeds.arstechnica.com/arstechnica/index';

/**
 * Fetches a pre-filtered RSS feed from the API
 * All filtering happens server-side to prevent race conditions
 *
 * @param url The RSS feed URL to fetch (defaults to Ars Technica)
 * @param userId The authenticated user's ID (optional)
 * @param blockedCategories Local blocked categories for anonymous users
 * @param blockedPhrases Local blocked phrases for anonymous users
 * @returns Parsed and filtered Feed object with title, description, and items
 */
export const fetchFilteredRSSFeed = async (
  url: string = DEFAULT_FEED_URL,
  userId?: string,
  blockedCategories?: string[],
  blockedPhrases?: BlockedPhrase[]
): Promise<Feed> => {
  try {
    const response = await fetch('/api/fetchFilteredRSS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        userId,
        blockedCategoriesLocal: blockedCategories,
        blockedPhrasesLocal: blockedPhrases,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch RSS feed');
    }

    const data = await response.json();

    // Note: We no longer save unfiltered feed data to localStorage
    // The feed is already filtered server-side

    return data;
  } catch (err) {
    console.error('Error fetching RSS feed:', err);
    throw err;
  }
};
