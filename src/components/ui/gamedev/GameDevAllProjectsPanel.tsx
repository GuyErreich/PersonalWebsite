/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useMemo, useState } from "react";
import { useMediaQuery } from "../../../hooks/responsive/useMediaQuery";
import { GAMEDEV_SORT_OPTIONS, type GameDevSortKey } from "./common/data/filtering";
import type { GameDevAllProjectsPanelProps } from "./common/data/types";
import { GameDevAllProjectsDesktop } from "./desktop/layouts/GameDevAllProjectsDesktop";
import { GameDevAllProjectsMobile } from "./mobile/layouts/GameDevAllProjectsMobile";

export const GameDevAllProjectsPanel = ({
  galleryItems,
  isLoading,
  iconMap,
  onBack,
}: GameDevAllProjectsPanelProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<GameDevSortKey>(
    GAMEDEV_SORT_OPTIONS[0].value as GameDevSortKey,
  );
  const [activeStacks, setActiveStacks] = useState<string[]>([]);

  const allStacks = useMemo(
    () =>
      [...new Set(galleryItems.flatMap((item) => item.tags ?? []))].sort((left, right) =>
        left.localeCompare(right),
      ),
    [galleryItems],
  );

  const filteredItems = useMemo(() => {
    const needle = search.trim().toLowerCase();

    let nextItems = galleryItems.filter((item) => {
      const matchesSearch =
        needle.length === 0 ||
        item.title.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle) ||
        (item.tags ?? []).some((tag) => tag.toLowerCase().includes(needle));

      const matchesStacks =
        activeStacks.length === 0 ||
        activeStacks.every((stack) => (item.tags ?? []).includes(stack));

      return matchesSearch && matchesStacks;
    });

    if (sortKey === "title-asc") {
      nextItems = [...nextItems].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortKey === "title-desc") {
      nextItems = [...nextItems].sort((a, b) => b.title.localeCompare(a.title));
    }

    return nextItems;
  }, [activeStacks, galleryItems, search, sortKey]);

  const toggleStack = (value: string) => {
    setActiveStacks((current) =>
      current.includes(value) ? current.filter((stack) => stack !== value) : [...current, value],
    );
  };

  if (isDesktop) {
    return (
      <GameDevAllProjectsDesktop
        galleryItems={filteredItems}
        isLoading={isLoading}
        iconMap={iconMap}
        onBack={onBack}
        search={search}
        onSearchChange={setSearch}
        allStacks={allStacks}
        activeStacks={activeStacks}
        onStackToggle={toggleStack}
        onClearStacks={() => setActiveStacks([])}
        sortKey={sortKey}
        onSortChange={(value) => setSortKey(value as GameDevSortKey)}
      />
    );
  }

  return (
    <GameDevAllProjectsMobile
      galleryItems={filteredItems}
      isLoading={isLoading}
      iconMap={iconMap}
      onBack={onBack}
      search={search}
      onSearchChange={setSearch}
      allStacks={allStacks}
      activeStacks={activeStacks}
      onStackToggle={toggleStack}
      onClearStacks={() => setActiveStacks([])}
      sortKey={sortKey}
      onSortChange={(value) => setSortKey(value as GameDevSortKey)}
    />
  );
};
