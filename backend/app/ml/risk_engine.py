"""
Risk Fusion Engine – EchoShield
Combines independent voice analysis signals into a single actionable risk score.
Weights and thresholds are dynamically configurable in system settings.
"""
from dataclasses import dataclass


@dataclass
class RiskFusionResult:
    final_score: float
    risk_level: str  # LOW, MEDIUM, HIGH
    spoof_contribution: float
    speaker_contribution: float
    prosody_contribution: float
    context_contribution: float
    recommended_action: list[str]
    explanation: str


DEFAULT_WEIGHTS = {
    "anti_spoofing": 0.35,
    "speaker_verification": 0.25,
    "prosody": 0.15,
    "context": 0.25,
}

SCENARIO_CONTEXT_SCORES = {
    "normal": 12.0,
    "suspicious": 68.0,
    "high_risk": 95.0,
}


def compute_risk(
    spoof_score: float,
    speaker_risk: float,   # 100 - match_score
    prosody_score: float,
    context_score: float,
    weights: dict | None = None,
    low_threshold: int = 39,
    medium_threshold: int = 69,
) -> RiskFusionResult:
    """
    Fuse individual signal scores into a final risk score.
    
    Formula:
        risk = w1 * spoof + w2 * speaker_risk + w3 * prosody + w4 * context
    
    All scores are on 0-100 scale where higher = more risky.
    Weights are automatically normalized so their sum equals 1.0.
    """
    raw_w = weights or DEFAULT_WEIGHTS
    
    # Handle both decimal (0.35) and percentage (35) forms
    w_spoof = raw_w.get("anti_spoofing", 0.35)
    w_speaker = raw_w.get("speaker_verification", 0.25)
    w_prosody = raw_w.get("prosody", 0.15)
    w_context = raw_w.get("context", 0.25)
    
    total_w = w_spoof + w_speaker + w_prosody + w_context
    if total_w > 0:
        norm_spoof = w_spoof / total_w
        norm_speaker = w_speaker / total_w
        norm_prosody = w_prosody / total_w
        norm_context = w_context / total_w
    else:
        norm_spoof, norm_speaker, norm_prosody, norm_context = 0.35, 0.25, 0.15, 0.25

    spoof_contrib = norm_spoof * spoof_score
    speaker_contrib = norm_speaker * speaker_risk
    prosody_contrib = norm_prosody * prosody_score
    context_contrib = norm_context * context_score

    final = spoof_contrib + speaker_contrib + prosody_contrib + context_contrib
    final = max(0.0, min(100.0, final))

    if final <= low_threshold:
        risk_level = "LOW"
        actions = ["Continue Call", "Monitor"]
    elif final <= medium_threshold:
        risk_level = "MEDIUM"
        actions = ["Show Warning", "Request Secondary Verification"]
    else:
        risk_level = "HIGH"
        actions = ["Trigger MFA", "Initiate Callback Verification", "Hold Sensitive Transaction", "Escalate to Security"]

    dominant_contrib = max(spoof_contrib, speaker_contrib, prosody_contrib, context_contrib)
    if dominant_contrib == spoof_contrib:
        dominant_label = "Anti-Spoofing (Synthetic Voice)"
    elif dominant_contrib == context_contrib:
        dominant_label = "Context Intelligence (Anomaly)"
    elif dominant_contrib == speaker_contrib:
        dominant_label = "Speaker Mismatch"
    else:
        dominant_label = "Prosodic Deviation"

    explanation = f"Risk fused from 4 independent signals. Dominant risk factor: {dominant_label}."

    return RiskFusionResult(
        final_score=round(final, 1),
        risk_level=risk_level,
        spoof_contribution=round(spoof_contrib, 2),
        speaker_contribution=round(speaker_contrib, 2),
        prosody_contribution=round(prosody_contrib, 2),
        context_contribution=round(context_contrib, 2),
        recommended_action=actions,
        explanation=explanation,
    )
