/*
 * Parity check for scripts/infra/parse-allowed-origins.mjs against shared fixtures.
 * When fixtures change, update supabase/functions/_shared/allowedOrigins.ts to match.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseAllowedOrigins } from "./parse-allowed-origins.mjs";

const fixturesPath = resolve(import.meta.dirname, "allowed-origins-fixtures.json");
const fixtures = JSON.parse(readFileSync(fixturesPath, "utf8"));

let failed = 0;

for (const fixture of fixtures) {
  const actual = parseAllowedOrigins(fixture.input);
  const expected = fixture.expected;

  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    failed += 1;
    console.error(`FAIL: ${fixture.name}`);
    console.error(`  input:    ${JSON.stringify(fixture.input)}`);
    console.error(`  expected: ${expectedJson}`);
    console.error(`  actual:   ${actualJson}`);
  }
}

if (failed > 0) {
  console.error(`${failed} fixture(s) failed.`);
  process.exit(1);
}

console.warn(`All ${fixtures.length} allowed-origins fixtures passed.`);
