'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { Feed, FeedItem } from '../../types/feed';
import { getLatestBlockedCategories, saveBlockedCategories } from '../services/blockedCategories';
import { 
  BlockedPhrase, 
  clearBlockedPhrases, 
  deleteBlockedPhrase, 
  findPhraseMatches, 
  getLatestBlockedPhrases, 
  PhraseMatch, 
  saveBlockedPhrase 
} from '../services/blockedPhrases';
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
  
  // Phrase management
  blockedPhrases: BlockedPhrase[];
  searchPhrase: string;
  setSearchPhrase: (phrase: string) => void;
  searchMatchTitle: boolean;
  setSearchMatchTitle: (match: boolean) => void;
  searchMatchContent: boolean;
  setSearchMatchContent: (match: boolean) => void;
  searchCaseSensitive: boolean;
  setSearchCaseSensitive: (caseSensitive: boolean) => void;
  addBlockedPhrase: () => Promise<void>;
  removeBlockedPhrase: (phraseId: string) => Promise<void>;
  clearBlockedPhrases: () => Promise<void>;
  getPhraseMatches: (text: string | undefined, isTitle: boolean) => PhraseMatch[];
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
  
  // Blocked phrases state
  const [blockedPhrases, setBlockedPhrases] = useState<BlockedPhrase[]>([]);
  const [searchPhrase, setSearchPhrase] = useState('');
  const [searchMatchTitle, setSearchMatchTitle] = useState(true);
  const [searchMatchContent, setSearchMatchContent] = useState(true);
  const [searchCaseSensitive, setSearchCaseSensitive] = useState(false);
  
  // Initialize previousRssLoad with localStorage data immediately
  const [previousRssLoad, setPreviousRssLoad] = useState<Date | null>(() => {
    if (typeof window !== 'undefined') {
      return getPreviousRssLoadFromLocalStorage();
    }
    return null;
  });

  // Load blocked categories and phrases from Supabase or localStorage
  useEffect(() => {
    async function loadBlockedPreferences() {
      setSyncingPreferences(true);
      try {
        // Load categories
        const categories = await getLatestBlockedCategories(user?.id);
        setBlockedCategories(categories);
        
        // Load phrases
        const phrases = await getLatestBlockedPhrases(user?.id);
        setBlockedPhrases(phrases);
      } catch (err) {
        console.error('Error loading blocked preferences:', err);
      } finally {
        setSyncingPreferences(false);
      }
    }

    loadBlockedPreferences();
  }, [user]);

  // Load feed data from localStorage on initial render
  useEffect(() => {
    const savedFeed = getItem<Feed | null>(STORAGE_KEYS.FEED_DATA, null);
    if (savedFeed) {
      setFeed(savedFeed);
    }
  }, []);

  // Helper function to check if a FeedItem should be filtered by blocked phrases
  const isItemFilteredByBlockedPhrases = useCallback((item: FeedItem): boolean => {
    for (const phrase of blockedPhrases) {
      // Check title if match_title is true
      if (phrase.match_title && item.title) {
        const searchText = phrase.case_sensitive ? item.title : item.title.toLowerCase();
        const searchTerm = phrase.case_sensitive ? phrase.phrase : phrase.phrase.toLowerCase();
        if (searchText.includes(searchTerm)) {
          return true;
        }
      }
      
      // Check content if match_content is true
      if (phrase.match_content && (item.content || item.contentSnippet)) {
        const content = item.content || item.contentSnippet || '';
        const searchText = phrase.case_sensitive ? content : content.toLowerCase();
        const searchTerm = phrase.case_sensitive ? phrase.phrase : phrase.phrase.toLowerCase();
        if (searchText.includes(searchTerm)) {
          return true;
        }
      }
    }
    
    return false;
  }, [blockedPhrases]);

  // Get phrase matches for a specific text
  const getPhraseMatches = useCallback((text: string | undefined, isTitle: boolean): PhraseMatch[] => {
    return findPhraseMatches(text, blockedPhrases, isTitle);
  }, [blockedPhrases]);

  // Filter items whenever feed, blocked categories, or blocked phrases change
  useEffect(() => {
    if (!feed) {
      setFilteredItems([]);
      return;
    }

    // Filter out items that have any blocked category or blocked phrase
    const filtered = feed.items.filter((item) => {
      // First check categories
      if (item.categories && item.categories.length > 0) {
        // If any category is blocked, filter out the item
        if (item.categories.some((category) => blockedCategories.includes(category))) {
          return false;
        }
      }
      
      // Then check for blocked phrases
      if (isItemFilteredByBlockedPhrases(item)) {
        return false;
      }
      
      return true;
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

    setFilteredItems(sorted);
  }, [feed, blockedCategories, blockedPhrases, previousRssLoad, isItemFilteredByBlockedPhrases]);

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
  
  // Add a new blocked phrase
  const addBlockedPhrase = async () => {
    if (!searchPhrase.trim()) return;
    
    try {
      const newPhrase: BlockedPhrase = {
        user_id: user?.id || 'anonymous',
        phrase: searchPhrase.trim(),
        match_title: searchMatchTitle,
        match_content: searchMatchContent,
        case_sensitive: searchCaseSensitive,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Save to Supabase if user is logged in
      if (user) {
        await saveBlockedPhrase(newPhrase);
        
        // Refresh from server to get the assigned ID
        const phrases = await getLatestBlockedPhrases(user.id);
        setBlockedPhrases(phrases);
      } else {
        // For anonymous users, generate a client-side ID
        const clientId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const phraseWithId = {
          ...newPhrase,
          id: clientId
        };
        
        const updatedPhrases = [...blockedPhrases, phraseWithId];
        setBlockedPhrases(updatedPhrases);
        setItem(STORAGE_KEYS.BLOCKED_PHRASES, updatedPhrases);
      }
      
      // Clear the input field
      setSearchPhrase('');
    } catch (err) {
      console.error('Error adding blocked phrase:', err);
    }
  };
  
  // Remove a blocked phrase
  const removeBlockedPhrase = async (phraseId: string) => {
    try {
      if (user) {
        await deleteBlockedPhrase(user.id, phraseId);
      }
      
      // Update state regardless of whether user is logged in
      const updatedPhrases = blockedPhrases.filter(p => p.id !== phraseId);
      setBlockedPhrases(updatedPhrases);
      
      // Update localStorage for anonymous users
      if (!user) {
        setItem(STORAGE_KEYS.BLOCKED_PHRASES, updatedPhrases);
      }
    } catch (err) {
      console.error('Error removing blocked phrase:', err);
    }
  };
  
  // Clear all blocked phrases
  const clearAllBlockedPhrases = async () => {
    try {
      // Clear from Supabase if user is logged in
      if (user) {
        await clearBlockedPhrases(user.id);
      }
      
      // Clear from state
      setBlockedPhrases([]);
      
      // Clear from localStorage for anonymous users
      if (!user) {
        setItem(STORAGE_KEYS.BLOCKED_PHRASES, []);
      }
    } catch (err) {
      console.error('Error clearing blocked phrases:', err);
    }
  };

  const fetchFeed = useCallback(async (resetVisitTime = false) => {
    setLoading(true);
    setError('');

    try {
      // Step 1: Calculate previous_rss_load before loading feed
      if (resetVisitTime) {
        const calculatedPreviousLoad = await getPreviousRssLoad();
        setPreviousRssLoad(calculatedPreviousLoad);
      }

      // Step 2: Load the RSS feed
      const data = await fetchRSSFeed(DEFAULT_FEED_URL);
      setFeed(data);

      // Save feed data to localStorage
      setItem(STORAGE_KEYS.FEED_DATA, data);

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
        feed,
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
        
        // Blocked phrases
        blockedPhrases,
        searchPhrase,
        setSearchPhrase,
        searchMatchTitle,
        setSearchMatchTitle,
        searchMatchContent,
        setSearchMatchContent,
        searchCaseSensitive, 
        setSearchCaseSensitive,
        addBlockedPhrase,
        removeBlockedPhrase,
        clearBlockedPhrases: clearAllBlockedPhrases,
        getPhraseMatches,
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
