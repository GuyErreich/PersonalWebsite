/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
          media_url: string | null;
          thumbnail_url: string | null;
          icon_name: string | null;
          github_url: string | null;
          live_url: string | null;
          tags: string[];
          is_coming_soon: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          media_url?: string | null;
          thumbnail_url?: string | null;
          icon_name?: string | null;
          github_url?: string | null;
          live_url?: string | null;
          tags?: string[];
          is_coming_soon?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          media_url?: string | null;
          thumbnail_url?: string | null;
          icon_name?: string | null;
          github_url?: string | null;
          live_url?: string | null;
          tags?: string[];
          is_coming_soon?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      gamedev_item_media: {
        Row: {
          id: string;
          gamedev_item_id: string;
          media_url: string;
          thumbnail_url: string | null;
          media_type: "video" | "image";
          caption: string | null;
          sort_order: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gamedev_item_id: string;
          media_url: string;
          thumbnail_url?: string | null;
          media_type: "video" | "image";
          caption?: string | null;
          sort_order?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          gamedev_item_id?: string;
          media_url?: string;
          thumbnail_url?: string | null;
          media_type?: "video" | "image";
          caption?: string | null;
          sort_order?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      media_library: {
        Row: {
          id: string;
          name: string;
          media_url: string;
          media_type: "video" | "image";
          content_hash: string;
          folder_origin: string | null;
          file_size_bytes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          media_url: string;
          media_type: "video" | "image";
          content_hash: string;
          folder_origin?: string | null;
          file_size_bytes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          media_url?: string;
          media_type?: "video" | "image";
          content_hash?: string;
          folder_origin?: string | null;
          file_size_bytes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      media_library_folders: {
        Row: {
          id: string;
          name: string;
          path: string;
          parent_path: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          path: string;
          parent_path?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          path?: string;
          parent_path?: string;
          created_at?: string;
          updated_at?: string;
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
    Functions: {
      media_library_move_folder_recursive: {
        Args: { p_source_path: string; p_target_parent_path: string };
        Returns: undefined;
      };
      media_library_rename_folder_recursive: {
        Args: { p_folder_path: string; p_new_name: string; p_new_path_segment: string };
        Returns: undefined;
      };
      media_library_delete_folder_recursive: {
        Args: { p_folder_path: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
  };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

type TypedClient = SupabaseClient<Database>;

// Allow graceful degradation if Supabase is not configured
// (e.g., local dev without env vars should show UI, not crash)
let supabaseClient: TypedClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Export a getter that throws only when actually used (not at module load time)
export const getSupabaseClient = (): TypedClient => {
  if (!supabaseClient) {
    throw new Error(
      "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  return supabaseClient;
};

/** Headers required for direct browser fetch() calls to Supabase Edge Functions. */
export const getEdgeFunctionAuthHeaders = (accessToken: string): Record<string, string> => {
  if (!supabaseAnonKey) {
    throw new Error(
      "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }

  return {
    "Content-Type": "application/json",
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${accessToken}`,
  };
};

const getSiteOriginForDiagnostics = (): string =>
  typeof window !== "undefined" ? window.location.origin : "your site origin";

/** Actionable message when an edge function returns a bare 403 (CORS origin rejected). */
export const getEdgeFunctionCorsBlockedMessage = (
  origin: string = getSiteOriginForDiagnostics(),
): string =>
  `Request blocked (403). Ensure the Supabase ALLOWED_ORIGINS secret includes ${origin}.`;

/** Prefer server JSON error body; surface CORS hint on bare 403 responses. */
export const resolveEdgeFunctionErrorMessage = (
  status: number,
  body: unknown,
  fallback: string,
  origin?: string,
): string => {
  if (status === 403 && (typeof body !== "object" || body === null || !("error" in body))) {
    return getEdgeFunctionCorsBlockedMessage(origin);
  }

  if (typeof body === "object" && body !== null && "error" in body) {
    return String((body as Record<string, unknown>).error);
  }

  return fallback;
};

// For backward compatibility, export a proxy that throws on first use if not configured
export const supabase = new Proxy({} as TypedClient, {
  get: (_, prop) => {
    if (!supabaseClient) {
      throw new Error(
        "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      );
    }
    const value = Reflect.get(supabaseClient, prop, supabaseClient);
    // Bind functions so that `this` inside SDK methods always refers to the real
    // client, not the proxy (calling `proxy.from(...)` would otherwise invoke the
    // method with `this = proxy`, which breaks internal SDK state references).
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(supabaseClient)
      : value;
  },
}) as TypedClient;
