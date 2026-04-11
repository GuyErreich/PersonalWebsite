/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { RefObject } from "react";
import { createContext, useContext } from "react";

export const ScrollContainerContext = createContext<RefObject<HTMLElement | null> | null>(null);

export const useScrollContainer = () => useContext(ScrollContainerContext);
