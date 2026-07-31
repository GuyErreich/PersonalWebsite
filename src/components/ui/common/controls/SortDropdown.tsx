/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { ArrowUpDown } from "lucide-react";
import { type DropdownOption, OptionDropdown } from "./OptionDropdown";

export type SortOption = DropdownOption;

interface SortDropdownProps {
  value: string;
  options: SortOption[];
  onChange: (value: string) => void;
}

export const SortDropdown = ({ value, options, onChange }: SortDropdownProps) => (
  <OptionDropdown
    value={value}
    options={options}
    onChange={onChange}
    label="Sort"
    icon={ArrowUpDown}
    menuAriaLabel="Sort order"
  />
);
