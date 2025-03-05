'use client';

import { useState, useEffect, useCallback } from 'react';

type FeedItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  creator?: string;
  content?: string;
  contentSnippet?: string;
  categories?: string[];
};

type Feed = {
  title?: string;
  description?: string;
  items: FeedItem[];
};

export default function RSSFeedViewer() {
  // Hardcoded Ars Technica feed URL
  const FEED_URL = 'https://feeds.arstechnica.com/arstechnica/index';

  // Initialize state
  const [feed, setFeed] = useState<Feed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blockedCategories, setBlockedCategories] = useState<string[]>([]);
  const [filteredItems, setFilteredItems] = useState<FeedItem[]>([]);

  // Load saved data from localStorage on initial render
  useEffect(() => {
    // Use try-catch to handle potential localStorage errors
    try {
      // Load blocked categories
      const savedBlockedCategories = localStorage.getItem('rssViewerBlockedCategories');
      if (savedBlockedCategories) {
        setBlockedCategories(JSON.parse(savedBlockedCategories));
      }

      // Load feed data
      const savedFeed = localStorage.getItem('rssViewerFeedData');
      if (savedFeed) {
        setFeed(JSON.parse(savedFeed));
      }
    } catch (err) {
      console.error('Error loading from localStorage:', err);
    }
  }, []);

  // Filter items whenever feed or blocked categories change
  useEffect(() => {
    if (!feed) {
      setFilteredItems([]);
      return;
    }

    // Filter out items that have any blocked category
    const filtered = feed.items.filter((item) => {
      if (!item.categories || item.categories.length === 0) return true;

      // Check if any of the item's categories are in the blocked list
      return !item.categories.some((category) => blockedCategories.includes(category));
    });

    setFilteredItems(filtered);
  }, [feed, blockedCategories]);

  // Add a category to the block list
  const blockCategory = (category: string) => {
    if (!blockedCategories.includes(category)) {
      const newBlockedCategories = [...blockedCategories, category];
      setBlockedCategories(newBlockedCategories);
      // Save to localStorage
      localStorage.setItem('rssViewerBlockedCategories', JSON.stringify(newBlockedCategories));
    }
  };

  // Remove a category from the block list
  const unblockCategory = (category: string) => {
    const newBlockedCategories = blockedCategories.filter((c) => c !== category);
    setBlockedCategories(newBlockedCategories);
    // Save to localStorage
    localStorage.setItem('rssViewerBlockedCategories', JSON.stringify(newBlockedCategories));
  };

  // Clear all blocked categories
  const clearBlockedCategories = () => {
    setBlockedCategories([]);
    // Save to localStorage
    localStorage.setItem('rssViewerBlockedCategories', JSON.stringify([]));
  };

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // We need to use a server action or API route because RSS-Parser is a Node.js library
      // and can't run directly in the browser due to CORS restrictions
      const response = await fetch(`/api/fetchRSS?url=${encodeURIComponent(FEED_URL)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch RSS feed');
      }

      const data = await response.json();
      setFeed(data);

      // Save feed data to localStorage
      localStorage.setItem('rssViewerFeedData', JSON.stringify(data));
    } catch (err) {
      setError('Error fetching RSS feed. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [FEED_URL]);

  // Auto-fetch feed on initial load
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      {loading && <p className="text-gray-600">Loading feed...</p>}
      {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
      {!loading && !error && !feed && (
        <button
          onClick={fetchFeed}
          className="px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Reload Feed
        </button>
      )}

      {feed && (
        <div>
          <div className="divide-y">
            {filteredItems.map((item, index) => (
              <article key={index} className="py-4">
                <h3 className="text-xl font-semibold mb-2">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {item.title}
                  </a>
                </h3>
                {item.pubDate && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-500">
                      {new Date(item.pubDate).toLocaleDateString()}
                      {item.creator && ` • ${item.creator}`}
                    </p>

                    {item.categories && item.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.categories.map((category, i) => (
                          <span
                            key={i}
                            className={`inline-block text-xs px-2 py-0.5 rounded-full cursor-pointer ${
                              blockedCategories.includes(category)
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            onClick={() => blockCategory(category)}
                            title="Click to block this category"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {item.contentSnippet && <p className="text-gray-700">{item.contentSnippet}</p>}
              </article>
            ))}
          </div>

          {feed.items.length > 0 && filteredItems.length === 0 && (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">All items are filtered due to blocked categories.</p>
              <button
                onClick={clearBlockedCategories}
                className="mt-2 text-blue-600 hover:underline text-sm"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Blocked Categories section moved to bottom */}
          {blockedCategories.length > 0 && (
            <div className="mt-10 p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-red-800">Blocked Categories</h3>
                <button
                  className="text-xs text-red-600 hover:text-red-800"
                  onClick={clearBlockedCategories}
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {blockedCategories.map((category, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full cursor-pointer hover:bg-red-200"
                    onClick={() => unblockCategory(category)}
                    title="Click to unblock"
                  >
                    {category}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 ml-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                ))}
              </div>
              <p className="text-xs text-red-600 mt-2">
                {feed &&
                  filteredItems.length < feed.items.length &&
                  `${feed.items.length - filteredItems.length} items hidden due to blocked categories.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
