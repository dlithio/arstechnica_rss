import { supabase } from '@/lib/supabase';

export interface LastVisitData {
  id: string;
  user_id: string;
  last_visited_at: string;
}

// For debugging purposes
let debugLogs: string[] = [];
export const getDebugLogs = () => [...debugLogs];
export const clearDebugLogs = () => {
  debugLogs = [];
};

const addDebugLog = (message: string) => {
  const timestamp = new Date().toISOString();

  // Get caller information
  const stackTrace = new Error().stack;
  const callerInfo = stackTrace
    ? stackTrace.split('\n')[2]?.trim().replace(/^at /, '') || 'unknown location'
    : 'unknown location';

  debugLogs.unshift(`${timestamp}: [${callerInfo}] ${message}`);
  // Keep only the latest 20 logs
  if (debugLogs.length > 20) {
    debugLogs.pop();
  }
  console.log(`LASTVISIT DEBUG: [${callerInfo}] ${message}`);
};

/**
 * Get the last visit time for the current user
 * For logged-in users, retrieves from Supabase first and falls back to localStorage if needed
 * For non-logged-in users, retrieves from localStorage
 * Returns null if the user has no visit history in either storage
 */
export const getLastVisitTime = async (): Promise<Date | null> => {
  addDebugLog('getLastVisitTime() called');

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    addDebugLog('No user logged in, using localStorage only');
    const localVisit = getLastVisitFromLocalStorage();
    addDebugLog(`localStorage value: ${localVisit ? localVisit.toISOString() : 'null'}`);
    return localVisit;
  }

  addDebugLog(`User logged in: ${user.id}`);

  const { data, error } = await supabase
    .from('last_visit')
    .select('last_visited_at')
    .eq('user_id', user.id)
    .order('last_visited_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    addDebugLog(`Supabase error: ${error.message}, falling back to localStorage`);
    const localVisit = getLastVisitFromLocalStorage();
    addDebugLog(`localStorage fallback value: ${localVisit ? localVisit.toISOString() : 'null'}`);
    return localVisit;
  }

  if (!data) {
    addDebugLog('No Supabase data found, falling back to localStorage');
    const localVisit = getLastVisitFromLocalStorage();
    addDebugLog(`localStorage fallback value: ${localVisit ? localVisit.toISOString() : 'null'}`);
    return localVisit;
  }

  const lastVisitTime = new Date(data.last_visited_at);
  addDebugLog(`Supabase lastVisit: ${lastVisitTime.toISOString()}`);

  // Compare with localStorage to use the most recent date
  const localLastVisit = getLastVisitFromLocalStorage();
  addDebugLog(`LocalStorage lastVisit: ${localLastVisit ? localLastVisit.toISOString() : 'null'}`);

  // Always use the most recent timestamp (either from Supabase or localStorage)
  if (localLastVisit && localLastVisit > lastVisitTime) {
    addDebugLog('LocalStorage has more recent data, updating Supabase to match');
    // If localStorage has more recent data, update Supabase to match
    await updateLastVisitTimeToSpecificDate(localLastVisit, user.id);
    return localLastVisit;
  } else if (lastVisitTime) {
    addDebugLog('Supabase has more recent data, updating localStorage to match');
    // If Supabase has more recent data or no localStorage, use Supabase data and update localStorage
    setLastVisitLocalStorage(lastVisitTime);
    return lastVisitTime;
  }

  // If neither source has data, return null
  addDebugLog('No lastVisit data found in either source');
  return null;
};

/**
 * Helper function to update the last visit time to a specific date
 * Used when localStorage has a more recent date than Supabase
 */
const updateLastVisitTimeToSpecificDate = async (date: Date, userId: string): Promise<void> => {
  addDebugLog(`updateLastVisitTimeToSpecificDate called with date ${date.toISOString()}`);

  // Check if entry exists
  const { data: existingEntry, error: queryError } = await supabase
    .from('last_visit')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (queryError) {
    addDebugLog(`Error checking for existing entry: ${queryError.message}`);
  }

  if (existingEntry) {
    addDebugLog(`Updating existing entry with ID ${existingEntry.id}`);
    // Update existing entry
    const { error } = await supabase
      .from('last_visit')
      .update({ last_visited_at: date.toISOString() })
      .eq('id', existingEntry.id);

    if (error) {
      addDebugLog(`Error updating Supabase: ${error.message}`);
    } else {
      addDebugLog('Successfully updated Supabase entry');
    }
  } else {
    addDebugLog('Creating new entry in Supabase');
    // Create new entry
    const { error } = await supabase.from('last_visit').insert({
      user_id: userId,
      last_visited_at: date.toISOString(),
    });

    if (error) {
      addDebugLog(`Error creating Supabase entry: ${error.message}`);
    } else {
      addDebugLog('Successfully created Supabase entry');
    }
  }

  // Update localStorage as well
  setLastVisitLocalStorage(date);
};

export const updateLastVisitTime = async (): Promise<void> => {
  const now = new Date();
  addDebugLog(`updateLastVisitTime() called with current time: ${now.toISOString()}`);

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    addDebugLog('No user logged in, updating localStorage only');
    setLastVisitLocalStorage(now);
    return;
  }

  addDebugLog(`User logged in: ${user.id}, updating both Supabase and localStorage`);
  // Use the helper function with the current date - this already updates localStorage
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
    addDebugLog('localStorage is undefined (server-side rendering)');
    return null;
  }

  try {
    const stored = localStorage.getItem(LAST_VISIT_KEY);
    if (stored) {
      return new Date(stored);
    } else {
      addDebugLog('No lastVisit found in localStorage');
      return null;
    }
  } catch (e) {
    addDebugLog(`Error reading from localStorage: ${e}`);
    console.error('Error reading from localStorage', e);
    return null;
  }
};

/**
 * Set the last visit time in localStorage
 */
export const setLastVisitLocalStorage = (date: Date): void => {
  if (typeof localStorage === 'undefined') {
    addDebugLog('localStorage is undefined (server-side rendering), skipping save');
    return;
  }

  try {
    localStorage.setItem(LAST_VISIT_KEY, date.toISOString());
    addDebugLog(`Set lastVisit in localStorage to ${date.toISOString()}`);
  } catch (e) {
    addDebugLog(`Error writing to localStorage: ${e}`);
    console.error('Error writing to localStorage', e);
  }
};
