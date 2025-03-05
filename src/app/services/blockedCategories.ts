import { supabase } from '../../lib/supabase';
import { getItem, setItem, STORAGE_KEYS } from '../utils/localStorage';

export type BlockedCategoriesData = {
  id?: string;
  user_id: string;
  categories: string[];
  updated_at?: string;
};

// Fetch blocked categories for a user
export const fetchBlockedCategories = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('blocked_categories')
      .select('categories')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no record exists yet, that's okay - return empty array
      if (error.code === 'PGRST116') {
        return [];
      }
      console.error('Error fetching blocked categories:', error);
      throw error;
    }

    return data?.categories || [];
  } catch (error) {
    console.error('Error in fetchBlockedCategories:', error);
    return [];
  }
};

// Save blocked categories for a user
export const saveBlockedCategories = async (
  userId: string,
  categories: string[]
): Promise<void> => {
  try {
    // First check if a record exists for this user
    const { data: existingData } = await supabase
      .from('blocked_categories')
      .select('id')
      .eq('user_id', userId)
      .single();

    const blockedCategoriesData: BlockedCategoriesData = {
      user_id: userId,
      categories,
      updated_at: new Date().toISOString(),
    };

    if (existingData) {
      // Update existing record
      const { error } = await supabase
        .from('blocked_categories')
        .update(blockedCategoriesData)
        .eq('id', existingData.id);

      if (error) throw error;
    } else {
      // Insert new record
      const { error } = await supabase.from('blocked_categories').insert(blockedCategoriesData);

      if (error) throw error;
    }

    // Also update localStorage for offline access
    setItem(STORAGE_KEYS.BLOCKED_CATEGORIES, categories);
  } catch (error) {
    console.error('Error saving blocked categories:', error);
    throw error;
  }
};

// Get the latest blocked categories, prioritizing DB over localStorage
export const getLatestBlockedCategories = async (userId: string | undefined): Promise<string[]> => {
  if (!userId) {
    // User not logged in, use localStorage only
    return getItem<string[]>(STORAGE_KEYS.BLOCKED_CATEGORIES, []);
  }

  try {
    // Try to get data from Supabase
    const dbCategories = await fetchBlockedCategories(userId);

    // Regardless of whether we found data or not, update localStorage
    // This handles both existing data and empty arrays
    setItem(STORAGE_KEYS.BLOCKED_CATEGORIES, dbCategories);

    // If no data in DB, check localStorage (only for migration of existing data)
    if (dbCategories.length === 0) {
      const localCategories = getItem<string[]>(STORAGE_KEYS.BLOCKED_CATEGORIES, []);

      // Only sync to DB if we have local data AND it's not an empty array
      // This prevents creating unnecessary empty rows
      if (localCategories.length > 0) {
        await saveBlockedCategories(userId, localCategories);
        return localCategories;
      }
    }

    // Return DB categories (which might be an empty array)
    return dbCategories;
  } catch (error) {
    console.error('Error in getLatestBlockedCategories:', error);

    // Fallback to localStorage if DB access fails
    return getItem<string[]>(STORAGE_KEYS.BLOCKED_CATEGORIES, []);
  }
};
