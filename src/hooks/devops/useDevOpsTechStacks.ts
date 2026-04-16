/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface UseDevOpsTechStacksResult {
  stacks: string[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  addStack: (stack: string) => Promise<void>;
  removeStack: (stack: string) => Promise<void>;
}

const SETTINGS_KEY = "devops_tech_stacks";

export const useDevOpsTechStacks = (enabled = true): UseDevOpsTechStacksResult => {
  const [stacks, setStacks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      // Clear loading state when disabled to prevent perpetual loading UI
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", SETTINGS_KEY)
          .single();

        // PGRST116 = row not found — first time, no stacks saved yet
        if (fetchError && fetchError.code !== "PGRST116") {
          setError(fetchError.message);
        } else if (data) {
          try {
            const parsed: unknown = JSON.parse(data.value);
            if (Array.isArray(parsed)) {
              setStacks(parsed.filter((s): s is string => typeof s === "string"));
            }
          } catch {
            // intentional — malformed JSON; start fresh
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [enabled]);

  const persist = async (updated: string[]) => {
    setSaving(true);
    setError(null);

    try {
      const { error: upsertError } = await supabase.from("site_settings").upsert({
        key: SETTINGS_KEY,
        value: JSON.stringify(updated),
      });

      if (upsertError) {
        setError(upsertError.message);
        return;
      }

      setStacks(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const addStack = async (stack: string) => {
    const trimmed = stack.trim();
    if (!trimmed || stacks.includes(trimmed)) return;
    await persist([...stacks, trimmed].sort());
  };

  const removeStack = async (stack: string) => {
    await persist(stacks.filter((s) => s !== stack));
  };

  return { stacks, loading, saving, error, addStack, removeStack };
};
