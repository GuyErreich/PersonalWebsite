/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

/** Handle from setTimeout / setInterval — canonical type from @types/node. */
export type TimeoutHandle = NodeJS.Timeout;

/** Handle from requestAnimationFrame — DOM API returns number. */
export type AnimationFrameHandle = number;
