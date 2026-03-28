import asyncio
from collections import deque
from intervention.llm import generate_instruction
from intervention.speech import speak
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
            # TODO Step 8: if high severity → nanoclaw + twilio
        except Exception as e:
            print(f"[event_handler] error processing event: {e}")
        finally:
            event_queue.task_done()


async def enqueue(event: dict):
    await event_queue.put(event)
