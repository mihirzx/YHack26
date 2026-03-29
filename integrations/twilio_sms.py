import os
import asyncio
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

_client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
TWILIO_FROM = os.getenv("TWILIO_FROM_NUMBER")
FAMILY_PHONE = os.getenv("FAMILY_PHONE")


def _send_sync(message: str):
    _client.messages.create(body=message, from_=TWILIO_FROM, to=FAMILY_PHONE)


async def send_sms(message: str):
    """Send an SMS alert to the family member (non-blocking)."""
    await asyncio.to_thread(_send_sync, message)
    print(f"[twilio_sms] SMS sent → {FAMILY_PHONE}")
