# Coverage & Thoroughness Gate

False “Review passed” results are worse than noisy findings. This gate runs **before** you may declare zero findings. Scope **M** by round focus.

## Focus-scoped surface (M)

| Focus | M (denominator) |
|---|---|
| `full` | All non-trivial changed code files in `merge-base...HEAD` |
| `delta` | Files in fixer diff ∪ `fix_hotspots` ∪ previously flagged paths only |
| `confirm` | All non-trivial changed code files in `merge-base...HEAD` (pure docs/config may be skimmed) |

Lint/Validate are **not** part of coverage M — validate may be skipped when the orchestrator fingerprint still matches (including on `full` / `confirm`). Do not fail coverage solely because validate was skipped.

## 1. Materialize the surface for this focus

1. List paths in the focus set above.
2. Group by routing signal.
3. Read **current file contents** for each non-trivial path in the set — not only the patch hunk.

Skipping a file in M because “the fixer already touched it” or “lint passed” is a process failure.

## 2. Anti-shallow traps

| Trap | Why it creates false cleans |
|---|---|
| Stopping after Validate green | Most logic/a11y/contract bugs never fail CI |
| Only reading the last commit on a `full` review | Earlier branch commits stay unreviewed |
| Assuming prior-round fixes mean the file is done | Sibling bugs / incomplete root causes |
| Re-checking only previously flagged lines | Adjacent handlers and shared helpers |
| Declaring clean because the last review was clean | Independent passes must re-earn clean |
| Treating “no obvious crash” as pass | Missing keyboard path, wrong default, stale state |

## 3. Per-file minimum (code files in M)

For each `*.{ts,tsx,js,jsx}` (and equivalent) in M:

1. **Contracts** — props, returns, error paths vs callers
2. **State / effects** — stale closures, cleanup, deps intent
3. **UI / a11y** (components) — keyboard, roles, focus, labels
4. **Resource lifetime** — listeners, timers, R3F disposables
5. **Edge paths** — empty, loading/error, unmount mid-async

Pure types/config/docs: skim and note; do not pretend deep pass.

## 4. Hotspots from closed / fixed findings

1. Verify each `status: fixed` — still present ⇒ `Source: recurrence`.
2. Expand one hop for *different* issues.
3. Do not re-report closed wording.
4. **Contested fix shape** — if you would flag code a prior round deliberately introduced as the fix (see `closed_findings[].fix_shape`), tag `Source: contested`, describe both shapes, and never propose a plain revert. A different bug in a previously fixed file stays a normal finding.

## 5. Confirm / second-clean mindset

When `consecutive_clean_passes >= 1` or focus is `confirm`:

1. **Verify hotspots** — every `status: fixed` finding actually landed and did not regress (§4). Still present ⇒ `Source: recurrence`.
2. **One honest independent pass** over the rest of **M** for genuine correctness, security, and a11y defects (contracts, state/effects, keyboard/focus, disposal, empty/error paths).
3. **Manufactured-finding guard** — a confirm-pass finding must name a **concrete, reproducible defect** with clear user-facing or security harm, statable in one sentence. Style, naming, “could be improved,” or subjective best-practice preferences do **not** qualify on a confirm pass — those belong to `full` reviews only, and even then must clear `manage_severity`.

Do **not** invent a finding just because this is a second pass. An empty findings table after a real verify + honest scan is a valid confirm outcome.

## 6. Lenses

Activate staff-bar plus every specialist lens that matches **at least one file in M**. Skip lenses with zero files in the focus set (especially on `delta`).

## 7. Clean verdict requires evidence

**Review passed** only if:

1. Applicable phases for this focus were run (validate may be `skip` when fingerprint-matched).
2. Every non-trivial file in **M** was opened and checked (§3).
3. Hotspots verified when provided (§4).
4. Every matching in-scope lens was activated (§6).
5. You can report N/M and lenses.

If you would skim M, do not claim clean — report unreviewed surface or fail coverage.

## 8. Report fragment

```markdown
**Coverage:** N/M changed code files reviewed (focus=…) · hotspots checked: K · phases: … · lenses: staff-bar+… · validate: pass|fail|skip
```

If `N < M` for non-trivial code files in M, or an in-scope lens was skipped, verdict cannot be Review passed.
