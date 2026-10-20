// SERVER-ONLY Supabase client. Uses the service role key, which bypasses Row Level Security.
// Never import this file from a 'use client' component.
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
