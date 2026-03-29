import os
import pyaudio
import threading
import asyncio
from collections import deque
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv

load_dotenv()

client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")


def _play_audio_bytes(audio_bytes: bytes):
    """Play raw PCM audio bytes through the system speaker."""
    p = pyaudio.PyAudio()
    stream = p.open(
        format=pyaudio.paInt16,
        channels=1,
        rate=22050,
        output=True,
    )
    stream.write(audio_bytes)
    stream.stop_stream()
    stream.close()
    p.terminate()


_speech_queue = deque()
_speech_lock = asyncio.Lock()


async def _speech_worker():
    while True:
        if _speech_queue:
            text = _speech_queue.popleft()
            audio_bytes = await generate_audio_file(text)
            _play_audio_bytes(audio_bytes)
            await asyncio.sleep(0.5)  # short cooldown between speeches
        else:
            await asyncio.sleep(0.1)


async def speak(text: str):
    """Queue up speech to play one at a time."""
    _speech_queue.append(text)


# Start the speech worker in the background
try:
    threading.Thread(target=lambda: asyncio.run(_speech_worker()), daemon=True).start()
except Exception:
    pass


def is_speaking() -> bool:
    return False


def set_speaking(val: bool):
    pass


async def generate_audio_file(text: str) -> bytes:
    """Generate audio bytes from text using ElevenLabs."""
    audio = client.text_to_speech.convert(
        voice_id=VOICE_ID,
        text=text,
        model_id="eleven_flash_v2_5",
        output_format="pcm_22050",
    )
    # audio is a generator — collect all chunks
    return b"".join(chunk for chunk in audio)
