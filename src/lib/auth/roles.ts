/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

/**
 * Check if a role value indicates admin access.
 * Supports both singular `role: "admin"` and array `roles: ["admin", ...]` formats.
 * @param roleValue - The role metadata value (string, array, or unknown)
 * @returns true if the role indicates admin access
 */
export const isAdminRole = (roleValue: unknown): boolean => {
  if (Array.isArray(roleValue)) return roleValue.some((r) => r === "admin");
  return typeof roleValue === "string" && roleValue === "admin";
};
