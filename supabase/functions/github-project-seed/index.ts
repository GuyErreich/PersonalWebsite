/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { createClient } from "npm:@supabase/supabase-js@2.102.1";

const rawOrigins = Deno.env.get("ALLOWED_ORIGINS") ?? "";
if (!rawOrigins) {
  throw new Error("ALLOWED_ORIGINS secret is not set");
}

const ALLOWED_ORIGINS = new Set(
  rawOrigins
    .split(",")
    .map((origin: string) => origin.trim())
    .filter(Boolean),
);

interface RepoSeedBody {
  repoUrl: string;
}

interface GitHubRepoResponse {
  full_name: string;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  topics: string[];
  language: string | null;
  stargazers_count: number;
  license: { spdx_id: string | null; name: string | null } | null;
}

interface GitHubReadmeResponse {
  content: string;
  encoding: "base64" | string;
}

const parseRepoCoordinates = (repoUrl: string): { owner: string; repo: string } => {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(repoUrl.trim());
  } catch {
    throw new Error("Repository URL must be valid.");
  }

  if (parsedUrl.protocol !== "https:") {
    throw new Error("Repository URL must use HTTPS.");
  }

  if (parsedUrl.hostname !== "github.com") {
    throw new Error("Only github.com repositories are supported right now.");
  }

  const segments = parsedUrl.pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    throw new Error("Repository URL must include owner and repository name.");
  }

  const owner = segments[0].trim();
  const repo = segments[1].replace(/\.git$/i, "").trim();

  if (!owner || !repo) {
    throw new Error("Repository URL must include owner and repository name.");
  }

  return { owner, repo };
};

const normalizeRepoDescription = (description: string | null, repoName: string): string => {
  if (!description || !description.trim()) {
    return `Project seeded from ${repoName}. Add gameplay and technical details in markdown.`;
  }

  return description.trim();
};

const decodeReadme = (data: GitHubReadmeResponse): string => {
  if (data.encoding !== "base64") return "";

  try {
    return atob(data.content.replace(/\n/g, "")).trim();
  } catch {
    return "";
  }
};

function corsHeaders(origin: string): Record<string, string> | null {
  if (!ALLOWED_ORIGINS.has(origin)) return null;

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") ?? "";
  const CORS = corsHeaders(origin);

  if (!CORS) {
    return new Response(null, { status: 403 });
  }

  function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: "Supabase server configuration missing" }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const roleValue = user.app_metadata?.roles;
  const isAdminRole = (value: unknown) => {
    if (Array.isArray(value)) return value.some((role) => role === "admin");
    return typeof value === "string" && value === "admin";
  };

  if (!isAdminRole(roleValue)) {
    return json({ error: "Forbidden" }, 403);
  }

  let body: RepoSeedBody;
  try {
    body = (await req.json()) as RepoSeedBody;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.repoUrl || typeof body.repoUrl !== "string") {
    return json({ error: "repoUrl is required" }, 400);
  }

  let owner = "";
  let repo = "";
  try {
    const parsed = parseRepoCoordinates(body.repoUrl);
    owner = parsed.owner;
    repo = parsed.repo;
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Invalid repository URL" }, 400);
  }

  const token = Deno.env.get("GITHUB_TOKEN") ?? "";
  const authTokenHeader = token ? { Authorization: `Bearer ${token}` } : {};
  const githubHeaders = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "personal-website-supabase-edge",
    ...authTokenHeader,
  };

  const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: githubHeaders,
  });

  if (!repoResponse.ok) {
    if (repoResponse.status === 404) {
      return json({ error: "Repository not found or not accessible with configured token." }, 404);
    }

    return json({ error: "Failed to fetch repository metadata from GitHub." }, 502);
  }

  const repoData = (await repoResponse.json()) as GitHubRepoResponse;

  const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers: githubHeaders,
  });

  let readmeMarkdown = "";
  if (readmeResponse.ok) {
    const readmeData = (await readmeResponse.json()) as GitHubReadmeResponse;
    readmeMarkdown = decodeReadme(readmeData);
  }

  const title = repoData.name
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim();

  const payload = {
    repoFullName: repoData.full_name,
    title,
    description: normalizeRepoDescription(repoData.description, repoData.full_name),
    readme: readmeMarkdown,
    tags: Array.isArray(repoData.topics) ? repoData.topics : [],
    githubUrl: repoData.html_url,
    liveUrl: repoData.homepage,
    language: repoData.language,
    license: repoData.license?.spdx_id ?? repoData.license?.name ?? null,
    stars: repoData.stargazers_count,
  };

  return json(payload, 200);
});
