/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

/**
 * Pure path helper utilities for the media library explorer.
 * All functions are stateless and have no side effects.
 */

export const normalizeFolderPath = (value: string | null): string =>
  (value ?? "")
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .join("/");

export const splitPath = (path: string): string[] =>
  path
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

export const getParentPath = (path: string): string => {
  const parts = splitPath(path);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
};

export const getPathName = (path: string): string => {
  const parts = splitPath(path);
  return parts.length > 0 ? (parts[parts.length - 1] ?? "Root") : "Root";
};

export const buildPathLevels = (fullPath: string): string[] => {
  const parts = splitPath(fullPath);
  const levels: string[] = [];
  for (let index = 0; index < parts.length; index += 1) {
    levels.push(parts.slice(0, index + 1).join("/"));
  }
  return levels;
};
