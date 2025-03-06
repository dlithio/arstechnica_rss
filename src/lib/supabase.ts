import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';

// Supabase client URLs
const supabaseUrl = 'https://xuojaasyojcfnzwdvwnv.supabase.co';
const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

// Create a shared Supabase client instance for reuse
export const supabase = createSupabaseClient(supabaseUrl, supabaseKey!);

// Create a new Supabase client (for cases where a fresh instance is needed)
export const createClient = (): SupabaseClient => {
  return createSupabaseClient(supabaseUrl, supabaseKey!);
};

// For server components, we use a simpler approach - we don't need
// the createServerSupabaseClient function as it's causing type issues,
// and isn't used elsewhere in the app. If server-side auth handling
// is needed later, this can be implemented following Supabase's patterns.
