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

const getMetadataValue = (appMetadata: unknown, key: "role" | "roles"): unknown => {
  if (!appMetadata || typeof appMetadata !== "object") return undefined;
  return (appMetadata as Record<string, unknown>)[key];
};

/**
 * Check app metadata for admin access while supporting both legacy and new role shapes.
 */
export const hasAdminRoleFromMetadata = (appMetadata: unknown): boolean => {
  const rolesValue = getMetadataValue(appMetadata, "roles");
  const roleValue = getMetadataValue(appMetadata, "role");

  return isAdminRole(rolesValue) || isAdminRole(roleValue);
};
