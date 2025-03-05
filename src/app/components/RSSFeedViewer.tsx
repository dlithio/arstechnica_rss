'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '../contexts/AuthContext';
import { getLatestBlockedCategories, saveBlockedCategories } from '../services/blockedCategories';

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

// Component doesn't need props

export default function RSSFeedViewer() {
  // Hardcoded Ars Technica feed URL
  const FEED_URL = 'https://feeds.arstechnica.com/arstechnica/index';

  // Theme handling
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Initialize state
  const [feed, setFeed] = useState<Feed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blockedCategories, setBlockedCategories] = useState<string[]>([]);
  const [stagedCategories, setStagedCategories] = useState<string[]>([]); // Categories staged for blocking
  const [filteredItems, setFilteredItems] = useState<FeedItem[]>([]);
  const [isBlockedCategoriesOpen, setIsBlockedCategoriesOpen] = useState(false); // Collapsed by default
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [syncingPreferences, setSyncingPreferences] = useState(false);

  // Theme toggle
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Toggle blocked categories visibility
  const toggleBlockedCategories = () => {
    setIsBlockedCategoriesOpen(!isBlockedCategoriesOpen);
  };

  // Sync message functionality removed

  // Load blocked categories from Supabase or localStorage
  useEffect(() => {
    async function loadBlockedCategories() {
      setSyncingPreferences(true);
      try {
        const categories = await getLatestBlockedCategories(user?.id);
        setBlockedCategories(categories);
      } catch (err) {
        console.error('Error loading blocked categories:', err);
      } finally {
        setSyncingPreferences(false);
      }
    }

    loadBlockedCategories();
  }, [user]);

  // Load feed data from localStorage on initial render
  useEffect(() => {
    try {
      const savedFeed = localStorage.getItem('rssViewerFeedData');
      if (savedFeed) {
        setFeed(JSON.parse(savedFeed));
      }
    } catch (err) {
      console.error('Error loading feed from localStorage:', err);
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

  // Stage a category for blocking (doesn't apply immediately)
  const stageCategory = (category: string) => {
    if (!blockedCategories.includes(category) && !stagedCategories.includes(category)) {
      setStagedCategories([...stagedCategories, category]);
    }
  };

  // Remove a category from the staged list
  const unstageCategoryToggle = (category: string) => {
    if (stagedCategories.includes(category)) {
      setStagedCategories(stagedCategories.filter((c) => c !== category));
    } else {
      setStagedCategories([...stagedCategories, category]);
    }
  };

  // Apply all staged categories to the block list
  const applyBlockedCategories = async () => {
    if (stagedCategories.length === 0) return;

    // Combine existing and new blocked categories
    const newBlockedCategories = [
      ...blockedCategories,
      ...stagedCategories.filter((c) => !blockedCategories.includes(c)),
    ];

    setBlockedCategories(newBlockedCategories);
    setStagedCategories([]); // Clear staged categories

    // Save to localStorage and/or Supabase
    try {
      if (user) {
        await saveBlockedCategories(user.id, newBlockedCategories);
      } else {
        localStorage.setItem('rssViewerBlockedCategories', JSON.stringify(newBlockedCategories));
      }
    } catch (err) {
      console.error('Error saving blocked categories:', err);
    }
  };

  // Remove a category from the block list
  const unblockCategory = async (category: string) => {
    const newBlockedCategories = blockedCategories.filter((c) => c !== category);
    setBlockedCategories(newBlockedCategories);

    // Save to localStorage and/or Supabase
    try {
      if (user) {
        await saveBlockedCategories(user.id, newBlockedCategories);
      } else {
        localStorage.setItem('rssViewerBlockedCategories', JSON.stringify(newBlockedCategories));
      }
    } catch (err) {
      console.error('Error removing blocked category:', err);
    }
  };

  // Handle click on Clear All button
  const handleClearAllClick = (e: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowClearConfirm(true);
  };

  // Handle canceling the clear confirmation
  const handleCancelClear = (e: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowClearConfirm(false);
  };

  // Clear all blocked categories
  const clearBlockedCategories = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBlockedCategories([]);
    setShowClearConfirm(false);

    // Save to localStorage and/or Supabase
    try {
      if (user) {
        await saveBlockedCategories(user.id, []);
      } else {
        localStorage.setItem('rssViewerBlockedCategories', JSON.stringify([]));
      }
    } catch (err) {
      console.error('Error clearing blocked categories:', err);
    }
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

  // After mounting, render is safe
  useEffect(() => {
    setMounted(true);
  }, []);

  // If not mounted yet, don't render to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto relative pb-16">
      {(loading || syncingPreferences) && <p className="text-secondary">Loading...</p>}
      {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
      {!loading && !error && !feed && (
        <button
          onClick={fetchFeed}
          className="px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Reload Feed
        </button>
      )}
      {/* Staged Categories Banner - shows when categories are staged for blocking */}
      {stagedCategories.length > 0 && (
        <div className="sticky top-0 z-10 mb-4 p-3 bg-amber-100 dark:bg-amber-900/40 rounded-md shadow-md">
          <div className="flex flex-wrap gap-1 mb-2">
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Categories staged for blocking:
            </span>
            {stagedCategories.map((category, index) => (
              <span
                key={index}
                className="inline-flex items-center bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 text-xs px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80"
                onClick={() => unstageCategoryToggle(category)}
                title="Click to remove from staging"
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
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setStagedCategories([])}
              className="text-xs text-amber-800 dark:text-amber-200 bg-amber-200 dark:bg-amber-800 px-3 py-1 rounded hover:opacity-80"
            >
              Cancel
            </button>
            <button
              onClick={applyBlockedCategories}
              className="text-xs text-white bg-blue-500 px-3 py-1 rounded hover:bg-blue-600"
            >
              Apply Blocks
            </button>
          </div>
        </div>
      )}

      {feed && (
        <div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredItems.map((item, index) => (
              <article key={index} className="py-4">
                <h3 className="text-xl font-semibold mb-2">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--blue-link)] hover:text-[var(--blue-hover)] hover:underline"
                  >
                    {item.title}
                  </a>
                </h3>
                {item.pubDate && (
                  <div className="mb-2">
                    <p className="text-sm text-[var(--text-secondary)]">
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
                                ? 'bg-[var(--blocked-tag-bg)] text-[var(--blocked-tag-text)]'
                                : stagedCategories.includes(category)
                                  ? 'bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200'
                                  : 'bg-[var(--category-bg)] text-[var(--category-text)] hover:opacity-80'
                            }`}
                            onClick={() => stageCategory(category)}
                            title="Click to stage this category for blocking"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {item.contentSnippet && (
                  <p className="text-[var(--text-primary)]">{item.contentSnippet}</p>
                )}
              </article>
            ))}
          </div>

          {feed.items.length > 0 && filteredItems.length === 0 && (
            <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-[var(--text-secondary)]">
                All items are filtered due to blocked categories.
              </p>
              <button
                onClick={clearBlockedCategories}
                className="mt-2 text-[var(--blue-link)] hover:text-[var(--blue-hover)] hover:underline text-sm"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Collapsible Blocked Categories section */}
          {blockedCategories.length > 0 && (
            <div className="mt-10 rounded-lg border border-[var(--blocked-border)] bg-[var(--blocked-bg)] shadow-sm">
              {/* Header - always visible */}
              <div
                className="flex justify-between items-center p-3 cursor-pointer hover:bg-opacity-80"
                onClick={toggleBlockedCategories}
              >
                <div className="flex items-center">
                  <h3 className="text-sm font-medium text-[var(--blocked-text)]">
                    Blocked Categories ({blockedCategories.length})
                  </h3>
                  <p className="text-xs text-[var(--blocked-text)] ml-3">
                    {feed &&
                      filteredItems.length < feed.items.length &&
                      `${feed.items.length - filteredItems.length} items hidden`}
                  </p>
                </div>

                {/* Chevron icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`text-[var(--blocked-text)] transition-transform duration-300 ${isBlockedCategoriesOpen ? 'rotate-180' : ''}`}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              {/* Collapsible content */}
              <div
                style={{
                  maxHeight: isBlockedCategoriesOpen ? '500px' : '0',
                  opacity: isBlockedCategoriesOpen ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease, opacity 0.3s ease',
                }}
              >
                <div className="px-4 pb-4">
                  <div className="flex flex-wrap gap-1 mb-4">
                    {blockedCategories.map((category, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center bg-[var(--blocked-tag-bg)] text-[var(--blocked-tag-text)] text-xs px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80"
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

                  {/* Clear All Button */}
                  {!showClearConfirm ? (
                    <div className="flex justify-center">
                      <button
                        className="text-xs text-[var(--blocked-text)] hover:opacity-80 px-3 py-1 border border-[var(--blocked-border)] rounded"
                        onClick={handleClearAllClick}
                      >
                        Clear All Blocked Categories
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-xs text-[var(--blocked-text)] mb-2">
                        Are you sure you want to clear all blocked categories?
                      </p>
                      <div className="flex justify-center gap-2">
                        <button
                          className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                          onClick={clearBlockedCategories}
                        >
                          Yes, Clear All
                        </button>
                        <button
                          className="text-xs bg-[var(--blocked-tag-bg)] text-[var(--blocked-text)] px-3 py-1 rounded hover:opacity-80"
                          onClick={handleCancelClear}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Only the central theme toggle */}
      <div className="flex justify-center my-8">
        {/* Simple theme toggle switch with dot that moves */}
        <div
          onClick={toggleTheme}
          className="w-16 h-8 bg-gray-200 dark:bg-gray-800 rounded-full shadow-inner flex items-center px-1 cursor-pointer relative overflow-hidden"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {/* Sun icon (always visible) */}
          <div className="absolute left-1.5 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-yellow-600"
            >
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          </div>

          {/* Moon icon (always visible) */}
          <div className="absolute right-1.5 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-indigo-900"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </div>

          {/* The moving slider dot */}
          <div
            className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
              theme === 'dark' ? 'translate-x-8' : 'translate-x-0'
            }`}
          ></div>
        </div>
      </div>
    </div>
  );
}
