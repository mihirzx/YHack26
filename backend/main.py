from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from contextlib import asynccontextmanager
import asyncio
import backend.database as db
import backend.event_handler as handler


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

class MedicationSetting(BaseModel):
    expected_color: str

class EventResponse(BaseModel):
    success: bool
    event_id: str

class MedicationResponse(BaseModel):
    success: bool
    expected_color: str

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
