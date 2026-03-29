"""
Connects to the Viam robot and polls the color detection vision services live.
Runs detections through the RulesEngine and posts medication events to the backend.

Run on the same machine as the Viam server OR any machine (Viam is cloud-connected).
"""

import asyncio
import os
import time
import httpx
from datetime import datetime, timezone
from dotenv import load_dotenv

from viam.robot.client import RobotClient
from viam.services.vision import VisionClient

from logic.rules import RulesEngine

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
VIAM_API_KEY = os.getenv("VIAM_API_KEY")
VIAM_API_KEY_ID = os.getenv("VIAM_API_KEY_ID")
VIAM_ADDRESS = os.getenv("VIAM_ADDRESS", "caresight-main.r756pbub7x.viam.cloud")
CAMERA_NAME = os.getenv("VIAM_CAMERA_NAME", "camera")
POLL_INTERVAL = float(os.getenv("VIAM_POLL_INTERVAL", "1.0"))  # seconds

VISION_SERVICES = ["color-detection-model-red", "color-detection-model-green", "color-detection-model-yellow"]


def _get_expected_color() -> str:
    try:
        url = f"{BACKEND_URL.rstrip('/')}/settings/medication"
        resp = httpx.get(url, timeout=3)
        return resp.json().get("expected_color", "red")
    except Exception:
        return os.getenv("DEFAULT_EXPECTED_COLOR", "red")


def _post_event(event: dict):
    try:
        url = f"{BACKEND_URL.rstrip('/')}/events"
        resp = httpx.post(url, json=event, timeout=5)
        print(f"[viam_client] {event['type']} posted → {resp.status_code}")
    except Exception as e:
        print(f"[viam_client] failed to post: {e}")


async def run():
    expected_color = _get_expected_color()
    engine = RulesEngine(expected_color=expected_color)
    last_color_refresh = time.time()

    print(f"[viam_client] connecting to {VIAM_ADDRESS}")
    opts = RobotClient.Options.with_api_key(api_key=VIAM_API_KEY, api_key_id=VIAM_API_KEY_ID)

    async with await RobotClient.at_address(VIAM_ADDRESS, opts) as robot:
        print(f"[viam_client] connected — polling vision services")

        detectors = {
            svc: VisionClient.from_robot(robot, svc)
            for svc in VISION_SERVICES
        }

        while True:
            best_color = None
            best_confidence = 0.0
            best_detection = None

            for color_name, detector in detectors.items():
                color = color_name.split("-")[-1]  # "red", "green", "yellow"
                try:
                    detections = await detector.get_detections_from_camera(CAMERA_NAME)
                    for det in detections:
                        conf = getattr(det, "confidence", 0.0)
                        if conf > best_confidence:
                            best_confidence = conf
                            best_color = color
                            best_detection = det
                except Exception as e:
                    print(f"[viam_client] error polling {color_name}: {e}")

            vision_data = {
                "detected_color": best_color,
                "hand_detected": best_color is not None,
                "person_detected": best_color is not None,
                "timestamp": time.time(),
            }

            event = engine.process(vision_data)
            if event:
                event["timestamp"] = datetime.now(timezone.utc).isoformat()
                _post_event(event)

            # Refresh expected color from backend every 30s
            if time.time() - last_color_refresh > 30:
                new_color = _get_expected_color()
                if new_color != expected_color:
                    expected_color = new_color
                    engine.set_expected_color(new_color)
                    print(f"[viam_client] expected color updated → {new_color}")
                last_color_refresh = time.time()

            await asyncio.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    asyncio.run(run())
