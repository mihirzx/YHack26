import os
import pyaudio
import threading
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


async def speak(text: str):
    """Generate speech and play it. Runs audio playback in a thread so it doesn't block asyncio."""
    audio_bytes = await generate_audio_file(text)
    threading.Thread(target=_play_audio_bytes, args=(audio_bytes,), daemon=True).start()


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
