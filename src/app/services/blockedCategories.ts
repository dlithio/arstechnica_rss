import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuojaasyojcfnzwdvwnv.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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
    localStorage.setItem('rssViewerBlockedCategories', JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving blocked categories:', error);
    throw error;
  }
};

// Get the latest blocked categories, prioritizing DB over localStorage
export const getLatestBlockedCategories = async (userId: string | undefined): Promise<string[]> => {
  if (!userId) {
    // User not logged in, use localStorage only
    try {
      const localData = localStorage.getItem('rssViewerBlockedCategories');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  try {
    // Try to get data from Supabase
    const dbCategories = await fetchBlockedCategories(userId);

    // Regardless of whether we found data or not, update localStorage
    // This handles both existing data and empty arrays
    localStorage.setItem('rssViewerBlockedCategories', JSON.stringify(dbCategories));

    // If no data in DB, check localStorage (only for migration of existing data)
    if (dbCategories.length === 0) {
      const localData = localStorage.getItem('rssViewerBlockedCategories');
      const localCategories = localData ? JSON.parse(localData) : [];

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
    try {
      const localData = localStorage.getItem('rssViewerBlockedCategories');
      return localData ? JSON.parse(localData) : [];
    } catch {
      // Ignore any parsing errors and return empty array
      return [];
    }
  }
};
