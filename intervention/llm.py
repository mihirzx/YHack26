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


SEVERITY_INSTRUCTIONS = {
    "low": (
        "Use a warm, gentle tone. This is a soft reminder. Keep it calm and friendly."
    ),
    "medium": (
        "Use a clear, attentive tone. The patient needs to act but is not in danger. Be direct but kind."
    ),
    "high": (
        "Use a firm, urgent tone. The patient needs to act now. Be short, clear, and authoritative."
    ),
    "critical": (
        "Use a calm but serious tone. The patient may be in danger. Reassure them help is coming. "
        "Say something like 'stay calm, I am calling your family right now.'"
    ),
}


async def generate_instruction(event: dict, context: str = "") -> str:
    t0 = time.time()

    severity = event.get("severity", "medium")
    severity_note = SEVERITY_INSTRUCTIONS.get(severity, SEVERITY_INSTRUCTIONS["medium"])
    event_description = _describe_event(event)

    prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"Severity: {severity.upper()} — {severity_note}\n\n"
        f"{context}\n\n"
        f"Situation: {event_description}\n\n"
        f"Spoken instruction:"
    )

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
    print(f"[Gemini] ({elapsed:.2f}s) [{severity}] → \"{text}\"")
    return text


def _describe_event(event: dict) -> str:
    t = event.get("type", "unknown")
    if t in ("wrong_med_attempt", "medication"):
        obs = event.get("observed")
        exp = event.get("expected")
        if obs and exp:
            return f"Patient tried to take the {obs} pill but should take the {exp} pill."
        return "Patient may be taking the wrong medication."
    if t == "fall_detected":
        return "Patient has fallen and may need help getting up."
    if t == "wandering_detected":
        return f"Patient has left the {event.get('last_zone', 'safe area')} and is near {event.get('current_zone', 'an unsafe area')}."
    if t == "unsafe_activity":
        return f"Patient is doing something unsafe: {event.get('detail', 'unknown activity')}."
    if t == "no_activity":
        return f"Patient has not moved for {event.get('minutes_inactive', '?')} minutes."
    if t == "correct_med_taken":
        return f"Patient correctly took the {event.get('observed')} pill."
    return f"Event: {t}"
