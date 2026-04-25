/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { supabase } from "../supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
if (!supabaseUrl) {
  throw new Error("VITE_SUPABASE_URL is not set. Check your .env configuration.");
}

const GITHUB_SEED_FUNCTION_URL = new URL(
  "/functions/v1/github-project-seed",
  supabaseUrl.replace(/\/$/, ""),
).toString();

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

export const fetchGitHubProjectSeed = async (
  repoUrl: string,
): Promise<GitHubProjectSeedResponse> => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("You must be logged in as admin to import project data.");
  }

  const response = await fetch(GITHUB_SEED_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ repoUrl }),
  });

  let responseBody: unknown = {};
  try {
    responseBody = await response.json();
  } catch {
    // intentional — function may return a non-JSON error payload
  }

  if (!response.ok) {
    const message =
      typeof responseBody === "object" && responseBody !== null && "error" in responseBody
        ? String((responseBody as Record<string, unknown>).error)
        : "Failed to import repository data.";

    throw new Error(message);
  }

  return responseBody as GitHubProjectSeedResponse;
};
