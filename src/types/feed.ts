/**
 * Type definitions for RSS feed data
 */

/**
 * Represents a single item from an RSS feed
 */
export type FeedItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  creator?: string;
  content?: string;
  contentSnippet?: string;
  categories?: string[];
};

/**
 * Represents a complete RSS feed with metadata and items
 */
export type Feed = {
  title?: string;
  description?: string;
  items: FeedItem[];
};
