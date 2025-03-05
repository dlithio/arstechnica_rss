'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getLatestBlockedCategories, saveBlockedCategories } from '../services/blockedCategories';
import { fetchRSSFeed, DEFAULT_FEED_URL } from '../services/feedService';
import {
  getLastVisitTime,
  updateLastVisitTime,
  getLastVisitFromLocalStorage,
} from '../services/lastVisitService';
import { Feed, FeedItem } from '../../types/feed';
import { getItem, setItem, STORAGE_KEYS } from '../utils/localStorage';
import FeedItemComponent from './FeedItem';
import ThemeToggle from './ThemeToggle';
import StagedCategoriesBanner from './StagedCategoriesBanner';
import BlockedCategoriesManager from './BlockedCategoriesManager';

// Helper function to format relative time
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // Convert to minutes and hours
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    return `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
};

export default function RSSFeedViewer() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Initialize state
  const [feed, setFeed] = useState<Feed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blockedCategories, setBlockedCategories] = useState<string[]>([]);
  const [stagedCategories, setStagedCategories] = useState<string[]>([]); // Categories staged for blocking
  const [filteredItems, setFilteredItems] = useState<FeedItem[]>([]);
  const [syncingPreferences, setSyncingPreferences] = useState(false);
  // Initialize lastVisit with localStorage data immediately
  const [lastVisit, setLastVisit] = useState<Date | null>(() => {
    if (typeof window !== 'undefined') {
      return getLastVisitFromLocalStorage();
    }
    return null;
  });

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
    const savedFeed = getItem<Feed | null>(STORAGE_KEYS.FEED_DATA, null);
    if (savedFeed) {
      setFeed(savedFeed);
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

    // Sort items based on pubDate and seen status
    const sorted = [...filtered].sort((a, b) => {
      if (!a.pubDate || !b.pubDate) return 0;

      const dateA = new Date(a.pubDate);
      const dateB = new Date(b.pubDate);

      // Check if items are seen or not
      const aIsSeen = lastVisit ? dateA < lastVisit : false;
      const bIsSeen = lastVisit ? dateB < lastVisit : false;

      // New items first, then by date (newest to oldest)
      if (aIsSeen !== bIsSeen) {
        return aIsSeen ? 1 : -1; // New items (not seen) first
      }
      return dateB.getTime() - dateA.getTime(); // Newest first
    });

    setFilteredItems(sorted);
  }, [feed, blockedCategories, lastVisit]);

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
        setItem(STORAGE_KEYS.BLOCKED_CATEGORIES, newBlockedCategories);
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
        setItem(STORAGE_KEYS.BLOCKED_CATEGORIES, newBlockedCategories);
      }
    } catch (err) {
      console.error('Error removing blocked category:', err);
    }
  };

  // Clear all blocked categories
  const clearBlockedCategories = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBlockedCategories([]);

    // Save to localStorage and/or Supabase
    try {
      if (user) {
        await saveBlockedCategories(user.id, []);
      } else {
        setItem(STORAGE_KEYS.BLOCKED_CATEGORIES, []);
      }
    } catch (err) {
      console.error('Error clearing blocked categories:', err);
    }
  };

  const fetchFeed = useCallback(async (resetVisitTime = false) => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchRSSFeed(DEFAULT_FEED_URL);
      setFeed(data);

      // If resetVisitTime is true, update the last visit time
      if (resetVisitTime) {
        await updateLastVisitTime();
        const updatedTime = await getLastVisitTime();
        setLastVisit(updatedTime);
      }
    } catch (err) {
      setError('Error fetching RSS feed. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load last visit time
  useEffect(() => {
    async function loadLastVisitTime() {
      try {
        const lastVisitTime = await getLastVisitTime();
        setLastVisit(lastVisitTime);
      } catch (err) {
        console.error('Error loading last visit time:', err);
      }
    }

    loadLastVisitTime();
  }, [user]);

  // Auto-fetch feed on initial load
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Update last visit time when component mounts
  useEffect(() => {
    if (mounted) {
      updateLastVisitTime().catch((err) => console.error('Error updating last visit time:', err));
    }
  }, [mounted]);

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
          onClick={() => fetchFeed()}
          className="px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Reload Feed
        </button>
      )}

      <StagedCategoriesBanner
        stagedCategories={stagedCategories}
        unstageCategoryToggle={unstageCategoryToggle}
        setStagedCategories={setStagedCategories}
        applyBlockedCategories={applyBlockedCategories}
      />

      {feed && (
        <div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredItems.map((item, index) => (
              <FeedItemComponent
                key={index}
                item={item}
                blockedCategories={blockedCategories}
                stagedCategories={stagedCategories}
                stageCategory={stageCategory}
                lastVisit={lastVisit}
              />
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

          {lastVisit && (
            <div className="text-center my-6 py-2 border-t border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-[var(--text-secondary)]">
                Last Visit: {formatRelativeTime(lastVisit)}
              </span>
            </div>
          )}

          <BlockedCategoriesManager
            blockedCategories={blockedCategories}
            unblockCategory={unblockCategory}
            clearBlockedCategories={clearBlockedCategories}
            totalItems={feed?.items?.length || 0}
            filteredItemsCount={filteredItems.length}
          />
        </div>
      )}

      <ThemeToggle />
    </div>
  );
}
