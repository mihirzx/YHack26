"""
FastAPI wrapper for the CareSight logic engine.

Endpoints:
    POST /process       — Send vision data, get back event (or null)
    POST /set_expected  — Caregiver sets expected medication color
    GET  /status        — Current engine state for dashboard
    GET  /health        — Health check
"""

import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from caresight.logic.rules import RulesEngine

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="CareSight Logic Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

default_color = os.getenv("DEFAULT_EXPECTED_COLOR", "red")
engine = RulesEngine(expected_color=default_color)
logger.info("Engine initialized with expected_color=%s", default_color)


# --- Request/Response models ---

class VisionData(BaseModel):
    person_detected: bool
    hand_detected: bool
    detected_color: str | None = None
    timestamp: float | None = None

class SetExpectedRequest(BaseModel):
    color: str


# --- Endpoints ---

@app.post("/process")
def process_vision(data: VisionData):
    """Process a frame of vision data. Returns event or null."""
    event = engine.process(data.model_dump())
    return {"event": event}


@app.post("/set_expected")
def set_expected(req: SetExpectedRequest):
    """Caregiver updates the expected medication color."""
    color = req.color.strip().lower()
    if not color:
        raise HTTPException(status_code=400, detail="Color cannot be empty")
    engine.set_expected_color(color)
    return {"expected_color": color}


@app.get("/status")
def get_status():
    """Current engine state for the dashboard."""
    return engine.get_status()


@app.get("/health")
def health():
    """Health check for Railway."""
    return {"status": "ok"}
