'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { Feed, FeedItem } from '../../types/feed';
import { getLatestBlockedCategories, saveBlockedCategories } from '../services/blockedCategories';
import { DEFAULT_FEED_URL, fetchRSSFeed } from '../services/feedService';
import {
  getPreviousRssLoad,
  getPreviousRssLoadFromLocalStorage,
  updateCurrentRssLoadTime,
} from '../services/lastVisitService';
import { getItem, setItem, STORAGE_KEYS } from '../utils/localStorage';
import { useAuth } from './AuthContext';

interface FeedContextType {
  // Feed data
  feed: Feed | null; // This will now be the filtered feed
  feedOriginal: Feed | null; // Original unfiltered feed data (not for UI display)
  loading: boolean;
  error: string;
  fetchFeed: (resetVisitTime?: boolean) => Promise<void>;
  filteredItems: FeedItem[];
  lastVisit: Date | null;

  // Category management
  blockedCategories: string[];
  stagedCategories: string[];
  syncingPreferences: boolean;
  stageCategory: (category: string) => void;
  unstageCategoryToggle: (category: string) => void;
  setStagedCategories: (categories: string[]) => void;
  applyBlockedCategories: () => Promise<void>;
  unblockCategory: (category: string) => Promise<void>;
  clearBlockedCategories: (e?: React.MouseEvent) => Promise<void>;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export function FeedProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Initialize state
  const [feedOriginal, setFeedOriginal] = useState<Feed | null>(null); // Original unfiltered feed
  const [feed, setFeed] = useState<Feed | null>(null); // Filtered feed for UI display
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blockedCategories, setBlockedCategories] = useState<string[]>([]);
  const [stagedCategories, setStagedCategories] = useState<string[]>([]); // Categories staged for blocking
  const [filteredItems, setFilteredItems] = useState<FeedItem[]>([]);
  const [syncingPreferences, setSyncingPreferences] = useState(false);
  // Initialize previousRssLoad with localStorage data immediately
  const [previousRssLoad, setPreviousRssLoad] = useState<Date | null>(() => {
    if (typeof window !== 'undefined') {
      return getPreviousRssLoadFromLocalStorage();
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
    const savedOriginalFeed = getItem<Feed | null>(STORAGE_KEYS.FEED_DATA_ORIGINAL, null);
    const savedFilteredFeed = getItem<Feed | null>(STORAGE_KEYS.FEED_DATA_FILTERED, null);

    if (savedOriginalFeed) {
      setFeedOriginal(savedOriginalFeed);
    }

    if (savedFilteredFeed) {
      setFeed(savedFilteredFeed);
      // Initialize filteredItems directly from saved filtered feed
      setFilteredItems(savedFilteredFeed?.items || []);
    }
  }, []);

  // Create filtered feed whenever original feed or blocked categories change
  useEffect(() => {
    if (!feedOriginal) {
      setFilteredItems([]);
      setFeed(null);
      return;
    }

    // Filter out items that have any blocked category
    const filtered = feedOriginal.items.filter((item) => {
      if (!item.categories || item.categories.length === 0) return true;

      // Check if any of the item's categories are in the blocked list
      return !item.categories.some((category) => blockedCategories.includes(category));
    });

    // Sort items based on pubDate and seen status
    const sorted = [...filtered].sort((a, b) => {
      if (!a.pubDate || !b.pubDate) return 0;

      const dateA = new Date(a.pubDate);
      const dateB = new Date(b.pubDate);

      // Check if items are seen or not using previousRssLoad
      const aIsSeen = previousRssLoad ? dateA < previousRssLoad : false;
      const bIsSeen = previousRssLoad ? dateB < previousRssLoad : false;

      // New items first, then by date (newest to oldest)
      if (aIsSeen !== bIsSeen) {
        return aIsSeen ? 1 : -1; // New items (not seen) first
      }
      return dateB.getTime() - dateA.getTime(); // Newest first
    });

    // Create and save the filtered feed
    const filteredFeed: Feed = {
      ...feedOriginal, // Copy title and description
      items: sorted, // Replace with filtered items
    };

    setFeed(filteredFeed);
    setFilteredItems(sorted);

    // Save filtered feed to localStorage
    setItem(STORAGE_KEYS.FEED_DATA_FILTERED, filteredFeed);
  }, [feedOriginal, blockedCategories, previousRssLoad]);

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
      // Immediately use the filtered items from localStorage to prevent flashing unfiltered content
      const savedFilteredFeed = getItem<Feed | null>(STORAGE_KEYS.FEED_DATA_FILTERED, null);
      if (savedFilteredFeed) {
        // Keep showing the filtered content during loading
        setFilteredItems(savedFilteredFeed.items || []);
      }

      // Step 1: Calculate previous_rss_load before loading feed
      if (resetVisitTime) {
        const calculatedPreviousLoad = await getPreviousRssLoad();
        setPreviousRssLoad(calculatedPreviousLoad);
      }

      // Step 2: Load the RSS feed
      const data = await fetchRSSFeed(DEFAULT_FEED_URL);
      setFeedOriginal(data);

      // Save original feed data to localStorage
      setItem(STORAGE_KEYS.FEED_DATA_ORIGINAL, data);

      // The filtered feed will be created by the useEffect that watches feedOriginal

      // Step 3: After feed is loaded successfully and previous_rss_load is set,
      // update this_rss_load and last_visited_at
      if (resetVisitTime) {
        await updateCurrentRssLoadTime();
      }
    } catch (err) {
      setError('Error fetching RSS feed. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load previous_rss_load only on initial component mount
  useEffect(() => {
    // Only fetch previous_rss_load if we haven't loaded it yet
    if (!previousRssLoad) {
      async function loadPreviousRssLoad() {
        try {
          const calculatedPreviousLoad = await getPreviousRssLoad();
          setPreviousRssLoad(calculatedPreviousLoad);
        } catch (err) {
          console.error('Error loading previous RSS load time:', err);
        }
      }

      loadPreviousRssLoad();
    }
  }, [user, previousRssLoad]);

  // Auto-fetch feed on initial load
  useEffect(() => {
    fetchFeed(true); // Set resetVisitTime to true to properly initialize both timestamps
  }, [fetchFeed]);

  // We no longer automatically update on component mount
  // Instead, we only update after feed is loaded and previous_rss_load is calculated

  // After mounting, render is safe
  useEffect(() => {
    setMounted(true);
  }, []);

  // If not mounted yet, don't provide context to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <FeedContext.Provider
      value={{
        feed, // This is now the filtered feed
        feedOriginal, // Original unfiltered feed data (not for UI display)
        loading,
        error,
        fetchFeed,
        filteredItems,
        lastVisit: previousRssLoad, // Use previousRssLoad but keep the same prop name for compatibility
        blockedCategories,
        stagedCategories,
        syncingPreferences,
        stageCategory,
        unstageCategoryToggle,
        setStagedCategories,
        applyBlockedCategories,
        unblockCategory,
        clearBlockedCategories,
      }}
    >
      {children}
    </FeedContext.Provider>
  );
}

export function useFeed() {
  const context = useContext(FeedContext);
  if (context === undefined) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return context;
}
