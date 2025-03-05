import { supabase } from '@/lib/supabase';

export interface LastVisitData {
  id: string;
  user_id: string;
  last_visited_at: string;
}

/**
 * Get the last visit time for the current user
 * For logged-in users, retrieves from Supabase first and falls back to localStorage if needed
 * For non-logged-in users, retrieves from localStorage
 * Returns null if the user has no visit history in either storage
 */
export const getLastVisitTime = async (): Promise<Date | null> => {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return getLastVisitFromLocalStorage();
  }

  const { data, error } = await supabase
    .from('last_visit')
    .select('last_visited_at')
    .eq('user_id', user.id)
    .order('last_visited_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return getLastVisitFromLocalStorage();
  }

  const lastVisitTime = new Date(data.last_visited_at);

  // Compare with localStorage to use the most recent date
  const localLastVisit = getLastVisitFromLocalStorage();

  // Use the most recent timestamp (either from Supabase or localStorage)
  if (localLastVisit && localLastVisit > lastVisitTime) {
    // If localStorage has more recent data, update Supabase to match
    await updateLastVisitTimeToSpecificDate(localLastVisit, user.id);
    return localLastVisit;
  }

  // Otherwise use Supabase data and update localStorage
  setLastVisitLocalStorage(lastVisitTime);
  return lastVisitTime;
};

/**
 * Update the last visit time for the current user to now
 * For logged-in users, updates both Supabase and localStorage
 * For non-logged-in users, updates only localStorage
 */

/**
 * Helper function to update the last visit time to a specific date
 * Used when localStorage has a more recent date than Supabase
 */
const updateLastVisitTimeToSpecificDate = async (date: Date, userId: string): Promise<void> => {
  // Check if entry exists
  const { data: existingEntry } = await supabase
    .from('last_visit')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (existingEntry) {
    // Update existing entry
    await supabase
      .from('last_visit')
      .update({ last_visited_at: date.toISOString() })
      .eq('id', existingEntry.id);
  } else {
    // Create new entry
    await supabase.from('last_visit').insert({
      user_id: userId,
      last_visited_at: date.toISOString(),
    });
  }

  // Update localStorage as well
  setLastVisitLocalStorage(date);
};

export const updateLastVisitTime = async (): Promise<void> => {
  const now = new Date();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setLastVisitLocalStorage(now);
    return;
  }

  // Use the helper function with the current date
  await updateLastVisitTimeToSpecificDate(now, user.id);

  // Always update localStorage as well
  setLastVisitLocalStorage(now);
};

// Helper functions for localStorage fallback
const LAST_VISIT_KEY = 'last_visit_time';

/**
 * Get the last visit time from localStorage synchronously
 * This allows immediate access to last visit data while Supabase data loads
 */
export const getLastVisitFromLocalStorage = (): Date | null => {
  if (typeof localStorage === 'undefined') return null;

  try {
    const stored = localStorage.getItem(LAST_VISIT_KEY);
    return stored ? new Date(stored) : null;
  } catch (e) {
    console.error('Error reading from localStorage', e);
    return null;
  }
};

/**
 * Set the last visit time in localStorage
 */
export const setLastVisitLocalStorage = (date: Date): void => {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(LAST_VISIT_KEY, date.toISOString());
  } catch (e) {
    console.error('Error writing to localStorage', e);
  }
};
