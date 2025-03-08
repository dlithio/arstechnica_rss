import { supabase } from '@/lib/supabase';

export interface LastVisitData {
  id: string;
  user_id: string;
  last_visited_at: string;
}

// New local storage keys for our two timestamps
const PREVIOUS_RSS_LOAD_KEY = 'previous_rss_load';
const THIS_RSS_LOAD_KEY = 'this_rss_load';

/**
 * Get the previous_rss_load time for determining seen/unseen status
 * This is calculated as the maximum of local this_rss_load and supabase last_visited_at
 * Returns null if the user has no visit history in either storage
 */
export const getPreviousRssLoad = async (): Promise<Date | null> => {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let supabaseLastVisit: Date | null = null;
  let localThisRssLoad: Date | null = null;

  // If user is logged in, get the last_visited_at from Supabase
  if (user) {
    const { data, error } = await supabase
      .from('last_visit')
      .select('last_visited_at')
      .eq('user_id', user.id)
      .order('last_visited_at', { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      supabaseLastVisit = new Date(data.last_visited_at);
    }
  }

  // Get the local this_rss_load value
  localThisRssLoad = getThisRssLoadFromLocalStorage();

  // Calculate previous_rss_load as max of supabase and local values
  let previousRssLoad: Date | null = null;

  if (supabaseLastVisit && localThisRssLoad) {
    // Both exist, take the newest one
    previousRssLoad = supabaseLastVisit > localThisRssLoad ? supabaseLastVisit : localThisRssLoad;
  } else {
    // Take whichever one exists, or null if neither exists
    previousRssLoad = supabaseLastVisit || localThisRssLoad;
  }

  // Store the calculated value in localStorage
  if (previousRssLoad) {
    setPreviousRssLoadLocalStorage(previousRssLoad);
  }

  return previousRssLoad;
};

/**
 * Update the this_rss_load time and last_visited_at for the current user to now
 * This should be called only after RSS feed is successfully loaded and previous_rss_load is set
 * For logged-in users, updates both Supabase and localStorage
 * For non-logged-in users, updates only localStorage
 */
export const updateCurrentRssLoadTime = async (): Promise<void> => {
  const now = new Date();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Update local this_rss_load value
  setThisRssLoadLocalStorage(now);

  // If logged in, update Supabase as well
  if (user) {
    // Check if entry exists
    const { data: existingEntry } = await supabase
      .from('last_visit')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (existingEntry) {
      // Update existing entry
      await supabase
        .from('last_visit')
        .update({ last_visited_at: now.toISOString() })
        .eq('id', existingEntry.id);
    } else {
      // Create new entry
      await supabase.from('last_visit').insert({
        user_id: user.id,
        last_visited_at: now.toISOString(),
      });
    }
  }
};

// Helper functions for localStorage

/**
 * Get the previous_rss_load from localStorage
 */
export const getPreviousRssLoadFromLocalStorage = (): Date | null => {
  if (typeof localStorage === 'undefined') return null;

  try {
    const stored = localStorage.getItem(PREVIOUS_RSS_LOAD_KEY);
    return stored ? new Date(stored) : null;
  } catch (e) {
    console.error('Error reading previous_rss_load from localStorage', e);
    return null;
  }
};

/**
 * Get the this_rss_load from localStorage
 */
export const getThisRssLoadFromLocalStorage = (): Date | null => {
  if (typeof localStorage === 'undefined') return null;

  try {
    const stored = localStorage.getItem(THIS_RSS_LOAD_KEY);
    return stored ? new Date(stored) : null;
  } catch (e) {
    console.error('Error reading this_rss_load from localStorage', e);
    return null;
  }
};

/**
 * Set the previous_rss_load in localStorage
 */
export const setPreviousRssLoadLocalStorage = (date: Date): void => {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(PREVIOUS_RSS_LOAD_KEY, date.toISOString());
  } catch (e) {
    console.error('Error writing previous_rss_load to localStorage', e);
  }
};

/**
 * Set the this_rss_load in localStorage
 */
export const setThisRssLoadLocalStorage = (date: Date): void => {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(THIS_RSS_LOAD_KEY, date.toISOString());
  } catch (e) {
    console.error('Error writing this_rss_load to localStorage', e);
  }
};

// Legacy functions for backward compatibility
// These will be used during the transition period and can be removed later

/**
 * Legacy function for backward compatibility
 */
export const getLastVisitTime = getPreviousRssLoad;

/**
 * Legacy function for backward compatibility
 */
export const updateLastVisitTime = updateCurrentRssLoadTime;

/**
 * Legacy function for backward compatibility
 */
export const getLastVisitFromLocalStorage = getPreviousRssLoadFromLocalStorage;

/**
 * Legacy function for backward compatibility
 */
export const setLastVisitLocalStorage = setPreviousRssLoadLocalStorage;
