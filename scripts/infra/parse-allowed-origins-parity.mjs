/*
 * Parity check for allowed-origins parsers against shared fixtures.
 * - Node: scripts/infra/parse-allowed-origins.mjs
 * - Deno: supabase/functions/_shared/allowedOrigins.ts
 *
 * When fixtures change, update both parsers to match.
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseAllowedOrigins } from "./parse-allowed-origins.mjs";

const fixturesPath = resolve(import.meta.dirname, "allowed-origins-fixtures.json");
const denoParityScript = resolve(import.meta.dirname, "allowed-origins-deno-parity.ts");
const fixtures = JSON.parse(readFileSync(fixturesPath, "utf8"));

let failed = 0;

for (const fixture of fixtures) {
  const actual = parseAllowedOrigins(fixture.input);
  const expected = fixture.expected;

  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    failed += 1;
    console.error(`FAIL [Node]: ${fixture.name}`);
    console.error(`  input:    ${JSON.stringify(fixture.input)}`);
    console.error(`  expected: ${expectedJson}`);
    console.error(`  actual:   ${actualJson}`);
  }
}

if (failed > 0) {
  console.error(`${failed} Node fixture(s) failed.`);
  process.exit(1);
}

console.warn(`All ${fixtures.length} allowed-origins Node fixtures passed.`);

const deno = spawnSync("deno", ["run", "--allow-read", denoParityScript], {
  encoding: "utf8",
  stdio: "pipe",
});

if (deno.error?.code === "ENOENT") {
  console.error(
    "Deno is required to validate supabase/functions/_shared/allowedOrigins.ts. Install Deno: https://docs.deno.com/runtime/getting_started/installation/",
  );
  process.exit(1);
}

if (deno.status !== 0) {
  if (deno.stdout) process.stdout.write(deno.stdout);
  if (deno.stderr) process.stderr.write(deno.stderr);
  process.exit(deno.status ?? 1);
}

if (deno.stdout) process.stdout.write(deno.stdout);
if (deno.stderr) process.stderr.write(deno.stderr);

console.warn("Allowed-origins parity check passed (Node + Deno).");
