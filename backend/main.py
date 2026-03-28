from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import sqlite3
import uuid
import json

app = FastAPI(title="CareSight Backend", version="1.0.0")

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
    expected: str
    observed: str
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

def init_db():
    conn = sqlite3.connect('caresight.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            event_id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            type TEXT NOT NULL,
            expected TEXT NOT NULL,
            observed TEXT NOT NULL,
            corrected BOOLEAN DEFAULT FALSE,
            severity TEXT DEFAULT 'medium'
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        INSERT OR IGNORE INTO settings (key, value) VALUES ('expected_medication', 'red')
    ''')
    
    conn.commit()
    conn.close()

init_db()

@app.post("/events", response_model=EventResponse)
async def create_event(event: Event):
    try:
        event_id = event.event_id or str(uuid.uuid4())
        timestamp = event.timestamp or datetime.now().isoformat()
        
        conn = sqlite3.connect('caresight.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO events (event_id, timestamp, type, expected, observed, corrected, severity)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (event_id, timestamp, event.type, event.expected, event.observed, event.corrected, event.severity))
        
        conn.commit()
        conn.close()
        
        return EventResponse(success=True, event_id=event_id)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/events", response_model=List[Event])
async def get_events():
    try:
        conn = sqlite3.connect('caresight.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT event_id, timestamp, type, expected, observed, corrected, severity
            FROM events
            ORDER BY timestamp DESC
        ''')
        
        events = []
        for row in cursor.fetchall():
            events.append(Event(
                event_id=row[0],
                timestamp=row[1],
                type=row[2],
                expected=row[3],
                observed=row[4],
                corrected=bool(row[5]),
                severity=row[6]
            ))
        
        conn.close()
        return events
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/settings/medication", response_model=MedicationResponse)
async def set_medication(setting: MedicationSetting):
    try:
        conn = sqlite3.connect('caresight.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO settings (key, value)
            VALUES ('expected_medication', ?)
        ''', (setting.expected_color,))
        
        conn.commit()
        conn.close()
        
        return MedicationResponse(success=True, expected_color=setting.expected_color)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/settings/medication", response_model=MedicationSetting)
async def get_medication():
    try:
        conn = sqlite3.connect('caresight.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT value FROM settings WHERE key = 'expected_medication'
        ''')
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return MedicationSetting(expected_color=result[0])
        else:
            return MedicationSetting(expected_color="red")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "CareSight Backend API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)