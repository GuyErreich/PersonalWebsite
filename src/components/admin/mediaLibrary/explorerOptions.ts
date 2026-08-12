/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { DropdownOption } from "../../ui/common/controls/OptionDropdown";

export const EXPLORER_ENTRY_TYPE_OPTIONS: DropdownOption[] = [
  { value: "all", label: "All Entries" },
  { value: "folders", label: "Folders" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
];

export const EXPLORER_SORT_OPTIONS: DropdownOption[] = [
  { value: "updated-desc", label: "Recently Updated" },
  { value: "created-desc", label: "Recently Created" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "size-desc", label: "Largest Size" },
];
