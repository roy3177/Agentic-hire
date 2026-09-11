"""
Tests for app/schemas.py only.

Deliberately does NOT import app.main / app.tasks / app.agents: importing
agents.py triggers module-level calls to Langfuse (get_prompt_content, Strict
Mode -- see the observability-langfuse skill) that require real
GOOGLE_API_KEY / LANGFUSE_* credentials and network access. Keeping this file
scoped to schemas.py lets CI run it with no secrets and no external services.
"""
import pytest
from pydantic import ValidationError

from app.schemas import CandidateEvaluation, TriageVerdict


def test_candidate_evaluation_accepts_valid_payload():
    evaluation = CandidateEvaluation(
        candidate_name="Jane Doe",
        score=85,
        key_strengths=["Strong Python background", "Led a team of 4"],
        concerns=["No direct Kubernetes experience"],
        reasoning="Strong overall fit for the role.",
        final_recommendation="Hire",
    )
    assert evaluation.score == 85
    assert evaluation.final_recommendation == "Hire"
    # Default -- the model must explicitly set this true, it never defaults on
    assert evaluation.injection_detected is False


@pytest.mark.parametrize("missing_field", ["candidate_name", "score", "final_recommendation"])
def test_candidate_evaluation_rejects_missing_required_field(missing_field):
    payload = {
        "candidate_name": "Jane Doe",
        "score": 85,
        "key_strengths": ["Strong Python background"],
        "concerns": [],
        "reasoning": "Strong overall fit.",
        "final_recommendation": "Hire",
    }
    del payload[missing_field]

    with pytest.raises(ValidationError):
        CandidateEvaluation(**payload)


def test_triage_verdict_relevant_candidate():
    verdict = TriageVerdict(
        candidate_name="John Smith",
        is_relevant=True,
        reason="Background matches the role's core requirements.",
    )
    assert verdict.is_relevant is True
    assert verdict.injection_detected is False


def test_candidate_evaluation_injection_detected_flag_is_settable():
    evaluation = CandidateEvaluation(
        candidate_name="John Smith",
        score=0,
        key_strengths=[],
        concerns=["Attempted to override scoring instructions."],
        reasoning="Screened out.",
        final_recommendation="Reject",
        injection_detected=True,
    )
    assert evaluation.injection_detected is True


def test_triage_verdict_rejects_non_bool_is_relevant():
    with pytest.raises(ValidationError):
        TriageVerdict(
            candidate_name="John Smith",
            is_relevant="not-a-bool",
            reason="...",
        )
