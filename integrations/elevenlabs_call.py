import os
import httpx
from dotenv import load_dotenv

load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
AGENT_ID = os.getenv("ELEVENLABS_AGENT_ID")
AGENT_PHONE_ID = os.getenv("ELEVENLABS_AGENT_PHONE_ID")
FAMILY_PHONE = os.getenv("FAMILY_PHONE")


async def trigger_call(
    event_type: str,
    event_situation: str,
    patient_name: str = "the patient",
    recent_events_summary: str = "No recent events.",
):
    """Trigger an ElevenLabs Conversational AI outbound call to the family member."""
    payload = {
        "agent_id": AGENT_ID,
        "agent_phone_number_id": AGENT_PHONE_ID,
        "to_number": FAMILY_PHONE,
        "conversation_initiation_client_data": {
            "dynamic_variables": {
                "patient_name": patient_name,
                "event_type": event_type,
                "event_situation": event_situation,
                "recent_events_summary": recent_events_summary,
            }
        },
    }

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
            json=payload,
            headers={"xi-api-key": ELEVENLABS_API_KEY},
        )
        if resp.status_code == 200:
            print(f"[elevenlabs_call] call initiated → {FAMILY_PHONE}")
        else:
            print(f"[elevenlabs_call] failed ({resp.status_code}): {resp.text}")
