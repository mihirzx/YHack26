"""
Listens to the webcam mic for item location queries.
When the elder asks "where are my keys?" it looks up the last
known location from the backend and speaks the answer via ElevenLabs.

Requires: pip install openai-whisper pyaudio
Run on the machine with the microphone.
"""

import asyncio
import io
import os
import wave
import httpx
import pyaudio
import whisper
from dotenv import load_dotenv
from typing import Optional

from intervention.speech import speak

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

# Audio recording settings
SAMPLE_RATE = 16000
CHANNELS = 1
CHUNK = 1024
RECORD_SECONDS = 3  # listen in 3-second windows

# Keywords that signal an item location query
QUERY_KEYWORDS = ["where", "find", "where's", "where are", "where did", "where is"]

# Load Whisper tiny model (fast, ~40MB)
print("[mic_listener] loading Whisper model...")
model = whisper.load_model("tiny")
print("[mic_listener] Whisper ready")


# Simple file-based speaking lock to prevent overlapping speech
SPEAKING_FLAG = "/tmp/caresight_speaking.lock"


def is_speaking() -> bool:
    return False


def set_speaking(val: bool):
    pass


def _record_chunk() -> bytes:
    """Record a short audio chunk from the microphone."""
    print("omg stop asking me")
    p = pyaudio.PyAudio()
    stream = p.open(
        format=pyaudio.paInt16,
        channels=CHANNELS,
        rate=SAMPLE_RATE,
        input=True,
        frames_per_buffer=CHUNK,
    )
    frames = []
    for _ in range(int(SAMPLE_RATE / CHUNK * RECORD_SECONDS)):
        frames.append(stream.read(CHUNK, exception_on_overflow=False))
    stream.stop_stream()
    stream.close()
    p.terminate()

    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(b"".join(frames))
    return buf.getvalue()


def _transcribe(audio_bytes: bytes) -> str:
    """Transcribe audio bytes using Whisper."""
    buf = io.BytesIO(audio_bytes)
    import tempfile, soundfile as sf

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
    result = model.transcribe(tmp_path, language="en", fp16=False)
    os.unlink(tmp_path)
    return result["text"].strip().lower()


def _extract_item(text: str) -> Optional[str]:
    """Extract item name from a 'where are my X' query and lowercase it."""
    words = text.split()
    for i, word in enumerate(words):
        if word in ("my", "the", "our") and i + 1 < len(words):
            # Return the next word(s) as the item, lowercased
            item = words[i + 1].rstrip("?.,!").lower()
            return item
    return None


def _is_item_query(text: str) -> bool:
    return any(kw in text for kw in QUERY_KEYWORDS)


async def _answer_query(item: str):
    url = f"{BACKEND_URL.rstrip('/')}/items/{item}/last-seen"
    try:
        resp = httpx.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            location = data.get("location", "an unknown location")
            area = data.get("area", "")
            timestamp = data.get("timestamp", "")[:16].replace("T", " at ")
            area_str = f" near the {area}" if area else ""
            response_text = (
                f"Your {item} were last seen on the {location}{area_str}, at {timestamp}."
            )
        else:
            response_text = f"I don't have a record of where your {item} are. Ask a caregiver to log their location."
    except Exception as e:
        print(f"[mic_listener] backend query failed: {e}")
        response_text = f"I couldn't look that up right now. Please ask your caregiver."

    print(f"[mic_listener] speaking: {response_text}")
    await speak(response_text)
    set_speaking(False)


async def run():
    print(f"[mic_listener] listening for item queries...")
    while True:
        audio = _record_chunk()
        if not audio:
            print("[mic_listener] No audio recorded, skipping transcription.")
            continue
        text = _transcribe(audio)

        if not text:
            continue

        print(f"[mic_listener] heard: '{text}'")

        if _is_item_query(text):
            item = _extract_item(text)
            if item:
                print(f"[mic_listener] item query detected: '{item}'")
                await _answer_query(item)


if __name__ == "__main__":
    asyncio.run(run())
