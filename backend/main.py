from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from contextlib import asynccontextmanager
import asyncio
import json
import backend.database as db
import backend.event_handler as handler

# ── WebSocket clients ────────────────────────────────────────────
connected_clients: set[WebSocket] = set()


async def broadcast_event(event: dict):
    """Push event to all connected dashboard WebSocket clients."""
    dead: set[WebSocket] = set()
    data = json.dumps(event, default=str)
    for ws in connected_clients:
        try:
            await ws.send_text(data)
        except Exception:
            dead.add(ws)
    for ws in dead:
        connected_clients.discard(ws)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.connect()
    asyncio.get_event_loop().create_task(handler.consumer())
    yield
    db.disconnect()


app = FastAPI(title="CareSight Backend", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Event(BaseModel):
    event_id: Optional[str] = None
    timestamp: Optional[str] = None
    type: str
    expected: Optional[str] = None
    observed: Optional[str] = None
    corrected: bool = False
    severity: str = "medium"

class ItemLog(BaseModel):
    item: str
    location: str
    area: Optional[str] = ""

class MedicationSetting(BaseModel):
    expected_color: str

class EventResponse(BaseModel):
    success: bool
    event_id: str

class MedicationResponse(BaseModel):
    success: bool
    expected_color: str

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connected_clients.discard(websocket)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"message": "CareSight Backend API is running"}


@app.post("/events", status_code=202, response_model=EventResponse)
async def create_event(event: Event):
    try:
        doc = event.model_dump()
        event_id = await db.create_event(doc)
        doc["event_id"] = event_id
        await handler.enqueue(doc)
        await broadcast_event(doc)
        return EventResponse(success=True, event_id=event_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/events")
async def get_events(limit: int = 50):
    try:
        return await db.list_events(limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/events/{event_id}")
async def get_event(event_id: str):
    doc = await db.get_event(event_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Event not found")
    return doc


@app.patch("/events/{event_id}/corrected")
async def mark_corrected(event_id: str):
    await db.mark_corrected(event_id)
    return {"success": True}


@app.get("/settings/medication", response_model=MedicationSetting)
async def get_medication():
    try:
        config = await db.get_config()
        return MedicationSetting(expected_color=config["expected_color"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/settings/medication", response_model=MedicationResponse)
async def set_medication(setting: MedicationSetting):
    try:
        await db.set_config(setting.expected_color)
        return MedicationResponse(success=True, expected_color=setting.expected_color)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/items", status_code=201)
async def log_item(item: ItemLog):
    try:
        item_id = await db.log_item(item.item, item.location, item.area)
        return {"success": True, "item_id": item_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/items")
async def list_items():
    try:
        return await db.list_items()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/items/{item}/last-seen")
async def get_item_last_seen(item: str):
    doc = await db.get_item_last_seen(item)
    if not doc:
        raise HTTPException(status_code=404, detail=f"No sighting recorded for '{item}'")
    return doc


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
