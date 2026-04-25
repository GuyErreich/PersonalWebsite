/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov"];

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];
const GAMEDEV_BODY_MARKER = "\n\n[//]: # (BODY)\n\n";

export const buildGameDevProjectPath = (id: string) =>
  `/gamedev/projects/${encodeURIComponent(id)}`;

export const markdownToPlainText = (content: string): string => {
  const plain = content
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/>\s?/g, "")
    .replace(/[-*+]\s+/g, "")
    .replace(/\d+\.\s+/g, "")
    .replace(/\|/g, " ")
    .replace(/[*_~]/g, "");

  return plain.replace(/\s+/g, " ").trim();
};

export const parseGameDevStoredContent = (
  content: string,
): { summary: string; body: string; hasStructuredBody: boolean } => {
  const markerIndex = content.indexOf(GAMEDEV_BODY_MARKER);

  if (markerIndex < 0) {
    return {
      summary: markdownToPlainText(content).slice(0, 180),
      body: content,
      hasStructuredBody: false,
    };
  }

  const summary = content.slice(0, markerIndex).trim();
  const body = content.slice(markerIndex + GAMEDEV_BODY_MARKER.length).trim();

  return {
    summary,
    body,
    hasStructuredBody: true,
  };
};

export const buildGameDevStoredContent = (summary: string, body: string): string => {
  const normalizedSummary = summary.trim();
  const normalizedBody = body.trim();

  if (!normalizedSummary) return normalizedBody;
  if (!normalizedBody) return normalizedSummary;

  return `${normalizedSummary}${GAMEDEV_BODY_MARKER}${normalizedBody}`;
};

export const buildGameDevSummary = (content: string, maxLength = 180): string => {
  const parsed = parseGameDevStoredContent(content);
  const source = parsed.summary.length > 0 ? parsed.summary : parsed.body;
  const plain = markdownToPlainText(source);

  if (plain.length <= maxLength) return plain;

  return `${plain.slice(0, maxLength - 1).trimEnd()}…`;
};

export const isVideoUrl = (url: string): boolean => {
  const normalized = url.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => normalized.includes(ext));
};

export const isImageUrl = (url: string): boolean => {
  const normalized = url.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => normalized.includes(ext));
};

export const inferMediaTypeFromUrl = (url: string): "video" | "image" => {
  if (isVideoUrl(url)) return "video";
  return "image";
};

export const inferMediaTypeFromFile = (file: File): "video" | "image" => {
  return file.type.toLowerCase().startsWith("video/") ? "video" : "image";
};
