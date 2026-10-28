"""
Scenarios API – EchoShield
Standardized voice security scenarios for testing and demonstration.
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/demo/scenarios")
async def get_scenarios():
    """Return all available test and simulation scenarios."""
    return {
        "scenarios": [
            {
                "id": "normal",
                "name": "Normal Executive Call",
                "description": "A legitimate business call from a verified executive",
                "expected_risk": 18,
                "expected_level": "LOW",
                "caller": {
                    "name": "Rahul Sharma",
                    "number": "+91 11 2345 6789",
                    "source": "Enterprise VoIP",
                    "title": "CEO – InnovateIndia Corp",
                    "trust": "High",
                    "previous_calls": 12,
                },
                "expected_action": "Continue & Monitor",
                "color": "green",
            },
            {
                "id": "suspicious",
                "name": "Suspicious Voice Call",
                "description": "A call with moderate risk indicators requiring secondary verification",
                "expected_risk": 61,
                "expected_level": "MEDIUM",
                "caller": {
                    "name": "Unknown – Priya Menon",
                    "number": "+91 98765 43210",
                    "source": "Mobile Network",
                    "title": "Finance Manager",
                    "trust": "Medium",
                    "previous_calls": 3,
                },
                "expected_action": "Warning + Secondary Verification",
                "color": "yellow",
            },
            {
                "id": "high_risk",
                "name": "AI Voice Fraud Attempt",
                "description": "Detected synthetic voice impersonation – unauthorized transfer attempt",
                "expected_risk": 91,
                "expected_level": "HIGH",
                "caller": {
                    "name": "Rahul Sharma (CEO) – SUSPECTED CLONE",
                    "number": "+91 11 2345 6789",
                    "source": "Enterprise VoIP",
                    "title": "Impersonating: CEO",
                    "trust": "Very Low",
                    "previous_calls": 0,
                },
                "expected_action": "MFA + Callback + Transaction Hold + Escalation",
                "color": "red",
            },
        ]
    }
