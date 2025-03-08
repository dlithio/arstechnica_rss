'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { Feed, FeedItem } from '../../types/feed';
import { getLatestBlockedCategories, saveBlockedCategories } from '../services/blockedCategories';
import { DEFAULT_FEED_URL, fetchRSSFeed } from '../services/feedService';
import {
  getLastVisitFromLocalStorage,
  getLastVisitTime,
  updateLastVisitTime,
} from '../services/lastVisitService';
import { getItem, setItem, STORAGE_KEYS } from '../utils/localStorage';
import { useAuth } from './AuthContext';

interface FeedContextType {
  // Feed data
  feed: Feed | null;
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
      }

      // Always refresh the last visit time from sources
      const updatedTime = await getLastVisitTime();
      setLastVisit(updatedTime);
    } catch (err) {
      setError('Error fetching RSS feed. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load last visit time on initial component mount and when user changes
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

  // If not mounted yet, don't provide context to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <FeedContext.Provider
      value={{
        feed,
        loading,
        error,
        fetchFeed,
        filteredItems,
        lastVisit,
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
