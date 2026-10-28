"""
EchoShield Backend - Main FastAPI Application
Real-Time Voice Impersonation Defense Platform
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database.init_db import init_db
from app.api import health, analyze, calls, alerts, analytics, audit, actions, settings, demo


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="EchoShield API",
    description="EchoShield – AI-Powered Real-Time Voice Cloning Detection & Risk Platform",
    version="1.0.0",
    lifespan=lifespan,
)

cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(calls.router, prefix="/api", tags=["Calls"])
app.include_router(alerts.router, prefix="/api", tags=["Alerts"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])
app.include_router(audit.router, prefix="/api", tags=["Audit"])
app.include_router(actions.router, prefix="/api", tags=["Actions"])
app.include_router(settings.router, prefix="/api", tags=["Settings"])
app.include_router(demo.router, prefix="/api", tags=["Scenarios"])


@app.get("/")
async def root():
    return {
        "system": "EchoShield",
        "product": "EchoShield Voice Security",
        "version": "1.0.0",
        "status": "online",
        "capabilities": [
            "Anti-Spoofing Detection",
            "Speaker Biometric Verification",
            "Prosody Deviation Analysis",
            "Context Intelligence",
            "Dynamic Risk Fusion Engine",
            "SHA-256 Tamper-Evident Audit Ledger",
        ],
    }
