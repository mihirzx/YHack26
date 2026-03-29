from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
import os
from dotenv import load_dotenv
from typing import Optional

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


async def get_event(event_id: str) -> Optional[dict]:
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


async def get_item_last_seen(item: str) -> Optional[dict]:
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


async def get_stats() -> dict:
    """Aggregate event stats for the analytics dashboard."""
    all_events = await events_col.find({}, {"_id": 0}).sort("timestamp", -1).to_list(500)

    total = len(all_events)
    violations = [e for e in all_events if e.get("type") in ("wrong_med_attempt", "escalated")]
    corrections = [e for e in all_events if e.get("type") in ("corrected", "correct_med_taken")]
    escalations = [e for e in all_events if e.get("type") == "escalated"]

    correction_rate = (len(corrections) / len(violations) * 100) if violations else 100.0

    # Events grouped by type
    type_counts: dict[str, int] = {}
    for e in all_events:
        t = e.get("type", "unknown")
        type_counts[t] = type_counts.get(t, 0) + 1

    # Severity breakdown
    severity_counts: dict[str, int] = {}
    for e in all_events:
        s = e.get("severity", "unknown")
        severity_counts[s] = severity_counts.get(s, 0) + 1

    # Last 24h hourly breakdown
    now = datetime.now(timezone.utc)
    hourly: dict[int, int] = {h: 0 for h in range(24)}
    for e in all_events:
        try:
            ts = e.get("timestamp", "")
            if isinstance(ts, (int, float)):
                t = datetime.fromtimestamp(ts, tz=timezone.utc)
            else:
                t = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
            if (now - t).total_seconds() < 86400:
                hourly[t.hour] = hourly.get(t.hour, 0) + 1
        except Exception:
            pass

    return {
        "total_events": total,
        "total_violations": len(violations),
        "total_corrections": len(corrections),
        "total_escalations": len(escalations),
        "correction_rate": round(correction_rate, 1),
        "type_counts": type_counts,
        "severity_counts": severity_counts,
        "hourly_activity": hourly,
        "recent_events": all_events[:10],
    }
