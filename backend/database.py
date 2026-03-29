from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")

client: AsyncIOMotorClient = None
db = None
events_col = None
config_col = None


items_col = None


def connect():
    global client, db, events_col, config_col, items_col
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client["caresight"]
    events_col = db["events"]
    config_col = db["config"]
    items_col = db["items"]


def disconnect():
    if client:
        client.close()


async def create_event(event: dict) -> str:
    doc = {
        **event,
        "event_id": event.get("event_id") or str(uuid.uuid4()),
        "timestamp": event.get("timestamp") or datetime.now(timezone.utc).isoformat(),
    }
    await events_col.insert_one(doc)
    return doc["event_id"]


async def list_events(limit: int = 50) -> list:
    cursor = events_col.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit)
    return await cursor.to_list(limit)


async def get_event(event_id: str) -> dict | None:
    return await events_col.find_one({"event_id": event_id}, {"_id": 0})


async def mark_corrected(event_id: str):
    await events_col.update_one(
        {"event_id": event_id},
        {"$set": {"corrected": True}}
    )


async def get_config() -> dict:
    default_color = os.getenv("DEFAULT_EXPECTED_COLOR", "red")
    doc = await config_col.find_one({"_id": "settings"})
    if not doc:
        return {"expected_color": default_color}
    return {"expected_color": doc.get("expected_color", default_color)}


async def log_item(item: str, location: str, area: str = "") -> str:
    doc = {
        "item_id": str(uuid.uuid4()),
        "item": item.lower().strip(),
        "location": location,
        "area": area,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await items_col.insert_one(doc)
    return doc["item_id"]


async def get_item_last_seen(item: str) -> dict | None:
    return await items_col.find_one(
        {"item": item.lower().strip()},
        {"_id": 0},
        sort=[("timestamp", -1)],
    )


async def list_items() -> list:
    cursor = items_col.find({}, {"_id": 0}).sort("timestamp", -1).limit(50)
    return await cursor.to_list(50)


async def set_config(expected_color: str):
    await config_col.update_one(
        {"_id": "settings"},
        {"$set": {"expected_color": expected_color}},
        upsert=True,
    )
