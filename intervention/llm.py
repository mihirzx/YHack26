import os
import time
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = (
    "You are a calm, caring AI assistant helping an elderly person with dementia. "
    "Respond with ONE short, simple spoken sentence (max 20 words). "
    "Be gentle, clear, and direct. No punctuation except periods."
)


async def generate_instruction(event: dict, context: str = "") -> str:
    t0 = time.time()

    event_description = _describe_event(event)
    prompt = f"{SYSTEM_PROMPT}\n\n{context}\n\nSituation: {event_description}\n\nSpoken instruction:"

    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt,
        config=types.GenerateContentConfig(
            max_output_tokens=60,
            temperature=0.4,
        ),
    )
    text = response.text.strip()

    elapsed = time.time() - t0
    print(f"[Gemini] ({elapsed:.2f}s) → \"{text}\"")
    return text


def _describe_event(event: dict) -> str:
    t = event.get("type", "unknown")
    if t == "wrong_med_attempt":
        return f"Patient tried to take the {event.get('observed')} pill but should take the {event.get('expected')} pill."
    if t == "fall_detected":
        return "Patient has fallen."
    if t == "wandering_detected":
        return f"Patient has left the {event.get('last_zone', 'safe area')} and is near {event.get('current_zone', 'an unsafe area')}."
    if t == "unsafe_activity":
        return f"Patient is doing something unsafe: {event.get('detail', 'unknown activity')}."
    if t == "no_activity":
        return f"Patient has not moved for {event.get('minutes_inactive', '?')} minutes."
    if t == "correct_med_taken":
        return f"Patient correctly took the {event.get('observed')} pill."
    return f"Event: {t}"
