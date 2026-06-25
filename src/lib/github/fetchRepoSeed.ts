/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { getEdgeFunctionAuthHeaders, supabase } from "../supabase";

const getGitHubSeedFunctionUrl = (): string => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!supabaseUrl) {
    throw new Error("VITE_SUPABASE_URL is not set. Check your .env configuration.");
  }

  return new URL("/functions/v1/github-project-seed", supabaseUrl.replace(/\/$/, "")).toString();
};

export interface GitHubProjectSeedResponse {
  repoFullName: string;
  title: string;
  description: string;
  readme: string;
  tags: string[];
  githubUrl: string;
  liveUrl: string | null;
  language: string | null;
  license: string | null;
  stars: number;
}

const SEED_REQUEST_TIMEOUT_MS = 15_000;

const isGitHubProjectSeedResponse = (value: unknown): value is GitHubProjectSeedResponse => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.repoFullName === "string" &&
    typeof record.title === "string" &&
    typeof record.description === "string" &&
    typeof record.readme === "string" &&
    Array.isArray(record.tags) &&
    record.tags.every((tag) => typeof tag === "string") &&
    typeof record.githubUrl === "string" &&
    (record.liveUrl === null || typeof record.liveUrl === "string") &&
    (record.language === null || typeof record.language === "string") &&
    (record.license === null || typeof record.license === "string") &&
    typeof record.stars === "number" &&
    Number.isFinite(record.stars)
  );
};

export const fetchGitHubProjectSeed = async (
  repoUrl: string,
): Promise<GitHubProjectSeedResponse> => {
  const githubSeedFunctionUrl = getGitHubSeedFunctionUrl();
  const abortController = new AbortController();
  const timeoutId = window.setTimeout(() => {
    abortController.abort();
  }, SEED_REQUEST_TIMEOUT_MS);

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("You must be logged in as admin to import project data.");
  }

  let response: Response;
  try {
    response = await fetch(githubSeedFunctionUrl, {
      method: "POST",
      headers: getEdgeFunctionAuthHeaders(session.access_token),
      body: JSON.stringify({ repoUrl }),
      signal: abortController.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("GitHub import request timed out. Please try again.");
    }

    throw new Error(error instanceof Error ? error.message : "GitHub import failed.");
  } finally {
    window.clearTimeout(timeoutId);
  }

  let responseBody: unknown = {};
  try {
    responseBody = await response.json();
  } catch {
    // intentional — function may return a non-JSON error payload
  }

  if (!response.ok) {
    const message =
      response.status === 403 &&
      (typeof responseBody !== "object" || responseBody === null || !("error" in responseBody))
        ? `Request blocked (403). Ensure the Supabase ALLOWED_ORIGINS secret includes ${window.location.origin}.`
        : typeof responseBody === "object" && responseBody !== null && "error" in responseBody
          ? String((responseBody as Record<string, unknown>).error)
          : "Failed to import repository data.";

    throw new Error(message);
  }

  if (!isGitHubProjectSeedResponse(responseBody)) {
    throw new Error("GitHub import returned an invalid response payload.");
  }

  return responseBody;
};
