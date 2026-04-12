/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { createClient } from "@supabase/supabase-js";

// Explicit schema type so Supabase can type-check table access correctly.
// Extend this when new tables are added.
interface Database {
  public: {
    Tables: {
      site_settings: {
        Row: { key: string; value: string; updated_at: string };
        Insert: { key: string; value: string; updated_at?: string };
        Update: { key?: string; value?: string; updated_at?: string };
        Relationships: [];
      };
      gamedev_items: {
        Row: {
          id: string;
          title: string;
          description: string;
          media_url: string;
          thumbnail_url: string | null;
          icon_name: string | null;
          github_url: string | null;
          live_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          media_url: string;
          thumbnail_url?: string | null;
          icon_name?: string | null;
          github_url?: string | null;
          live_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          media_url?: string;
          thumbnail_url?: string | null;
          icon_name?: string | null;
          github_url?: string | null;
          live_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      devops_projects: {
        Row: {
          id: string;
          title: string;
          description: string;
          tech_stack: string[];
          github_url: string | null;
          live_url: string | null;
          icon_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          tech_stack: string[];
          github_url?: string | null;
          live_url?: string | null;
          icon_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          tech_stack?: string[];
          github_url?: string | null;
          live_url?: string | null;
          icon_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Allow graceful degradation if Supabase is not configured
// (e.g., local dev without env vars should show UI, not crash)
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
} else if (typeof window !== "undefined") {
  console.warn(
    "Supabase not configured: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.",
  );
}

// Export a getter that throws only when actually used (not at module load time)
export const getSupabaseClient = (): ReturnType<typeof createClient<Database>> => {
  if (!supabaseClient) {
    throw new Error(
      "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  return supabaseClient;
};

// For backward compatibility, export a proxy that throws on first use if not configured
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get: (_, prop) => {
    if (!supabaseClient) {
      throw new Error(
        "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      );
    }
    return Reflect.get(supabaseClient, prop, supabaseClient);
  },
}) as ReturnType<typeof createClient<Database>>;
