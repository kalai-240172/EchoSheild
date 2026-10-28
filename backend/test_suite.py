"""
EchoShield Live Integration Test Suite
Executes end-to-end integration tests against the live EchoShield backend server (http://127.0.0.1:8000).
"""
import sys
import io
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"


def req(path: str, method: str = "GET", data: dict = None, files: dict = None):
    url = f"{BASE_URL}{path}"
    headers = {}
    body = None

    if files:
        boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        buf = io.BytesIO()
        for field_name, (filename, content, content_type) in files.items():
            buf.write(f"--{boundary}\r\n".encode())
            buf.write(f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode())
            buf.write(f"Content-Type: {content_type}\r\n\r\n".encode())
            buf.write(content if isinstance(content, bytes) else content.encode())
            buf.write(b"\r\n")
        buf.write(f"--{boundary}--\r\n".encode())
        body = buf.getvalue()
    elif data is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(data).encode("utf-8")

    r = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=10) as response:
            resp_body = response.read().decode("utf-8")
            return response.status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"detail": err_body}


def main():
    print("==========================================")
    print("RUNNING ECHOSHIELD INTEGRATION TEST SUITE")
    print("==========================================")

    # 1. Health Check
    status, data = req("/api/health")
    assert status == 200, f"Health check failed: {status}"
    assert data["status"] == "online"
    assert data["system"] == "EchoShield"
    print("[PASS] Health Check Endpoint (/api/health) - Status: Online")

    # 2. Settings Retrieval
    status, settings = req("/api/settings")
    assert status == 200, f"Get settings failed: {status}"
    assert "weight_anti_spoofing" in settings
    total_w = (
        settings["weight_anti_spoofing"]
        + settings["weight_speaker_verification"]
        + settings["weight_prosody"]
        + settings["weight_context"]
    )
    assert abs(total_w - 100.0) <= 2.0, f"Weights do not sum to 100: {total_w}"
    print(f"[PASS] Settings Retrieval (/api/settings) - Configured weights sum: {round(total_w)}%")

    # 3. Settings Update & Persistence
    update_payload = dict(settings)
    update_payload["weight_anti_spoofing"] = 40.0
    update_payload["weight_speaker_verification"] = 25.0
    update_payload["weight_prosody"] = 10.0
    update_payload["weight_context"] = 25.0
    status, res = req("/api/settings", method="PUT", data=update_payload)
    assert status == 200, f"Update settings failed: {res}"

    status, re_get = req("/api/settings")
    assert re_get["weight_anti_spoofing"] == 40.0
    print("[PASS] Settings Update & Persistence (/api/settings) - Verified persistence")

    # Restore default settings
    update_payload["weight_anti_spoofing"] = 35.0
    update_payload["weight_speaker_verification"] = 25.0
    update_payload["weight_prosody"] = 15.0
    update_payload["weight_context"] = 25.0
    req("/api/settings", method="PUT", data=update_payload)

    # 4. Settings Validation (invalid weights)
    bad_payload = dict(settings)
    bad_payload["weight_anti_spoofing"] = 80.0
    status, bad_res = req("/api/settings", method="PUT", data=bad_payload)
    assert status == 400, "Should have rejected weights not summing to 100"
    print("[PASS] Settings Validation - Correctly rejected invalid weight distribution")

    # 5. Scenarios Retrieval
    status, sc_data = req("/api/demo/scenarios")
    assert status == 200
    assert len(sc_data["scenarios"]) == 3
    print(f"[PASS] Security Scenarios Endpoint (/api/demo/scenarios) - {len(sc_data['scenarios'])} scenarios available")

    # 6. Normal Scenario Analysis
    status, norm_res = req("/api/demo/analyze", method="POST", data={
        "scenario": "normal",
        "caller_name": "Verified Executive",
        "caller_number": "+91 80 1234 5678",
        "call_source": "PSTN"
    })
    assert status == 200
    assert norm_res["risk_level"] == "LOW"
    assert norm_res["risk_score"] <= 39
    print(f"[PASS] Normal Call Scenario - Risk Score: {norm_res['risk_score']} ({norm_res['risk_level']})")

    # 7. High-Risk Scenario Analysis
    status, high_res = req("/api/demo/analyze", method="POST", data={
        "scenario": "high_risk",
        "caller_name": "Suspected Clone",
        "caller_number": "+91 11 9999 8888",
        "call_source": "Enterprise VoIP"
    })
    assert status == 200
    assert high_res["risk_level"] == "HIGH"
    assert high_res["risk_score"] >= 70
    assert "audit_block_number" in high_res
    print(f"[PASS] High-Risk Fraud Scenario - Risk Score: {high_res['risk_score']} ({high_res['risk_level']})")

    # 8. Calls Retrieval
    status, calls = req("/api/calls")
    assert status == 200
    assert len(calls) >= 2
    call_id = calls[0]["id"]
    status, single_call = req(f"/api/calls/{call_id}")
    assert status == 200
    assert single_call["id"] == call_id
    print(f"[PASS] Calls Database Storage & Retrieval (/api/calls) - {len(calls)} calls in ledger")

    # 9. Audio Upload Analysis
    wav_bytes = b"RIFF" + b"\x00" * 36 + b"WAVEfmt " + b"\x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data" + b"\x00" * 50000
    status, upload_res = req("/api/analyze-audio", method="POST", files={
        "file": ("test_voice_sample.wav", wav_bytes, "audio/wav")
    })
    assert status == 200, f"Upload failed: {upload_res}"
    assert "anti_spoofing" in upload_res
    assert "speaker_verification" in upload_res
    assert "prosody_analysis" in upload_res
    assert "context_intelligence" in upload_res
    assert "risk_fusion" in upload_res
    print(f"[PASS] Audio Upload & Multi-Factor Analysis (/api/analyze-audio) - Score: {upload_res['risk_score']}")

    # 10. Alerts Management
    status, alerts = req("/api/alerts")
    assert status == 200
    assert len(alerts) > 0
    first_alert = alerts[0]

    status, read_res = req(f"/api/alerts/{first_alert['id']}/read", method="PATCH")
    assert status == 200 and read_res["success"] is True

    status, res_res = req(f"/api/alerts/{first_alert['id']}/resolve", method="PATCH")
    assert status == 200 and res_res["success"] is True

    status, all_read = req("/api/alerts/mark-all-read", method="POST")
    assert status == 200 and all_read["success"] is True
    print(f"[PASS] Alerts Operations (/api/alerts: read, resolve, mark-all) - {len(alerts)} alerts tracked")

    # 11. Security Defensive Actions
    action_payload = {"caller_number": "+91 11 9999 8888", "risk_score": 91.0}
    status, mfa = req("/api/actions/mfa", method="POST", data=action_payload)
    assert status == 200 and mfa["success"] is True

    status, cb = req("/api/actions/callback", method="POST", data=action_payload)
    assert status == 200 and cb["success"] is True

    status, hold = req("/api/actions/hold-transaction", method="POST", data=action_payload)
    assert status == 200 and hold["success"] is True

    status, esc = req("/api/actions/escalate", method="POST", data=action_payload)
    assert status == 200 and esc["success"] is True
    print("[PASS] Security Defense Actions (MFA, Callback, Transaction Hold, Escalation)")

    # 12. Audit Ledger & SHA-256 Chain Verification
    status, blocks = req("/api/audit")
    assert status == 200
    assert len(blocks) > 0

    status, verify_data = req("/api/audit/verify", method="POST")
    assert status == 200
    assert verify_data["valid"] is True, f"Integrity check failed: {verify_data['issues']}"
    assert verify_data["verified"] is True
    print(f"[PASS] Tamper-Evident Audit Ledger - Verified {verify_data['blocks_checked']} blocks in SHA-256 chain")

    # 13. Analytics Consistency
    status, analytics = req("/api/analytics?period=7")
    assert status == 200
    status, latest_calls = req("/api/calls")
    assert analytics["summary"]["total_calls"] == len(latest_calls), (
        f"Analytics calls ({analytics['summary']['total_calls']}) does not match Call History ({len(latest_calls)})"
    )
    print(f"[PASS] Analytics Consistency - Total calls ({analytics['summary']['total_calls']}) matches Call History database exactly")

    print("==========================================")
    print("ALL 13 TESTS PASSED SUCCESSFULLY!")
    print("==========================================")


if __name__ == "__main__":
    main()
