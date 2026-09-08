import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase administrative client using the service role key.
 * Used exclusively for Server-Mediated Kiosk operations (creating patients, consents,
 * clinical sessions, answers, histories, and audit logs) where anonymous client
 * direct mutations are revoked under the hardened Phase 1B RLS architecture.
 *
 * Never expose this client or the service role key to browser components.
 */
export function createServerAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "http://127.0.0.1:54321";

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required for server-mediated administrative operations."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
