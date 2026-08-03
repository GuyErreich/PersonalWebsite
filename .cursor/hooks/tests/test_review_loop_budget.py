"""Unit tests for review-loop cost and budget guards.

These protect against regressions that could silently overspend (or wrongly
block) before a subagent starts.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

HOOKS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HOOKS))

from _cost import (  # noqa: E402
    cold_projection,
    estimate_transcript,
    normalize_loop_model,
    project_next_cost,
    resolve_pricing_mode,
    segment_pricing_mode,
)
from review_loop_budget import decide_subagent_start  # noqa: E402

ROOT = Path(__file__).resolve().parents[3]
PRICING_PATH = (
    ROOT
    / ".cursor"
    / "skills"
    / "code"
    / "ci"
    / "pr-review-loop"
    / "assets"
    / "pricing.default.json"
)


@pytest.fixture
def pricing() -> dict:
    """Load the committed default pricing table."""
    return json.loads(PRICING_PATH.read_text(encoding="utf-8"))


class TestNormalizeLoopModel:
    """Role-model aliases must default cheap and map frontier names."""

    def test_default_inherit(self) -> None:
        assert normalize_loop_model(None) == "inherit"
        assert normalize_loop_model("") == "inherit"
        assert normalize_loop_model("auto") == "inherit"

    def test_opus_alias(self) -> None:
        assert normalize_loop_model("opus") == "claude-opus-5-thinking-high"
        assert normalize_loop_model("opus-5") == "claude-opus-5-thinking-high"

    def test_unknown_falls_back_to_inherit(self) -> None:
        assert normalize_loop_model("totally-unknown-model") == "inherit"


class TestPricingMode:
    """Loop caps stay auto; named segments estimate at api rates."""

    def test_segment_modes(self) -> None:
        assert segment_pricing_mode("inherit") == "auto"
        assert segment_pricing_mode("auto") == "auto"
        assert segment_pricing_mode("opus") == "api"

    def test_loop_caps_stay_auto_by_default(self, pricing: dict) -> None:
        assert resolve_pricing_mode(pricing, state={"pricing_mode": "auto"}) == "auto"

    def test_named_model_forces_api_estimate(self, pricing: dict) -> None:
        assert (
            resolve_pricing_mode(pricing, state={"pricing_mode": "auto"}, model="opus")
            == "api"
        )

    def test_explicit_wins(self, pricing: dict) -> None:
        assert resolve_pricing_mode(pricing, model="opus", explicit="auto") == "auto"


class TestColdProjection:
    """Cold USD must rise for named models under Auto caps."""

    def test_auto_cold_is_cheap(self) -> None:
        state = {"pricing_mode": "auto", "reviewer_model": "inherit"}
        _tok, usd = cold_projection(state, model="inherit")
        assert usd == pytest.approx(0.15)

    def test_opus_cold_under_auto_caps_is_expensive(self) -> None:
        state = {
            "pricing_mode": "auto",
            "reviewer_model": "claude-opus-5-thinking-high",
        }
        _tok, usd = cold_projection(state, model="claude-opus-5-thinking-high")
        assert usd >= 0.75


class TestProjectNextCost:
    """Preflight projection must catch over-cap before any spend."""

    def test_empty_rounds_uses_cold(self) -> None:
        state = {"pricing_mode": "auto", "rounds": []}
        tok, usd = project_next_cost(state, model="inherit")
        assert tok == pytest.approx(120_000.0)
        assert usd == pytest.approx(0.15)

    def test_uses_max_of_last_and_average(self) -> None:
        state = {
            "pricing_mode": "auto",
            "rounds": [
                {"cost": {"tokens_est": 100_000, "usd_est": 0.05}},
                {"cost": {"tokens_est": 200_000, "usd_est": 0.10}},
            ],
        }
        tok, usd = project_next_cost(state)
        assert tok == pytest.approx(200_000.0)
        assert usd == pytest.approx(0.10)


class TestEstimateTranscript:
    """Auto estimates must stay far below named-frontier API estimates."""

    def test_auto_much_cheaper_than_opus(self, pricing: dict, tmp_path: Path) -> None:
        path = tmp_path / "t.jsonl"
        lines: list[str] = []
        for _ in range(5):
            lines.append(
                json.dumps({"role": "user", "message": {"content": "x" * 20_000}})
            )
            lines.append(
                json.dumps(
                    {
                        "role": "assistant",
                        "message": {"content": "y" * 20_000},
                    }
                )
            )
        path.write_text("\n".join(lines) + "\n", encoding="utf-8")

        auto = estimate_transcript(path, pricing, model="inherit", pricing_mode="auto")
        api = estimate_transcript(
            path,
            pricing,
            model="claude-opus-5-thinking-high",
            pricing_mode="api",
        )
        assert auto.tokens_est == api.tokens_est
        assert auto.usd_est < api.usd_est / 5


class TestDecideSubagentStart:
    """Budget hook decisions that gate real spend."""

    @staticmethod
    def _loop_event(**extra: object) -> dict:
        return {"subagent_type": "pr-reviewer", **extra}

    def test_inactive_allows(self) -> None:
        assert decide_subagent_start({"active": False})["permission"] == "allow"

    def test_non_loop_subagent_allowed_even_when_loop_escalated(self) -> None:
        out = decide_subagent_start(
            {"active": True, "escalation_pending": True},
            {"subagent_type": "explore"},
            fingerprint="",
        )
        assert out["permission"] == "allow"

    def test_general_purpose_not_gated(self) -> None:
        out = decide_subagent_start(
            {
                "active": True,
                "round": 99,
                "max_rounds": 1,
                "max_tokens_est": 1,
                "max_usd_est": 0.01,
                "totals": {"tokens_est": 0, "usd_est": 0},
            },
            {"subagent_type": "generalPurpose"},
            fingerprint="",
        )
        assert out["permission"] == "allow"

    def test_escalation_denies(self) -> None:
        out = decide_subagent_start(
            {"active": True, "escalation_pending": True},
            self._loop_event(),
            fingerprint="",
        )
        assert out["permission"] == "deny"
        assert "escalation" in out["user_message"].lower()

    def test_final_round_allowed(self) -> None:
        state = {
            "active": True,
            "round": 3,
            "max_rounds": 3,
            "max_tokens_est": 1_000_000,
            "max_usd_est": 2.0,
            "pricing_mode": "auto",
            "reviewer_model": "inherit",
            "rounds": [{"n": 3, "focus": "confirm", "fixed": []}],
            "totals": {"tokens_est": 1000, "usd_est": 0.01},
        }
        assert (
            decide_subagent_start(state, self._loop_event(), fingerprint="")[
                "permission"
            ]
            == "allow"
        )

    def test_past_max_rounds_denies(self) -> None:
        state = {
            "active": True,
            "round": 4,
            "max_rounds": 3,
            "rounds": [],
            "totals": {},
        }
        out = decide_subagent_start(state, self._loop_event(), fingerprint="")
        assert out["permission"] == "deny"
        assert "max_rounds" in out["user_message"]

    def test_budget_only_allows_past_default_round_cap(self) -> None:
        state = {
            "active": True,
            "round": 10,
            "max_rounds": None,
            "max_tokens_est": 1_000_000,
            "max_usd_est": 2.0,
            "pricing_mode": "auto",
            "reviewer_model": "inherit",
            "rounds": [{"n": 10, "focus": "confirm", "fixed": []}],
            "totals": {"tokens_est": 50_000, "usd_est": 0.05},
        }
        assert (
            decide_subagent_start(state, self._loop_event(), fingerprint="")[
                "permission"
            ]
            == "allow"
        )

    def test_max_rounds_zero_means_unlimited(self) -> None:
        from _loop_state import resolve_max_rounds

        assert resolve_max_rounds({"max_rounds": 0}) is None
        assert resolve_max_rounds({"max_rounds": "budget-only"}) is None
        assert resolve_max_rounds({"max_rounds": "unlimited"}) is None
        assert resolve_max_rounds({"max_rounds": 3}) == 3
        assert resolve_max_rounds({}) == 3

    def test_cold_over_tiny_cap_denies_before_spend(self) -> None:
        state = {
            "active": True,
            "round": 1,
            "max_rounds": 3,
            "max_tokens_est": 1000,
            "max_usd_est": 0.01,
            "pricing_mode": "auto",
            "reviewer_model": "inherit",
            "rounds": [],
            "totals": {"tokens_est": 0, "usd_est": 0},
        }
        out = decide_subagent_start(
            state, self._loop_event(model="inherit"), fingerprint=""
        )
        assert out["permission"] == "deny"
        assert "Projected spend" in out["user_message"]

    def test_named_model_cold_denies_under_auto_dollar_cap(self) -> None:
        """Opus cold (~$0.75) must not sneak under a $0.50 Auto cap."""
        state = {
            "active": True,
            "round": 1,
            "max_rounds": 3,
            "max_tokens_est": 1_000_000,
            "max_usd_est": 0.50,
            "pricing_mode": "auto",
            "reviewer_model": "claude-opus-5-thinking-high",
            "rounds": [],
            "totals": {"tokens_est": 0, "usd_est": 0},
        }
        out = decide_subagent_start(
            state,
            self._loop_event(model="claude-opus-5-thinking-high"),
            fingerprint="",
        )
        assert out["permission"] == "deny"

    def test_confirm_focus_allowed_on_unchanged_fingerprint(self) -> None:
        state = {
            "active": True,
            "round": 3,
            "max_rounds": 3,
            "max_tokens_est": 1_000_000,
            "max_usd_est": 2.0,
            "pricing_mode": "auto",
            "last_fingerprint": "abc",
            "rounds": [
                {
                    "n": 3,
                    "focus": "confirm",
                    "fixed": ["sig1"],
                }
            ],
            "totals": {"tokens_est": 10_000, "usd_est": 0.05},
        }
        out = decide_subagent_start(state, self._loop_event(), fingerprint="abc")
        assert out["permission"] == "allow"

    def test_unchanged_fingerprint_allows_next_reviewer(self) -> None:
        state = {
            "active": True,
            "round": 2,
            "max_rounds": 3,
            "max_tokens_est": 1_000_000,
            "max_usd_est": 2.0,
            "pricing_mode": "auto",
            "last_fingerprint": "abc",
            "rounds": [
                {
                    "n": 2,
                    "focus": "full",
                    "fixed": ["sig1"],
                }
            ],
            "totals": {"tokens_est": 10_000, "usd_est": 0.05},
        }
        out = decide_subagent_start(state, self._loop_event(), fingerprint="abc")
        assert out["permission"] == "allow"

    def test_unchanged_fingerprint_after_fix_denies_fixer(self) -> None:
        state = {
            "active": True,
            "round": 2,
            "max_rounds": 3,
            "max_tokens_est": 1_000_000,
            "max_usd_est": 2.0,
            "pricing_mode": "auto",
            "last_fingerprint": "abc",
            "rounds": [
                {
                    "n": 2,
                    "focus": "full",
                    "fixed": ["sig1"],
                }
            ],
            "totals": {"tokens_est": 10_000, "usd_est": 0.05},
        }
        out = decide_subagent_start(
            state,
            {"subagent_type": "pr-fixer"},
            fingerprint="abc",
        )
        assert out["permission"] == "deny"
        assert "fingerprint" in out["user_message"].lower()


class TestPreferencesPersist:
    """max_rounds must not reset to 3 across loop starts."""

    def test_null_max_rounds_survives_fresh_start(self, tmp_path: Path) -> None:
        from _loop_state import load_preferences, start_loop_state

        first = start_loop_state(
            pr_number=1,
            pr_url="https://example/pr/1",
            branch="feature/x",
            overrides={"max_rounds": None, "max_usd_est": 2.0},
            root=tmp_path,
        )
        assert first["max_rounds"] is None
        prefs = load_preferences(tmp_path)
        assert prefs["max_rounds"] is None

        second = start_loop_state(
            pr_number=2,
            pr_url="https://example/pr/2",
            branch="feature/y",
            overrides={},
            root=tmp_path,
        )
        assert second["max_rounds"] is None
        assert second["max_usd_est"] == 2.0

    def test_explicit_round_cap_persists(self, tmp_path: Path) -> None:
        from _loop_state import start_loop_state

        start_loop_state(
            pr_number=1,
            pr_url="u",
            branch="b",
            overrides={"max_rounds": 5},
            root=tmp_path,
        )
        again = start_loop_state(
            pr_number=2,
            pr_url="u2",
            branch="b2",
            root=tmp_path,
        )
        assert again["max_rounds"] == 5


class TestClosedFindings:
    """Fixed/accepted signatures must not re-enter open triage."""

    def test_start_state_has_empty_closed_list(self, tmp_path: Path) -> None:
        from _loop_state import start_loop_state

        state = start_loop_state(
            pr_number=1,
            pr_url="u",
            branch="b",
            root=tmp_path,
        )
        assert state["closed_findings"] == []

    def test_filter_drops_closed_keeps_recurrence(self) -> None:
        from _loop_state import append_closed_finding, filter_open_findings

        state: dict = {"closed_findings": [], "accepted_by_design": []}
        append_closed_finding(
            state,
            signature="abc123deadbeef00",
            location="src/a.ts:10",
            finding="missing cleanup",
            status="fixed",
            closed_in_round=1,
        )
        open_rows, dropped = filter_open_findings(
            [
                {
                    "signature": "abc123deadbeef00",
                    "finding": "missing cleanup again",
                },
                {
                    "signature": "abc123deadbeef00",
                    "Source": "recurrence",
                    "finding": "still missing cleanup",
                },
                {
                    "signature": "fff0001112223334",
                    "finding": "different issue",
                },
            ],
            state,
        )
        assert len(dropped) == 1
        assert dropped[0]["signature"] == "abc123deadbeef00"
        assert len(open_rows) == 2
        assert open_rows[0]["Source"] == "recurrence"
        assert open_rows[1]["signature"] == "fff0001112223334"

    def test_append_accepted_mirrors_by_design(self) -> None:
        from _loop_state import append_closed_finding, closed_signatures

        state: dict = {"closed_findings": [], "accepted_by_design": []}
        append_closed_finding(
            state,
            signature="sig1",
            location="a.ts:1",
            finding="intentional",
            status="accepted",
            closed_in_round=2,
            rationale="product rule X",
        )
        # Idempotent
        append_closed_finding(
            state,
            signature="sig1",
            location="a.ts:1",
            finding="intentional",
            status="accepted",
            closed_in_round=2,
            rationale="product rule X",
        )
        assert len(state["closed_findings"]) == 1
        assert len(state["accepted_by_design"]) == 1
        assert "sig1" in closed_signatures(state)


class TestRoundFollowup:
    """Hook must not false-trigger success on empty findings mid-flight."""

    def test_reviewer_stop_does_not_declare_passed_on_empty_findings(self) -> None:
        from review_loop_round import decide_round_followup

        msg = decide_round_followup(
            {
                "escalation_pending": False,
                "round": 3,
                "max_rounds": None,
                "max_tokens_est": 1_000_000,
                "max_usd_est": 2.0,
                "clean_passes_required": 2,
                "consecutive_clean_passes": 0,
                "rounds": [{"n": 3, "findings": []}],
                "totals": {"tokens_est": 10_000, "usd_est": 0.05},
            },
            {"subagent_type": "pr-reviewer"},
        )
        assert "canvas" not in msg or "consecutive" in msg
        assert "single clean" in msg.lower() or "collect the findings" in msg.lower()
        assert "active=false" not in msg

    def test_recorded_consecutive_cleans_allows_canvas(self) -> None:
        from review_loop_round import decide_round_followup

        msg = decide_round_followup(
            {
                "escalation_pending": False,
                "round": 4,
                "max_rounds": None,
                "max_tokens_est": 1_000_000,
                "max_usd_est": 2.0,
                "clean_passes_required": 2,
                "consecutive_clean_passes": 2,
                "rounds": [{"n": 4, "findings": []}],
                "totals": {"tokens_est": 10_000, "usd_est": 0.05},
            },
            {"subagent_type": "pr-reviewer"},
        )
        assert "active=false" in msg
        assert "2/2" in msg

    def test_start_state_includes_clean_gate(self, tmp_path: Path) -> None:
        from _loop_state import start_loop_state

        state = start_loop_state(
            pr_number=1,
            pr_url="u",
            branch="b",
            root=tmp_path,
        )
        assert state["clean_passes_required"] == 2
        assert state["consecutive_clean_passes"] == 0
        assert state["manage_severity"] == "medium"


class TestManageSeverity:
    """Severity floor preference + helpers."""

    def test_default_and_override_persist(self, tmp_path: Path) -> None:
        from _loop_state import load_preferences, start_loop_state

        first = start_loop_state(
            pr_number=1,
            pr_url="u",
            branch="b",
            overrides={"manage_severity": "high"},
            root=tmp_path,
        )
        assert first["manage_severity"] == "high"
        assert load_preferences(tmp_path)["manage_severity"] == "high"

        second = start_loop_state(
            pr_number=2,
            pr_url="u2",
            branch="b2",
            root=tmp_path,
        )
        assert second["manage_severity"] == "high"

    def test_aliases_and_floor_check(self) -> None:
        from _loop_state import normalize_manage_severity, severity_meets_floor

        assert normalize_manage_severity("HIGH") == "high"
        assert normalize_manage_severity("crit") == "critical"
        assert normalize_manage_severity("all") == "low"
        assert normalize_manage_severity("nope") == "medium"

        assert severity_meets_floor("High", "medium") is True
        assert severity_meets_floor("Low", "medium") is False
        assert severity_meets_floor("Medium", "high") is False
        assert severity_meets_floor("Critical", "critical") is True
        assert severity_meets_floor("Weird", "medium") is True
