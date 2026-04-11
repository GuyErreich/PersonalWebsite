/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { ReactNode } from "react";

export interface DevOpsProject {
  title: string;
  description: string;
  tags: string[];
  link: string;
  icon: ReactNode;
}
