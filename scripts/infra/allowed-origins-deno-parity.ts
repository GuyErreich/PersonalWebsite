/**
 * Parity check for supabase/functions/_shared/allowedOrigins.ts against shared fixtures.
 * Invoked by scripts/infra/parse-allowed-origins-parity.mjs (requires Deno).
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseAllowedOrigins } from "../../supabase/functions/_shared/allowedOrigins.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const fixturesPath = resolve(scriptDir, "allowed-origins-fixtures.json");
const fixtures = JSON.parse(readFileSync(fixturesPath, "utf8")) as Array<{
  name: string;
  input: string;
  expected: string[];
}>;

let failed = 0;

for (const fixture of fixtures) {
  const actual = [...parseAllowedOrigins(fixture.input)].sort();
  const expected = [...fixture.expected].sort();

  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    failed += 1;
    console.error(`FAIL [Deno]: ${fixture.name}`);
    console.error(`  input:    ${JSON.stringify(fixture.input)}`);
    console.error(`  expected: ${expectedJson}`);
    console.error(`  actual:   ${actualJson}`);
  }
}

if (failed > 0) {
  console.error(`${failed} Deno fixture(s) failed.`);
  Deno.exit(1);
}

console.warn(`All ${fixtures.length} allowed-origins Deno fixtures passed.`);
