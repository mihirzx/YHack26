import asyncio
import os
from collections import deque
from intervention.llm import generate_instruction, _describe_event
from intervention.speech import speak, is_speaking, set_speaking
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


def _build_recent_summary() -> str:
    if not recent_events:
        return "No recent events."
    lines = [
        f"{e.get('type', 'unknown')} at {e.get('timestamp', '?')}"
        for e in list(recent_events)[-5:]
    ]
    return "; ".join(lines)


async def consumer():
    print("[event_handler] consumer started")
    while True:
        event = await event_queue.get()
        try:
            if is_speaking():
                print("[event_handler] Suppressing speech: another system is speaking.")
                event_queue.task_done()
                continue
            set_speaking(True)
            context = _build_context()
            text = await generate_instruction(event, context)
            await speak(text)
            set_speaking(False)
            recent_events.append(event)

            severity = event.get("severity", "low")
            patient_name = os.getenv("PATIENT_NAME", "the patient")
            if severity == "critical":
                asyncio.create_task(trigger_call(
                    event_type=event.get("type", "alert"),
                    event_situation=_describe_event(event),
                    patient_name=patient_name,
                    recent_events_summary=_build_recent_summary(),
                ))
        except Exception as e:
            print(f"[event_handler] error processing event: {e}")
        finally:
            event_queue.task_done()


async def enqueue(event: dict):
    await event_queue.put(event)
