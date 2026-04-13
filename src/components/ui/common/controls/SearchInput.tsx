/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { Search } from "lucide-react";
import { type RefObject, useId } from "react";

interface SearchInputProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  className?: string;
  inputClassName?: string;
  iconClassName?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export const SearchInput = ({
  value,
  onValueChange,
  placeholder,
  className,
  inputClassName,
  iconClassName,
  inputRef,
}: SearchInputProps) => {
  const inputId = useId();

  return (
    <div className={className ?? "relative min-w-0 flex-1"}>
      <label htmlFor={inputId} className="sr-only">
        {placeholder}
      </label>

      <Search
        className={
          iconClassName ??
          "pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
        }
      />

      <input
        id={inputId}
        ref={inputRef}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={
          inputClassName ??
          "w-full rounded-lg border border-white/10 bg-white/5 py-1.5 pr-3 pl-8 text-xs text-white placeholder-gray-500 focus:border-blue-400/60 focus:outline-none"
        }
      />
    </div>
  );
};
