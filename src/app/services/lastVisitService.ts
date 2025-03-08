import { supabase } from '@/lib/supabase';

export interface LastVisitData {
  id: string;
  user_id: string;
  last_visited_at: string;
}

// Helper function to log with stack trace
const logWithStackTrace = (message: string, value?: any): void => {
  try {
    if (typeof window !== 'undefined' && window.emitDebugLog) {
      const stack = new Error().stack?.split('\n').slice(2, 5).join(' → ') || '';
      const valueStr =
        value instanceof Date
          ? value.toISOString()
          : value !== undefined
            ? JSON.stringify(value)
            : 'undefined';

      window.emitDebugLog(`${message} | Value: ${valueStr} | Location: ${stack}`, 'lastVisit');
    }
  } catch (error) {
    console.error('Error in debug logging:', error);
  }
};

/**
 * Get the last visit time for the current user
 * For logged-in users, retrieves from Supabase first and falls back to localStorage if needed
 * For non-logged-in users, retrieves from localStorage
 * Returns null if the user has no visit history in either storage
 */
export const getLastVisitTime = async (): Promise<Date | null> => {
  logWithStackTrace('getLastVisitTime() called');

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logWithStackTrace('No user found, falling back to localStorage');
    const localValue = getLastVisitFromLocalStorage();
    logWithStackTrace('getLastVisitTime() returning local value', localValue);
    return localValue;
  }

  logWithStackTrace('Fetching lastVisit from Supabase for user', user.id);
  const { data, error } = await supabase
    .from('last_visit')
    .select('last_visited_at')
    .eq('user_id', user.id)
    .order('last_visited_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    logWithStackTrace('Supabase error or no data, falling back to localStorage', error);
    const localValue = getLastVisitFromLocalStorage();
    logWithStackTrace(
      'getLastVisitTime() returning local value after Supabase failure',
      localValue
    );
    return localValue;
  }

  const lastVisitTime = new Date(data.last_visited_at);
  logWithStackTrace('Supabase lastVisit value', lastVisitTime);

  // Compare with localStorage to use the most recent date
  const localLastVisit = getLastVisitFromLocalStorage();
  logWithStackTrace('Local lastVisit value for comparison', localLastVisit);

  // Always use the most recent timestamp (either from Supabase or localStorage)
  if (localLastVisit && localLastVisit > lastVisitTime) {
    // If localStorage has more recent data, update Supabase to match
    logWithStackTrace('Local time is more recent, updating Supabase to match');
    await updateLastVisitTimeToSpecificDate(localLastVisit, user.id);
    logWithStackTrace('getLastVisitTime() returning local value (more recent)', localLastVisit);
    return localLastVisit;
  } else if (lastVisitTime) {
    // If Supabase has more recent data or no localStorage, use Supabase data and update localStorage
    logWithStackTrace('Supabase time is more recent, updating localStorage to match');
    setLastVisitLocalStorage(lastVisitTime);
    logWithStackTrace('getLastVisitTime() returning Supabase value', lastVisitTime);
    return lastVisitTime;
  }

  // If neither source has data, return null
  logWithStackTrace('No lastVisit data found in any source, returning null');
  return null;
};

/**
 * Helper function to update the last visit time to a specific date
 * Used when localStorage has a more recent date than Supabase
 */
const updateLastVisitTimeToSpecificDate = async (date: Date, userId: string): Promise<void> => {
  logWithStackTrace('updateLastVisitTimeToSpecificDate() called with date', date);

  // Check if entry exists
  logWithStackTrace('Checking if lastVisit entry exists in Supabase');
  const { data: existingEntry } = await supabase
    .from('last_visit')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (existingEntry) {
    // Update existing entry
    logWithStackTrace('Updating existing Supabase entry', existingEntry.id);
    await supabase
      .from('last_visit')
      .update({ last_visited_at: date.toISOString() })
      .eq('id', existingEntry.id);
  } else {
    // Create new entry
    logWithStackTrace('Creating new Supabase entry for user', userId);
    await supabase.from('last_visit').insert({
      user_id: userId,
      last_visited_at: date.toISOString(),
    });
  }

  // Update localStorage as well
  logWithStackTrace('Also updating localStorage from updateLastVisitTimeToSpecificDate');
  setLastVisitLocalStorage(date);
};

export const updateLastVisitTime = async (): Promise<void> => {
  const now = new Date();
  logWithStackTrace('updateLastVisitTime() called, setting to current time', now);

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logWithStackTrace('No user found, updating only localStorage');
    setLastVisitLocalStorage(now);
    return;
  }

  // Use the helper function with the current date - this already updates localStorage
  logWithStackTrace('User found, updating both Supabase and localStorage');
  await updateLastVisitTimeToSpecificDate(now, user.id);
};

// Helper functions for localStorage fallback
const LAST_VISIT_KEY = 'last_visit_time';

/**
 * Get the last visit time from localStorage synchronously
 * This allows immediate access to last visit data while Supabase data loads
 */
export const getLastVisitFromLocalStorage = (): Date | null => {
  if (typeof localStorage === 'undefined') {
    logWithStackTrace('localStorage is undefined (SSR context)');
    return null;
  }

  try {
    const stored = localStorage.getItem(LAST_VISIT_KEY);
    const result = stored ? new Date(stored) : null;
    logWithStackTrace('getLastVisitFromLocalStorage() called', result);
    return result;
  } catch (e) {
    logWithStackTrace('Error reading from localStorage', e);
    console.error('Error reading from localStorage', e);
    return null;
  }
};

/**
 * Set the last visit time in localStorage
 */
export const setLastVisitLocalStorage = (date: Date): void => {
  if (typeof localStorage === 'undefined') {
    logWithStackTrace('setLastVisitLocalStorage failed - localStorage is undefined (SSR context)');
    return;
  }

  try {
    logWithStackTrace('setLastVisitLocalStorage() called with date', date);
    localStorage.setItem(LAST_VISIT_KEY, date.toISOString());
  } catch (e) {
    logWithStackTrace('Error writing to localStorage', e);
    console.error('Error writing to localStorage', e);
  }
};
