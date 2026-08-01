/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { ReactNode } from "react";

interface ComingSoonBadgeProps {
  children?: ReactNode;
  className?: string;
}

const BADGE_CLASS_NAME =
  "rounded-md border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-100";

export const ComingSoonBadge = ({
  children = "Coming Soon",
  className = "",
}: ComingSoonBadgeProps) => (
  <span className={`${BADGE_CLASS_NAME}${className ? ` ${className}` : ""}`}>{children}</span>
);
