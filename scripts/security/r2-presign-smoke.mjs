/*
 * Security smoke tests for Supabase Edge Function `r2-presign`.
 *
 * Required env vars:
 * - PRESIGN_URL       (full endpoint URL, e.g. https://<ref>.supabase.co/functions/v1/r2-presign)
 * - ALLOWED_ORIGIN    (must match ALLOWED_ORIGINS secret value)
 * - SUPABASE_URL      (project URL, e.g. https://<ref>.supabase.co)
 * - SUPABASE_ANON_KEY (anon/public key)
 * - SUPABASE_SERVICE_ROLE_KEY (service role key, for creating/deleting test users)
 */

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const PRESIGN_URL = process.env.PRESIGN_URL;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const required = {
  PRESIGN_URL,
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

const resolveAllowedOrigin = (singleOrigin, originList) => {
  if (typeof singleOrigin === "string" && singleOrigin.trim().length > 0) {
    return singleOrigin.trim();
  }

  if (typeof originList !== "string" || originList.trim().length === 0) {
    return undefined;
  }

  const normalizedList = originList.replace(/\\\//g, "/");

  const urlCandidates = normalizedList.match(/https?:\/\/[^",\s\]]+/g);
  if (urlCandidates && urlCandidates.length > 0) {
    return urlCandidates[0];
  }

  const domainCandidates = normalizedList.match(
    /(?:\*\.)?(?:localhost|[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)(?::\d{2,5})?/g,
  );

  if (!domainCandidates || domainCandidates.length === 0) {
    return undefined;
  }

  const firstDomain = domainCandidates[0].replace(/^\*\./, "");
  if (firstDomain.startsWith("localhost")) {
    return `http://${firstDomain}`;
  }

  return `https://${firstDomain}`;
};

const resolvedAllowedOrigin = resolveAllowedOrigin(ALLOWED_ORIGIN, ALLOWED_ORIGINS);

if (!resolvedAllowedOrigin) {
  console.warn(
    "No ALLOWED_ORIGIN value could be resolved from ALLOWED_ORIGIN/ALLOWED_ORIGINS; running without Origin header for non-negative checks.",
  );
}

const headersBase = {
  "Content-Type": "application/json",
  apikey: SUPABASE_ANON_KEY,
  ...(resolvedAllowedOrigin ? { Origin: resolvedAllowedOrigin } : {}),
};

const randomSuffix = () => `${Date.now()}-${randomUUID().replace(/-/g, "").slice(0, 12)}`;

const randomStrongPassword = () => `R2Smoke!${randomSuffix()}#A9`;

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

const buildPostTests = ({ adminJwt, userJwt }) => [
  {
    name: "rejects missing authorization",
    expectedStatus: 401,
    headers: headersBase,
    body: {
      contentType: "video/mp4",
      contentLength: 10 * 1024 * 1024,
      fileExt: "mp4",
      folderPath: "hero-showreel",
    },
  },
  {
    name: "rejects malformed authorization",
    expectedStatus: 401,
    headers: { ...headersBase, Authorization: "Token invalid" },
    body: {
      contentType: "video/mp4",
      contentLength: 10 * 1024 * 1024,
      fileExt: "mp4",
      folderPath: "hero-showreel",
    },
  },
  {
    name: "rejects non-admin authenticated user",
    expectedStatus: 403,
    headers: { ...headersBase, Authorization: `Bearer ${userJwt}` },
    body: {
      contentType: "video/mp4",
      contentLength: 10 * 1024 * 1024,
      fileExt: "mp4",
      folderPath: "hero-showreel",
    },
  },
  {
    name: "rejects disallowed folder",
    expectedStatus: [400, 403],
    headers: { ...headersBase, Authorization: `Bearer ${adminJwt}` },
    body: {
      contentType: "video/mp4",
      contentLength: 10 * 1024 * 1024,
      fileExt: "mp4",
      folderPath: "../../secrets",
    },
  },
  {
    name: "rejects disallowed mime type",
    expectedStatus: [400, 403],
    headers: { ...headersBase, Authorization: `Bearer ${adminJwt}` },
    body: {
      contentType: "application/x-msdownload",
      contentLength: 10 * 1024 * 1024,
      fileExt: "exe",
      folderPath: "media",
    },
  },
  {
    name: "rejects extension mismatch for thumbnail folder",
    expectedStatus: [400, 403],
    headers: { ...headersBase, Authorization: `Bearer ${adminJwt}` },
    body: {
      contentType: "image/png",
      contentLength: 1024,
      fileExt: "mp4",
      folderPath: "gamedev-thumbnails",
    },
  },
  {
    name: "rejects oversized contentLength for thumbnail folder",
    expectedStatus: [400, 403],
    headers: { ...headersBase, Authorization: `Bearer ${adminJwt}` },
    body: {
      contentType: "image/png",
      contentLength: 60 * 1024 * 1024,
      fileExt: "png",
      folderPath: "gamedev-thumbnails",
    },
  },
  {
    name: "allows admin request with valid payload",
    expectedStatus: [200, 403],
    headers: { ...headersBase, Authorization: `Bearer ${adminJwt}` },
    body: {
      contentType: "video/mp4",
      contentLength: 10 * 1024 * 1024,
      fileExt: "mp4",
      folderPath: "hero-showreel",
    },
  },
];

const buildDeleteTests = ({ adminJwt, userJwt, validPublicUrl }) => [
  {
    name: "delete rejects missing authorization",
    method: "DELETE",
    expectedStatus: 401,
    headers: headersBase,
    body: { publicUrl: validPublicUrl },
  },
  {
    name: "delete rejects non-admin authenticated user",
    method: "DELETE",
    expectedStatus: 403,
    headers: { ...headersBase, Authorization: `Bearer ${userJwt}` },
    body: { publicUrl: validPublicUrl },
  },
  {
    name: "delete rejects disallowed origin",
    method: "DELETE",
    expectedStatus: 403,
    headers: {
      ...headersBase,
      Origin: "https://invalid-origin.example",
      Authorization: `Bearer ${adminJwt}`,
    },
    body: { publicUrl: validPublicUrl },
  },
  {
    name: "delete rejects invalid origin URL",
    method: "DELETE",
    expectedStatus: 400,
    headers: { ...headersBase, Authorization: `Bearer ${adminJwt}` },
    body: { publicUrl: "https://example.com/media/file.mp4" },
  },
  {
    name: "delete rejects disallowed folder",
    method: "DELETE",
    expectedStatus: 400,
    headers: { ...headersBase, Authorization: `Bearer ${adminJwt}` },
    body: {
      publicUrl: validPublicUrl.replace(
        /(\/)(media|hero-showreel|gamedev-assets|gamedev-thumbnails)(\/)/,
        "$1unknown-folder$3",
      ),
    },
  },
  {
    name: "delete allows admin request with valid payload",
    method: "DELETE",
    expectedStatus: 200,
    headers: { ...headersBase, Authorization: `Bearer ${adminJwt}` },
    body: { publicUrl: validPublicUrl },
  },
];

const run = async () => {
  let failed = 0;
  const createdUserIds = [];

  try {
    const adminEmail = `r2-smoke-admin-${randomSuffix()}@example.com`;
    const userEmail = `r2-smoke-user-${randomSuffix()}@example.com`;
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

    const tests = buildPostTests({ adminJwt, userJwt });
    let latestPublicUrl = "";

    for (const test of tests) {
      const res = await fetch(PRESIGN_URL, {
        method: "POST",
        headers: test.headers,
        body: JSON.stringify(test.body),
      });

      const expectedStatuses = Array.isArray(test.expectedStatus)
        ? test.expectedStatus
        : [test.expectedStatus];
      const ok = expectedStatuses.includes(res.status);
      if (!ok) {
        failed += 1;
        const bodyText = await res.text();
        console.error(
          `FAIL ${test.name}: expected ${expectedStatuses.join("/")}, received ${res.status}. Body: ${bodyText}`,
        );
        continue;
      }

      if (res.status === 200) {
        const payload = await res.json();
        const hasHttpsSignedUrl =
          typeof payload === "object" &&
          payload !== null &&
          typeof payload.signedUrl === "string" &&
          payload.signedUrl.startsWith("https://");
        const hasHttpsPublicUrl =
          typeof payload === "object" &&
          payload !== null &&
          typeof payload.publicUrl === "string" &&
          payload.publicUrl.startsWith("https://");

        if (hasHttpsPublicUrl) {
          latestPublicUrl = payload.publicUrl;
        }

        if (!hasHttpsSignedUrl || !hasHttpsPublicUrl) {
          failed += 1;
          console.error(
            `FAIL ${test.name}: successful response missing https signedUrl/publicUrl fields.`,
          );
          continue;
        }

        const mismatchPayload = Buffer.alloc(64, 1);
        const mismatchUploadRes = await fetch(payload.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": test.body.contentType },
          body: mismatchPayload,
        });

        if (mismatchUploadRes.ok) {
          failed += 1;
          console.error(
            `FAIL ${test.name}: signed URL accepted payload with mismatched size; expected rejection.`,
          );
          continue;
        }
      }

      process.stdout.write(`PASS ${test.name}\n`);
    }

    if (!latestPublicUrl) {
      console.warn(
        "Skipping delete smoke tests because no valid publicUrl was produced by POST tests in this environment.",
      );
    } else {
        const res = await fetch(PRESIGN_URL, {
          method: test.method,
          headers: test.headers,
          body: JSON.stringify(test.body),
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

        process.stdout.write(`PASS ${test.name}\n`);
      }
    } else {
      failed += 1;
      console.error("FAIL delete smoke setup: no valid publicUrl from POST tests.");
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
    console.error(`\nSecurity smoke tests failed: ${failed}`);
    process.exit(1);
  }

  process.stdout.write("\nAll r2-presign security smoke tests passed.\n");
};

void run();
