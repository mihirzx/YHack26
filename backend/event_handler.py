import asyncio
import os
from collections import deque
from intervention.llm import generate_instruction
from intervention.speech import speak
from integrations.twilio_sms import send_sms
from integrations.elevenlabs_call import trigger_call
import backend.database as db

event_queue: asyncio.Queue = asyncio.Queue()
recent_events: deque = deque(maxlen=20)


def _build_context() -> str:
    if not recent_events:
        return ""
    lines = "\n".join(
        f"  {e.get('timestamp', '?')} — {e.get('type', '?')}"
        for e in recent_events
    )
    return f"Recent events today:\n{lines}"


async def consumer():
    print("[event_handler] consumer started")
    while True:
        event = await event_queue.get()
        try:
            context = _build_context()
            text = await generate_instruction(event, context)
            await speak(text)
            recent_events.append(event)

            severity = event.get("severity", "low")
            patient_name = os.getenv("PATIENT_NAME", "the patient")
            if severity in ("high", "critical"):
                asyncio.create_task(send_sms(f"CareSight Alert: {text}"))
            if severity == "critical":
                asyncio.create_task(trigger_call(
                    event_type=event.get("type", "alert"),
                    event_description=text,
                    patient_name=patient_name,
                ))
        except Exception as e:
            print(f"[event_handler] error processing event: {e}")
        finally:
            event_queue.task_done()


async def enqueue(event: dict):
    await event_queue.put(event)
