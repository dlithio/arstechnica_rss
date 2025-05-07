import { supabase } from '../../lib/supabase';
import { getItem, setItem, STORAGE_KEYS } from '../utils/localStorage';

/**
 * Type for a blocked phrase in the database
 */
export type BlockedPhrase = {
  id?: string;
  user_id: string;
  phrase: string;
  match_title: boolean;
  match_content: boolean;
  case_sensitive: boolean;
  created_at?: string;
  updated_at?: string;
};

/**
 * Fetches blocked phrases for a specific user from the database
 *
 * @param userId The user's unique identifier
 * @returns Array of BlockedPhrase objects or empty array if none found
 */
export const fetchBlockedPhrases = async (userId: string): Promise<BlockedPhrase[]> => {
  try {
    const { data, error } = await supabase
      .from('blocked_phrases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blocked phrases:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchBlockedPhrases:', error);
    return [];
  }
};

/**
 * Saves a new blocked phrase for a user to the database and localStorage
 *
 * @param blockedPhrase The BlockedPhrase object to save
 */
export const saveBlockedPhrase = async (blockedPhrase: BlockedPhrase): Promise<void> => {
  try {
    const { error } = await supabase.from('blocked_phrases').insert(blockedPhrase);

    if (error) throw error;

    // Also update localStorage for offline access
    const localPhrases = getItem<BlockedPhrase[]>(STORAGE_KEYS.BLOCKED_PHRASES, []);
    setItem(STORAGE_KEYS.BLOCKED_PHRASES, [...localPhrases, blockedPhrase]);
  } catch (error) {
    console.error('Error saving blocked phrase:', error);
    throw error;
  }
};

/**
 * Deletes a blocked phrase from the database and localStorage
 *
 * @param userId The user's unique identifier
 * @param phraseId The id of the phrase to delete
 */
export const deleteBlockedPhrase = async (userId: string, phraseId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('blocked_phrases')
      .delete()
      .eq('id', phraseId)
      .eq('user_id', userId);

    if (error) throw error;

    // Also update localStorage for offline access
    const localPhrases = getItem<BlockedPhrase[]>(STORAGE_KEYS.BLOCKED_PHRASES, []);
    setItem(
      STORAGE_KEYS.BLOCKED_PHRASES,
      localPhrases.filter((p) => p.id !== phraseId)
    );
  } catch (error) {
    console.error('Error deleting blocked phrase:', error);
    throw error;
  }
};

/**
 * Updates a blocked phrase in the database and localStorage
 *
 * @param userId The user's unique identifier
 * @param updatedPhrase The updated BlockedPhrase object
 */
export const updateBlockedPhrase = async (
  userId: string,
  updatedPhrase: BlockedPhrase
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('blocked_phrases')
      .update(updatedPhrase)
      .eq('id', updatedPhrase.id)
      .eq('user_id', userId);

    if (error) throw error;

    // Also update localStorage for offline access
    const localPhrases = getItem<BlockedPhrase[]>(STORAGE_KEYS.BLOCKED_PHRASES, []);
    setItem(
      STORAGE_KEYS.BLOCKED_PHRASES,
      localPhrases.map((p) => (p.id === updatedPhrase.id ? updatedPhrase : p))
    );
  } catch (error) {
    console.error('Error updating blocked phrase:', error);
    throw error;
  }
};

/**
 * Clears all blocked phrases for a user
 *
 * @param userId The user's unique identifier
 */
export const clearBlockedPhrases = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase.from('blocked_phrases').delete().eq('user_id', userId);

    if (error) throw error;

    // Also update localStorage for offline access
    setItem(STORAGE_KEYS.BLOCKED_PHRASES, []);
  } catch (error) {
    console.error('Error clearing blocked phrases:', error);
    throw error;
  }
};

/**
 * Gets the latest blocked phrases, prioritizing database over localStorage
 * Handles syncing between database and localStorage for offline support
 *
 * @param userId The user's unique identifier, or undefined if user is not logged in
 * @returns Array of BlockedPhrase objects
 */
export const getLatestBlockedPhrases = async (
  userId: string | undefined
): Promise<BlockedPhrase[]> => {
  if (!userId) {
    // User not logged in, use localStorage only
    return getItem<BlockedPhrase[]>(STORAGE_KEYS.BLOCKED_PHRASES, []);
  }

  try {
    // Try to get data from Supabase
    const dbPhrases = await fetchBlockedPhrases(userId);

    // Regardless of whether we found data or not, update localStorage
    setItem(STORAGE_KEYS.BLOCKED_PHRASES, dbPhrases);

    // If no data in DB, check localStorage (only for migration of existing data)
    if (dbPhrases.length === 0) {
      const localPhrases = getItem<BlockedPhrase[]>(STORAGE_KEYS.BLOCKED_PHRASES, []);

      // Only sync to DB if we have local data
      if (localPhrases.length > 0) {
        // Insert all phrases individually
        for (const phrase of localPhrases) {
          await saveBlockedPhrase({ ...phrase, user_id: userId });
        }
        return localPhrases;
      }
    }

    // Return DB phrases (which might be an empty array)
    return dbPhrases;
  } catch (error) {
    console.error('Error in getLatestBlockedPhrases:', error);

    // Fallback to localStorage if DB access fails
    return getItem<BlockedPhrase[]>(STORAGE_KEYS.BLOCKED_PHRASES, []);
  }
};

/**
 * Checks if a string matches any of the blocked phrases
 * 
 * @param text The text to check
 * @param blockedPhrases Array of BlockedPhrase objects to check against
 * @param isTitle Whether the text is a title (for match_title check)
 * @returns An array of matches with the phrase and the matched positions
 */
export type PhraseMatch = {
  phrase: BlockedPhrase;
  indexes: number[];
};

export const findPhraseMatches = (
  text: string | undefined,
  blockedPhrases: BlockedPhrase[],
  isTitle: boolean
): PhraseMatch[] => {
  if (!text) return [];
  
  const matches: PhraseMatch[] = [];
  
  for (const phrase of blockedPhrases) {
    // Skip if targeting title but this is content, or vice versa
    if ((isTitle && !phrase.match_title) || (!isTitle && !phrase.match_content)) {
      continue;
    }
    
    const searchPhrase = phrase.phrase;
    const searchText = phrase.case_sensitive ? text : text.toLowerCase();
    const searchTerm = phrase.case_sensitive ? searchPhrase : searchPhrase.toLowerCase();
    
    let pos = 0;
    const indexes: number[] = [];
    
    while (pos !== -1) {
      pos = searchText.indexOf(searchTerm, pos);
      if (pos !== -1) {
        indexes.push(pos);
        pos += searchTerm.length;
      }
    }
    
    if (indexes.length > 0) {
      matches.push({
        phrase,
        indexes
      });
    }
  }
  
  return matches;
};