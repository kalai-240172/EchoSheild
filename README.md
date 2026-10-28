# EchoShield
### AI-Powered Real-Time Voice Impersonation Detection & Prevention Platform

---

## 🎯 Project Overview

**EchoShield** is an enterprise-grade voice security and monitoring platform designed to detect AI-generated voice cloning and synthetic audio impersonation attacks in real time before unauthorized transactions or security breaches occur.

| Attribute | Details |
|---|---|
| **Product** | EchoShield |
| **System Category** | Voice Biometrics & Cybersecurity Risk Monitoring |
| **Architecture** | Decoupled Client-Server (React Frontend + FastAPI Backend) |
| **Database** | SQLite with SQLAlchemy Async ORM |
| **Audit Ledger** | SHA-256 Cryptographic Hash Chain |

**Tagline:** *"Detect the impersonation before the voice becomes an unauthorized action."*

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│                   FRONTEND                             │
│  React 19 + TypeScript + Vite + Tailwind CSS           │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────────────┐ │
│  │Dashboard │ │Live Call │ │Voice Analysis           │ │
│  │Analytics │ │Audit Ledg│ │Risk Engine              │ │
│  └──────────┘ └──────────┘ └─────────────────────────┘ │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP/REST (Vite proxy /api)
┌──────────────────────────▼─────────────────────────────┐
│                   BACKEND                              │
│  Python FastAPI + SQLite (aiosqlite)                   │
│  ┌─────────────┐ ┌────────────┐ ┌────────────────────┐ │
│  │ Anti-Spoof  │ │Speaker Ver.│ │Prosody Analysis    │ │
│  └──────┬──────┘ └─────┬──────┘ └──────────┬─────────┘ │
│         └──────────────▼───────────────────┘           │
│              ┌──────────────────────┐                  │
│              │ Dynamic Risk Fusion  │                  │
│              └──────────────────────┘                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Cryptographic Audit Ledger (SHA-256 Chain)     │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## ⚡ Features

### Core Detection Engine
- **Anti-Spoofing Analysis**: Evaluates acoustic artifacts, synthetic phase irregularities, and spectral smoothness.
- **Speaker Biometric Verification**: Compares caller biometric embeddings against enrolled speaker profiles.
- **Prosody Deviation Analysis**: Detects unnatural pitch monotony, cadence anomalies, and absence of breathing pauses.
- **Context Intelligence**: Cross-references transaction amounts, caller history, device signatures, and urgency indicators.
- **Dynamic Risk Fusion Engine**: Calibrated weighted synthesis across all four signal streams with configurable thresholds.

### Risk Action Tiers
- **LOW (0–39)**: Legitimate call. Auto-monitored.
- **MEDIUM (40–69)**: Elevated suspicion. Triggers warning banner and prompts secondary out-of-band verification.
- **HIGH (70–100)**: Critical impersonation probability. Enables instant Transaction Hold, MFA challenge, callback verification, and SOC escalation.

### Cryptographic Security & Audit
- **SHA-256 Hash-Chained Audit Ledger**: Every analysis event and defensive action is chained to the preceding block.
- **On-Demand Integrity Verification**: Cryptographic validation checks continuity and re-hashes all historical blocks.
- **Privacy by Design**: In-memory audio processing with configurable retention policies and zero unencrypted voice storage.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 |
| **Data Visualization** | Recharts, Custom Animated Canvas Waveforms |
| **Icons** | Lucide React |
| **HTTP Client** | Axios |
| **Routing** | React Router DOM v7 |
| **Backend API** | Python 3.12+, FastAPI, Uvicorn |
| **ORM & Database** | SQLAlchemy (Async), SQLite (`aiosqlite`) |
| **Audio Processing** | Web Audio API (browser) / Multipart Upload Processing |

---

## 🚀 Setup & Run (Windows PowerShell)

### Prerequisites
- Node.js 18+
- Python 3.10+
- npm and pip

### 1. Backend Setup

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- **Backend API**: `http://127.0.0.1:8000`
- **Interactive API Documentation (Swagger)**: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup

In a separate terminal:

```powershell
cd frontend
npm install
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- *Note:* The Vite dev server proxies all `/api/*` calls to `http://127.0.0.1:8000`.

### 3. Database Initialization

The SQLite database (`backend/echoshield.db`) auto-initializes on startup with:
- Configurable detection settings
- Baseline call history records
- Active security alerts
- Initialized SHA-256 cryptographic audit ledger

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health and service status |
| `POST` | `/api/demo/analyze` | Run simulation scenario analysis |
| `POST` | `/api/analyze-audio` | Upload and analyze an audio file (WAV, MP3, M4A, OGG) |
| `GET` | `/api/calls` | Retrieve recent call history records |
| `GET` | `/api/calls/{id}` | Retrieve individual call details |
| `GET` | `/api/alerts` | List real-time security alerts |
| `PATCH` | `/api/alerts/{id}/read` | Mark an alert as read |
| `PATCH` | `/api/alerts/{id}/resolve` | Resolve an active alert |
| `POST` | `/api/alerts/mark-all-read` | Mark all unread alerts as read |
| `GET` | `/api/analytics` | Retrieve unified telemetry and detection trends |
| `GET` | `/api/audit` | List cryptographically chained audit blocks |
| `POST` | `/api/audit/verify` | Verify cryptographic SHA-256 chain integrity |
| `POST` | `/api/actions/mfa` | Trigger MFA challenge |
| `POST` | `/api/actions/callback` | Initiate out-of-band callback verification |
| `POST` | `/api/actions/hold-transaction` | Activate emergency transaction hold |
| `POST` | `/api/actions/escalate` | Escalate incident to security operations |
| `GET` | `/api/settings` | Get current detection thresholds and weights |
| `PUT` | `/api/settings` | Update and persist system settings |

---

## 🧪 Running Automated Tests

Run the backend integration test suite:

```powershell
cd backend
python test_suite.py
```

Run frontend type checks and production build verification:

```powershell
cd frontend
npm run build
```

---

## 🔒 Security & Privacy

- **Data Encryption**: Biometric profiles and configuration records are protected at rest.
- **Tamper Evidence**: All security evaluations generate irreversible cryptographic SHA-256 hash chains.
- **Minimal Audio Retention**: Audio streams are evaluated in memory and discarded according to the configured retention policy.

---

*"Detect the impersonation before the voice becomes an unauthorized action."*
