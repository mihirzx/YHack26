"""
Reads live serial stream from Arduino IMU (MPU-6050).
Detects falls via acceleration magnitude and posts fall_detected events
to the FastAPI backend.

Run on the machine with the Arduino plugged in.
Set ARDUINO_PORT in .env to your serial port (e.g. /dev/cu.usbmodemXXXX or COM3).
"""

import math
import os
import time
import serial
import httpx
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
ARDUINO_PORT = os.getenv("ARDUINO_PORT", "/dev/cu.usbmodemB43A45B362F82")
BAUD_RATE = int(os.getenv("ARDUINO_BAUD", "115200"))

# Fall detection thresholds (m/s²)
FALL_MAGNITUDE_THRESHOLD = 20.0  # impact spike
FREEFALL_THRESHOLD = 3.0         # near-zero before impact

# Seconds before another fall event can fire
DEBOUNCE_SECONDS = 30

_last_fall_time: float = 0.0
_freefall_detected: bool = False


def _magnitude(ax: float, ay: float, az: float) -> float:
    return math.sqrt(ax**2 + ay**2 + az**2)


def _post_fall():
    event = {
        "type": "fall_detected",
        "severity": "critical",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    try:
        resp = httpx.post(f"{BACKEND_URL}/events", json=event, timeout=5)
        print(f"[imu_listener] fall_detected posted → {resp.status_code}")
    except Exception as e:
        print(f"[imu_listener] failed to post event: {e}")


def run():
    global _last_fall_time, _freefall_detected

    print(f"[imu_listener] connecting to {ARDUINO_PORT} at {BAUD_RATE} baud")
    ser = serial.Serial(ARDUINO_PORT, BAUD_RATE, timeout=1.0)
    print(f"[imu_listener] connected — streaming IMU data")

    while True:
        raw = ser.readline().decode("utf-8", errors="ignore").strip()
        if not raw:
            continue

        try:
            ax, ay, az, gx, gy, gz = map(float, raw.split(","))
        except ValueError:
            continue  # skip malformed lines (startup text etc.)

        mag = _magnitude(ax, ay, az)

        if mag < FREEFALL_THRESHOLD:
            if not _freefall_detected:
                print(f"[imu_listener] freefall (mag={mag:.2f})")
                _freefall_detected = True

        elif mag > FALL_MAGNITUDE_THRESHOLD:
            now = time.time()
            if now - _last_fall_time > DEBOUNCE_SECONDS:
                label = "CONFIRMED (freefall+impact)" if _freefall_detected else "DETECTED (impact spike)"
                print(f"[imu_listener] FALL {label} mag={mag:.2f}")
                _last_fall_time = now
                _freefall_detected = False
                _post_fall()
            else:
                remaining = int(DEBOUNCE_SECONDS - (now - _last_fall_time))
                print(f"[imu_listener] debounced ({remaining}s cooldown)")

        else:
            if mag > 5.0:
                _freefall_detected = False


if __name__ == "__main__":
    run()
