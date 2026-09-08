import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Supabase browser client for client-side operations.
 * Under the hardened RLS architecture, direct anonymous mutations are revoked.
 * Anonymous kiosk clients have read-only access to active clinical_questions.
 */
export function getSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Fallback client to prevent build/render crashes when env vars are unpopulated in dev
    return createClient(
      supabaseUrl || "http://127.0.0.1:54321",
      supabaseAnonKey || "dummy-anon-key"
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = getSupabaseBrowserClient();
