import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xurcxbaqqiegwwxtsqtj.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_psWS6LRrUK7_X4lEYJUWXQ_TRWx9Cvr";

export function createClient() {
  return createSupabaseClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        storage: typeof window !== "undefined" ? window.sessionStorage : undefined,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  );
}