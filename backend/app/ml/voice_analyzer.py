"""
Voice Analyzer – Main Interface
EchoShield Voice Intelligence Platform

This is the primary interface for voice analysis.
Processes incoming call audio and simulates signal extraction (anti-spoofing, speaker verification,
prosodic analysis, and context intelligence) combined via the Risk Fusion Engine.
The modular architecture allows plugging in deep learning models (e.g., RawGAT-ST, ECAPA-TDNN).
"""
from dataclasses import dataclass
from app.ml import anti_spoofing, speaker_verification, prosody_analysis, risk_engine


@dataclass
class VoiceAnalysisResult:
    # Individual signal results
    spoof_probability: float
    authenticity_score: float
    spoof_confidence: float
    spoof_artifacts: list[str]
    spoof_explanation: str
    
    speaker_match_score: float
    expected_speaker: str
    speaker_result_label: str
    speaker_confidence: float
    speaker_explanation: str
    
    prosody_risk_score: float
    pitch_variation: float
    speaking_rate: float
    energy_variation: float
    prosody_anomalies: list[str]
    prosody_explanation: str
    pitch_data: list[dict]
    energy_data: list[dict]
    
    context_score: float
    context_indicators: list[str]
    
    # Fusion result
    final_risk_score: float
    risk_level: str
    spoof_contribution: float
    speaker_contribution: float
    prosody_contribution: float
    context_contribution: float
    recommended_actions: list[str]
    
    # Scenario for reference
    scenario: str


CONTEXT_SCORES = {
    "normal": 12.0,
    "suspicious": 68.0,
    "high_risk": 95.0,
}

CONTEXT_INDICATORS = {
    "normal": [],
    "suspicious": ["Slightly elevated transaction", "First call this week"],
    "high_risk": ["New device", "Unusual transaction amount (₹20,00,000)", "Urgency detected", "First-time beneficiary", "Request bypasses normal approval"],
}


def analyze_voice(
    scenario: str = "normal",
    weights: dict | None = None,
    low_threshold: int = 39,
    medium_threshold: int = 69,
) -> VoiceAnalysisResult:
    """
    Main voice analysis interface.
    
    Args:
        scenario: 'normal', 'suspicious', or 'high_risk'
        weights: Optional dict of detection weights
        low_threshold: Configured low risk threshold
        medium_threshold: Configured medium risk threshold
    
    Returns:
        VoiceAnalysisResult with all signal scores and fusion result
    """
    as_result = anti_spoofing.analyze(scenario)
    sv_result = speaker_verification.analyze(scenario)
    pr_result = prosody_analysis.analyze(scenario)
    
    context_score = CONTEXT_SCORES.get(scenario, 12.0)
    context_indicators = CONTEXT_INDICATORS.get(scenario, [])
    
    # Speaker risk = inverse of match score
    speaker_risk = 100.0 - sv_result.match_score
    
    fusion = risk_engine.compute_risk(
        spoof_score=as_result.spoof_probability,
        speaker_risk=speaker_risk,
        prosody_score=pr_result.prosody_risk_score,
        context_score=context_score,
        weights=weights,
        low_threshold=low_threshold,
        medium_threshold=medium_threshold,
    )
    
    return VoiceAnalysisResult(
        spoof_probability=as_result.spoof_probability,
        authenticity_score=as_result.authenticity_score,
        spoof_confidence=as_result.confidence,
        spoof_artifacts=as_result.artifacts_detected,
        spoof_explanation=as_result.explanation,
        
        speaker_match_score=sv_result.match_score,
        expected_speaker=sv_result.expected_speaker,
        speaker_result_label=sv_result.result_label,
        speaker_confidence=sv_result.confidence,
        speaker_explanation=sv_result.explanation,
        
        prosody_risk_score=pr_result.prosody_risk_score,
        pitch_variation=pr_result.pitch_variation,
        speaking_rate=pr_result.speaking_rate,
        energy_variation=pr_result.energy_variation,
        prosody_anomalies=pr_result.anomalies,
        prosody_explanation=pr_result.explanation,
        pitch_data=pr_result.pitch_data,
        energy_data=pr_result.energy_data,
        
        context_score=context_score,
        context_indicators=context_indicators,
        
        final_risk_score=fusion.final_score,
        risk_level=fusion.risk_level,
        spoof_contribution=fusion.spoof_contribution,
        speaker_contribution=fusion.speaker_contribution,
        prosody_contribution=fusion.prosody_contribution,
        context_contribution=fusion.context_contribution,
        recommended_actions=fusion.recommended_action,
        
        scenario=scenario,
    )
