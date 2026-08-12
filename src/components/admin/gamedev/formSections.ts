/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

export type GameDevFormSectionId = "basics" | "content" | "media" | "discovery" | "links";

export type MediaLibraryRoleFilter = "all" | "header" | "thumbnail" | "poster";

export interface GameDevFormSectionConfig {
  id: GameDevFormSectionId;
  label: string;
  shortLabel: string;
}

export const GAMEDEV_FORM_SECTIONS: GameDevFormSectionConfig[] = [
  { id: "basics", label: "Basics", shortLabel: "Basics" },
  { id: "content", label: "Content", shortLabel: "Content" },
  { id: "media", label: "Media", shortLabel: "Media" },
  { id: "discovery", label: "Discovery", shortLabel: "Discovery" },
  { id: "links", label: "Links", shortLabel: "Links" },
];

export const GAMEDEV_FORM_SECTION_INDEX: Record<GameDevFormSectionId, number> = {
  basics: 0,
  content: 1,
  media: 2,
  discovery: 3,
  links: 4,
};

export const sectionIdFromWizardStep = (step: number): GameDevFormSectionId =>
  GAMEDEV_FORM_SECTIONS[step]?.id ?? "basics";
