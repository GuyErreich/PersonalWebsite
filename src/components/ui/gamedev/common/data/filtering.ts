/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { SortOption } from "../../../common/controls/SortDropdown";

export type GameDevSortKey = "default" | "title-asc" | "title-desc";

export const GAMEDEV_SORT_OPTIONS: SortOption[] = [
  { value: "default", label: "Default" },
  { value: "title-asc", label: "Title A → Z" },
  { value: "title-desc", label: "Title Z → A" },
];
