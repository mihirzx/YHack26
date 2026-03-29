"""
CareSight — Master Orchestrator
================================
Single command:  python main.py [expected_color]

  python main.py          # defaults to red
  python main.py green    # expect green medication

Starts:
  1. FastAPI backend on :8000  (Gemini + ElevenLabs + MongoDB)
  2. Viam camera loop          (color detection)
  3. RulesEngine               (logic + event generation)

Everything talks over localhost — one process, zero config.
"""

import asyncio
import logging
import os
import sys
import time

import httpx
from dotenv import load_dotenv

load_dotenv()

# ── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("caresight")

# Keep noisy libs quiet
for name in ("httpx", "uvicorn.access", "uvicorn.error", "motor", "viam"):
    logging.getLogger(name).setLevel(logging.WARNING)

# ── Config ───────────────────────────────────────────────────────────────────

VIAM_API_KEY = os.getenv("VIAM_API_KEY")
VIAM_API_KEY_ID = os.getenv("VIAM_API_KEY_ID")
VIAM_ADDRESS = os.getenv("VIAM_ADDRESS", "caresight-main.r756pbub7x.viam.cloud")
BACKEND_URL = "http://localhost:8000"
DEFAULT_COLOR = os.getenv("DEFAULT_EXPECTED_COLOR", "red")

BANNER = r"""
  ╔═══════════════════════════════════════════════╗
  ║   CareSight — AI-Powered Virtual Caregiver    ║
  ║              YHack 2026 Demo                  ║
  ╚═══════════════════════════════════════════════╝
"""


# ── Backend ──────────────────────────────────────────────────────────────────

async def start_backend():
    """Boot FastAPI + event consumer on port 8000."""
    import uvicorn

    config = uvicorn.Config(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        log_level="warning",
    )
    server = uvicorn.Server(config)
    await server.serve()


# ── Camera + Logic Loop ─────────────────────────────────────────────────────

async def camera_loop(expected_color: str):
    """
    Connect to Viam, poll color detections every second,
    feed results through RulesEngine, POST events to backend.
    """
    from viam.robot.client import RobotClient
    from viam.services.vision import VisionClient

    from logic.rules import RulesEngine

    engine = RulesEngine(expected_color=expected_color)

    log.info("  [camera]  Connecting to Viam at %s ...", VIAM_ADDRESS)

    opts = RobotClient.Options.with_api_key(
        api_key=VIAM_API_KEY,
        api_key_id=VIAM_API_KEY_ID,
    )
    machine = await RobotClient.at_address(VIAM_ADDRESS, opts)
    log.info("  [camera]  Viam connected")

    # One vision service per color model configured in Viam
    color_services: dict[str, VisionClient] = {
        "red": VisionClient.from_robot(machine, "color-detection-model-red"),
        "green": VisionClient.from_robot(machine, "color-detection-model-green"),
        "yellow": VisionClient.from_robot(machine, "color-detection-model-yellow"),
    }
    log.info("  [camera]  Vision services loaded: %s", ", ".join(color_services))
    log.info("")
    log.info("  ━━━ LIVE ━━━  Watching for medication interactions ...")
    log.info("")

    http = httpx.AsyncClient(base_url=BACKEND_URL, timeout=10.0)

    try:
        while True:
            await asyncio.sleep(1)

            # ── Detect best color ────────────────────────────────────────
            detected_color = None
            best_confidence = 0.0

            for color_name, service in color_services.items():
                try:
                    detections = await service.get_detections_from_camera(
                        camera_name="camera",
                    )
                    for det in detections:
                        conf = getattr(det, "confidence", 0.0)
                        if conf > best_confidence:
                            best_confidence = conf
                            detected_color = color_name
                except Exception as exc:
                    log.debug("  [camera]  %s detection error: %s", color_name, exc)

            # ── Build vision data for RulesEngine ────────────────────────
            hand_detected = detected_color is not None
            vision_data = {
                "person_detected": hand_detected,
                "hand_detected": hand_detected,
                "detected_color": detected_color,
                "timestamp": time.time(),
            }

            if hand_detected:
                log.info(
                    "  [camera]  Detected: %s  (confidence %.0f%%)",
                    detected_color.upper(),
                    best_confidence * 100,
                )

            # ── Run logic engine ─────────────────────────────────────────
            event = engine.process(vision_data)
            if event is None:
                continue

            etype = event["type"]
            if etype == "wrong_med_attempt":
                log.info(
                    "  [logic]   WRONG medication  (expected: %s, observed: %s)",
                    event["expected"],
                    event["observed"],
                )
            elif etype == "corrected":
                log.info("  [logic]   Patient CORRECTED — took the right one")
            elif etype == "escalated":
                log.info("  [logic]   ESCALATED — patient did not correct!")

            # ── POST event to backend (Gemini + ElevenLabs fire) ─────────
            try:
                resp = await http.post("/events", json=event)
                if resp.status_code == 202:
                    log.info("  [backend] Event queued -> Gemini + ElevenLabs speaking")
                else:
                    log.warning("  [backend] Unexpected status: %s", resp.status_code)
            except httpx.ConnectError:
                log.warning("  [backend] Connection refused — is the backend up?")
            except Exception as exc:
                log.error("  [backend] Error posting event: %s", exc)

            log.info("")

    except asyncio.CancelledError:
        pass
    finally:
        await http.aclose()
        await machine.close()
        log.info("  [camera]  Viam disconnected")


# ── Orchestrator ─────────────────────────────────────────────────────────────

async def run():
    expected_color = sys.argv[1].lower().strip() if len(sys.argv) > 1 else DEFAULT_COLOR

    print(BANNER)
    log.info("  Starting CareSight ...")
    log.info("  Expected medication : %s", expected_color.upper())
    log.info("  Backend             : %s", BACKEND_URL)
    log.info("  Viam robot          : %s", VIAM_ADDRESS)
    log.info("")

    # 1. Boot backend in background
    backend_task = asyncio.create_task(start_backend())

    # 2. Wait for backend to be ready
    log.info("  [backend] Starting FastAPI server ...")
    ready = False
    for _ in range(20):
        await asyncio.sleep(0.5)
        try:
            async with httpx.AsyncClient() as c:
                r = await c.get(f"{BACKEND_URL}/health", timeout=2.0)
                if r.status_code == 200:
                    ready = True
                    break
        except Exception:
            pass

    if ready:
        log.info("  [backend] FastAPI ready on port 8000")
    else:
        log.error("  [backend] Failed to start — check MongoDB connection")
        return

    # 3. Set expected medication via API
    try:
        async with httpx.AsyncClient() as c:
            await c.post(
                f"{BACKEND_URL}/settings/medication",
                json={"expected_color": expected_color},
                timeout=5.0,
            )
        log.info("  [backend] Expected medication set: %s", expected_color.upper())
    except Exception as exc:
        log.warning("  [backend] Could not set medication config: %s", exc)

    log.info("")

    # 4. Start camera loop
    camera_task = asyncio.create_task(camera_loop(expected_color))

    # Run until Ctrl-C
    try:
        await asyncio.gather(backend_task, camera_task)
    except asyncio.CancelledError:
        pass


def main():
    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        print("\n  CareSight stopped. Goodbye.\n")


if __name__ == "__main__":
    main()
