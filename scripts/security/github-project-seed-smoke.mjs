/*
 * Security smoke tests for Supabase Edge Function `github-project-seed`.
 *
 * Required env vars:
 * - GITHUB_SEED_URL    (full endpoint URL, e.g. https://<ref>.supabase.co/functions/v1/github-project-seed)
 * - ALLOWED_ORIGIN     (must match ALLOWED_ORIGINS secret value)
 * - SUPABASE_URL       (project URL, e.g. https://<ref>.supabase.co)
 * - SUPABASE_ANON_KEY  (anon/public key)
 * - SUPABASE_SERVICE_ROLE_KEY (service role key, for creating/deleting test users)
 *
 * Optional env vars:
 * - GITHUB_SEED_TEST_REPO_URL (defaults to https://github.com/octocat/Hello-World)
 */

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const GITHUB_SEED_URL = process.env.GITHUB_SEED_URL;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GITHUB_SEED_TEST_REPO_URL =
  process.env.GITHUB_SEED_TEST_REPO_URL ?? "https://github.com/octocat/Hello-World";

const required = {
  GITHUB_SEED_URL,
  ALLOWED_ORIGIN,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
};

const missing = Object.entries(required)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const headersBase = {
  "Content-Type": "application/json",
  Origin: ALLOWED_ORIGIN,
};

const randomSuffix = () => `${Date.now()}-${randomUUID().replace(/-/g, "").slice(0, 12)}`;
const randomStrongPassword = () => `GhSeed!${randomSuffix()}#A9`;

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const createUserAndToken = async ({ email, password, appMetadata }) => {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: appMetadata,
  });

  if (error || !data.user) {
    throw new Error(`Failed to create test user ${email}: ${error?.message ?? "unknown error"}`);
  }

  const { data: sessionData, error: signInError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !sessionData.session?.access_token) {
    throw new Error(
      `Failed to sign in test user ${email}: ${signInError?.message ?? "missing access token"}`,
    );
  }

  return {
    userId: data.user.id,
    accessToken: sessionData.session.access_token,
  };
};

const run = async () => {
  let failed = 0;
  const createdUserIds = [];

  try {
    const adminEmail = `gh-seed-admin-${randomSuffix()}@example.com`;
    const userEmail = `gh-seed-user-${randomSuffix()}@example.com`;
    const adminPassword = randomStrongPassword();
    const userPassword = randomStrongPassword();

    const { userId: adminUserId, accessToken: adminJwt } = await createUserAndToken({
      email: adminEmail,
      password: adminPassword,
      appMetadata: { roles: ["admin"] },
    });
    createdUserIds.push(adminUserId);

    const { userId: regularUserId, accessToken: userJwt } = await createUserAndToken({
      email: userEmail,
      password: userPassword,
      appMetadata: {},
    });
    createdUserIds.push(regularUserId);

    const missingRepoUrl = `https://github.com/octocat/repo-does-not-exist-${randomSuffix()}`;

    const tests = [
      {
        name: "rejects non-POST method",
        method: "GET",
        expectedStatus: 405,
        headers: headersBase,
        body: null,
      },
      {
        name: "rejects disallowed origin",
        method: "POST",
        expectedStatus: 403,
        headers: { ...headersBase, Origin: "https://invalid-origin.example" },
        body: { repoUrl: GITHUB_SEED_TEST_REPO_URL },
      },
      {
        name: "rejects missing authorization",
        method: "POST",
        expectedStatus: 401,
        headers: headersBase,
        body: { repoUrl: GITHUB_SEED_TEST_REPO_URL },
      },
      {
        name: "rejects non-admin user",
        method: "POST",
        expectedStatus: 403,
        headers: { ...headersBase, Authorization: `Bearer ${userJwt}` },
        body: { repoUrl: GITHUB_SEED_TEST_REPO_URL },
      },
      {
        name: "rejects invalid body",
        method: "POST",
        expectedStatus: 400,
        headers: { ...headersBase, Authorization: `Bearer ${adminJwt}` },
        body: { repoUrl: "" },
      },
      {
        name: "rejects invalid repository URL",
        method: "POST",
        expectedStatus: 400,
        headers: { ...headersBase, Authorization: `Bearer ${adminJwt}` },
        body: { repoUrl: "https://example.com/not-github/repo" },
      },
      {
        name: "returns metadata for valid admin request",
        method: "POST",
        expectedStatus: 200,
        headers: { ...headersBase, Authorization: `Bearer ${adminJwt}` },
        body: { repoUrl: GITHUB_SEED_TEST_REPO_URL },
      },
      {
        name: "maps nonexistent GitHub repository to 404",
        method: "POST",
        expectedStatus: 404,
        headers: { ...headersBase, Authorization: `Bearer ${adminJwt}` },
        body: { repoUrl: missingRepoUrl },
      },
    ];

    for (const test of tests) {
      const res = await fetch(GITHUB_SEED_URL, {
        method: test.method,
        headers: test.headers,
        body: test.body ? JSON.stringify(test.body) : undefined,
      });

      const ok = res.status === test.expectedStatus;
      if (!ok) {
        failed += 1;
        const bodyText = await res.text();
        console.error(
          `FAIL ${test.name}: expected ${test.expectedStatus}, received ${res.status}. Body: ${bodyText}`,
        );
        continue;
      }

      if (test.expectedStatus === 200) {
        const payload = await res.json();
        const isValidPayload =
          typeof payload === "object" &&
          payload !== null &&
          typeof payload.repoFullName === "string" &&
          typeof payload.title === "string" &&
          typeof payload.githubUrl === "string";

        if (!isValidPayload) {
          failed += 1;
          console.error(`FAIL ${test.name}: successful response missing expected payload fields.`);
          continue;
        }
      }

      process.stdout.write(`PASS ${test.name}\n`);
    }
  } catch (e) {
    failed += 1;
    console.error(`FAIL setup/runtime: ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    for (const userId of createdUserIds) {
      const { error } = await adminClient.auth.admin.deleteUser(userId);
      if (error) {
        failed += 1;
        console.error(`FAIL cleanup for user ${userId}: ${error.message}`);
        continue;
      }

      process.stdout.write(`PASS cleanup deleted user ${userId}\n`);
    }
  }

  if (failed > 0) {
    console.error(`\nGitHub seed smoke tests failed: ${failed}`);
    process.exit(1);
  }

  process.stdout.write("\nAll github-project-seed smoke tests passed.\n");
};

void run();
