/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useState } from "react";
import { fallbackGameDevItems } from "../../components/ui/gamedev/common/data/items";
import type { GameDevItem } from "../../components/ui/gamedev/common/data/types";
import { buildGameDevSummary } from "../../lib/gamedev";
import { supabase } from "../../lib/supabase";

const MIN_REAL_ITEMS = fallbackGameDevItems.length;

const withSummary = (items: GameDevItem[]): GameDevItem[] =>
  items.map((item) => ({
    ...item,
    summary: item.summary ?? buildGameDevSummary(item.description),
  }));

export const useGameDevSectionData = () => {
  const [showreelUrl, setShowreelUrl] = useState<string | null>(null);
  const [galleryItems, setGalleryItems] = useState<GameDevItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const { data: showreelData, error: showreelError } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "showreel_url")
          .single();

        if (!showreelError && showreelData) {
          setShowreelUrl(showreelData.value);
        }

        const { data: items, error: itemsError } = await supabase
          .from("gamedev_items")
          .select("*")
          .order("created_at", { ascending: false });

        if (itemsError) {
          setGalleryItems(withSummary(fallbackGameDevItems));
        } else if (items && items.length >= MIN_REAL_ITEMS) {
          setGalleryItems(withSummary(items as GameDevItem[]));
        } else {
          setGalleryItems(withSummary(fallbackGameDevItems));
        }
      } catch {
        setGalleryItems(withSummary(fallbackGameDevItems));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return {
    galleryItems,
    isLoading,
    showreelUrl,
  };
};
