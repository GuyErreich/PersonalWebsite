/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useState } from "react";
import { fallbackGameDevItems } from "../../components/ui/gamedev/common/items";
import type { GameDevItem } from "../../components/ui/gamedev/common/types";
import { supabase } from "../../lib/supabase";

const MIN_REAL_ITEMS = fallbackGameDevItems.length;

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

        if (showreelError) {
          console.warn(showreelError.message);
        } else if (showreelData) {
          setShowreelUrl(showreelData.value);
        }

        const { data: items, error: itemsError } = await supabase
          .from("gamedev_items")
          .select("*")
          .order("created_at", { ascending: false });

        if (itemsError) {
          console.warn(itemsError.message);
          setGalleryItems(fallbackGameDevItems);
        } else if (items && items.length >= MIN_REAL_ITEMS) {
          setGalleryItems(items as GameDevItem[]);
        } else {
          setGalleryItems(fallbackGameDevItems);
        }
      } catch (e) {
        console.warn(e instanceof Error ? e.message : String(e));
        setGalleryItems(fallbackGameDevItems);
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
