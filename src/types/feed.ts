// Define types for RSS feed data
export type FeedItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  creator?: string;
  content?: string;
  contentSnippet?: string;
  categories?: string[];
};

export type Feed = {
  title?: string;
  description?: string;
  items: FeedItem[];
};
