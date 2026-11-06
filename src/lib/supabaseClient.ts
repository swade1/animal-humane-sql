import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env.local when running from CLI scripts
if (typeof window === 'undefined') {
  dotenv.config({ path: '.env.local' });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Supabase/PostgREST caps an unpaginated select() at 1000 rows, and the dogs table has
// grown past that. Any query expected to return more than ~1000 rows must page through
// with .range() instead of relying on a single select() — this wraps that pattern.
export async function fetchAllRows<T = unknown>(
  queryFactory: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<{ data: T[]; error: unknown }> {
  const pageSize = 1000;
  const rows: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await queryFactory(from, from + pageSize - 1);
    if (error) return { data: rows, error };
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return { data: rows, error: null };
}
