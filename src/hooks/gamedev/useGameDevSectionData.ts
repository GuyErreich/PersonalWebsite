/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useState } from "react";
import { fallbackGameDevItems } from "../../components/ui/gamedev/common/data/items";
import type { GameDevItem, GameDevVfxItem } from "../../components/ui/gamedev/common/data/types";
import { buildGameDevSummary, sortFeaturedGameDevItems } from "../../lib/gamedev";
import { loadPublicVfxLibraryItems } from "../../lib/gamedev/vfxLibrary";
import { supabase } from "../../lib/supabase";

const withSummary = (items: GameDevItem[]): GameDevItem[] =>
  items.map((item) => ({
    ...item,
    summary: item.summary ?? buildGameDevSummary(item.description),
  }));

export const useGameDevSectionData = () => {
  const [showreelUrl, setShowreelUrl] = useState<string | null>(null);
  const [galleryItems, setGalleryItems] = useState<GameDevItem[]>([]);
  const [featuredItems, setFeaturedItems] = useState<GameDevItem[]>([]);
  const [vfxItems, setVfxItems] = useState<GameDevVfxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVfxLoading, setIsVfxLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const { data: showreelData, error: showreelError } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "showreel_url")
          .single();

        if (!isMounted) {
          return;
        }

        if (!showreelError && showreelData) {
          setShowreelUrl(showreelData.value);
        }

        const { data: items, error: itemsError } = await supabase
          .from("gamedev_items_public")
          .select("*")
          .order("created_at", { ascending: false });

        if (!isMounted) {
          return;
        }

        if (itemsError) {
          const fallback = withSummary(fallbackGameDevItems);
          setGalleryItems(fallback);
          setFeaturedItems(sortFeaturedGameDevItems(fallback.filter((item) => item.is_featured)));
        } else {
          const normalized = withSummary((items ?? []) as GameDevItem[]);
          setGalleryItems(normalized);
          setFeaturedItems(sortFeaturedGameDevItems(normalized.filter((item) => item.is_featured)));
        }
      } catch {
        if (!isMounted) {
          return;
        }

        const fallback = withSummary(fallbackGameDevItems);
        setGalleryItems(fallback);
        setFeaturedItems(sortFeaturedGameDevItems(fallback.filter((item) => item.is_featured)));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const items = await loadPublicVfxLibraryItems();

        if (!isMounted) {
          return;
        }

        setVfxItems(items as GameDevVfxItem[]);
      } catch {
        if (!isMounted) {
          return;
        }

        setVfxItems([]);
      } finally {
        if (isMounted) {
          setIsVfxLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    showreelUrl,
    galleryItems,
    featuredItems,
    vfxItems,
    isLoading,
    isVfxLoading,
  };
};
