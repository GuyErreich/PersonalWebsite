# Coverage & Thoroughness Gate

False “Review passed” results are worse than noisy findings. This gate runs **before** you may declare zero findings.

## 1. Materialize the full surface

Before judging anything:

1. List every path in the tier diff (`merge-base...HEAD` for PR tier).
2. Group by routing signal (TS/React/a11y/Three/security/etc.).
3. Read the **current file contents** for each non-trivial changed path — not only the patch hunk. Hunks hide broken call sites, stale siblings, and incomplete cleanups in the same file.

Skipping a changed file because “the fixer already touched it” or “lint passed” is a process failure.

## 2. Anti-shallow traps (do not do these)

| Trap | Why it creates false cleans |
|---|---|
| Stopping after lint + build green | Most logic/a11y/contract bugs never fail CI |
| Only reading the last commit / fixer diff on a `full` review | Earlier branch commits stay unreviewed |
| Assuming prior-round fixes mean the file is done | Fixes often leave sibling bugs or incomplete root causes |
| Re-checking only previously flagged lines | New issues live in adjacent handlers, props, and shared helpers |
| Declaring clean because the last review was clean | Independent passes must re-earn clean; do not inherit verdict |
| Treating “no obvious crash” as pass | Missing keyboard path, wrong default, stale state still count |

## 3. Per-file minimum (changed code files)

For each changed `*.{ts,tsx,js,jsx}` (and equivalent app code), explicitly check:

1. **Contracts** — props, return values, and error paths match callers in the diff
2. **State / effects** — stale closures, missing cleanup, wrong dependency intent
3. **UI / a11y** (components) — keyboard, roles, focus, non-interactive tabIndex, labels
4. **Resource lifetime** — listeners, timers, R3F/Three disposables, subscriptions
5. **Edge paths** — empty data, loading/error, unmount mid-async

If a file is pure types/config/docs, note it as skimmed; do not pretend it was a deep pass.

## 4. Hotspots from closed / fixed findings

When the orchestrator passes `closed_findings` (or recent fix paths):

1. **Verify** each `status: fixed` item in the current code — if the defect remains, report `Source: recurrence` (reuse signature when possible).
2. **Expand** one hop: same file, same hook/module, callers/callees touched by the fix. Look for *different* issues (incomplete migration, copy-pasted antipattern, missing twin handler).
3. Do **not** re-report the closed wording as a new finding.

## 5. Second+ clean / confirm mindset

When `consecutive_clean_passes >= 1` or focus is confirm-like, treat the prior clean as **probably wrong**:

- Prefer hunting Medium+ logic/a11y/security over Low style.
- Re-walk every changed component and data path once more with a different lens (user flow, failure path, mobile/keyboard).
- Only then may you return zero findings.

## 6. Clean verdict requires evidence

You may return **Review passed** only if all are true:

1. Every applicable phase 0–10 was actually run (including lenses, logic, threat, raw lint/build, coverage).
2. Every non-trivial changed file was opened and checked against §3.
3. Closed/fixed hotspots were verified (§4) when provided.
4. Every matching specialist lens was activated (see `lenses/README.md`).
5. You can list the files and lenses you reviewed (counts are enough in the report).

If time/context pressure would force a skim, **do not claim clean** — report what you could not cover as findings (Medium: “unreviewed surface: …”) or fail the review for incomplete coverage. A thin clean is not allowed.

## 7. Report fragment (required on PR / loop reviews)

Include before the findings table (chat / parent report only — never on GitHub):

```markdown
**Coverage:** N/M changed code files reviewed · hotspots checked: K · phases: 0–10 · lenses: staff-bar+…
```

If `N < M` for non-trivial code files, or a matching lens was skipped, verdict cannot be Review passed.
