/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Allow graceful degradation if Supabase is not configured
// (e.g., local dev without env vars should show UI, not crash)
let supabaseClient: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
} else if (typeof window !== "undefined") {
  console.warn(
    "Supabase not configured: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.",
  );
}

// Export a getter that throws only when actually used (not at module load time)
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    throw new Error(
      "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  return supabaseClient;
};

// For backward compatibility, export a proxy that throws on first use if not configured
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get: (_, prop) => {
    if (!supabaseClient) {
      throw new Error(
        "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      );
    }
    return (supabaseClient as Record<string, unknown>)[prop as string];
  },
}) as ReturnType<typeof createClient>;
