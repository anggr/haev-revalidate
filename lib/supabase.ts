import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a Supabase client for browser usage (with anon key)
export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Only create supabaseAdmin in a server environment
export const supabaseAdmin =
  typeof window === 'undefined'
    ? createClient<Database>(
        supabaseUrl || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
    : null;

export const getSupabaseAdmin = () => {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin can only be used on the server');
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient<Database>(
    supabaseUrl || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
