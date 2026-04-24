/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

/**
 * Check if a role value indicates admin access.
 * Supports roles values as either a string ("admin") or an array containing "admin".
 * @param roleValue - The roles metadata value (string, array, or unknown)
 * @returns true if the role indicates admin access
 */
export const isAdminRole = (roleValue: unknown): boolean => {
  if (Array.isArray(roleValue)) return roleValue.some((r) => r === "admin");
  return typeof roleValue === "string" && roleValue === "admin";
};

/**
 * Check app metadata for admin access via the roles array.
 */
export const hasAdminRoleFromMetadata = (appMetadata: unknown): boolean => {
  if (!appMetadata || typeof appMetadata !== "object") return false;
  const rolesValue = (appMetadata as Record<string, unknown>).roles;
  return isAdminRole(rolesValue);
};
