# CareSight — Backend & Integrations

Everything the Pi runs. The brain of the system.

---

## How It Works (30-second version)

The Raspberry Pi is a **standalone device** — it runs the backend, handles all hardware, and calls all cloud APIs directly. No laptop in the loop.

```
Webcam + MPU-6050 + Buzzer + Speaker
            ↓
    vision/detection.py  (OpenCV)
    hardware/controller.py (MPU-6050)
            ↓
    POST localhost:8000/events
            ↓
    backend/main.py  ← FastAPI (the brain)
            ↓
    Gemini API → ElevenLabs → Pi Speaker  (< 800ms)
    MongoDB Atlas               (fire-and-forget)
    WebSocket → Dashboard       (fire-and-forget)
    Twilio voice call           (severity = high)
    NanoClaw → WhatsApp/Telegram (severity = high)
    Viam buzzer                 (severity = high)
```

Anyone on the same WiFi opens `http://caresight.local:8000` to see the dashboard.
Remotely: Cloudflare Tunnel gives a public HTTPS URL.

---

## Running It

```bash
# Install dependencies
pip install -r requirements.txt

# Copy env and fill in keys
cp .env.example .env

# Run everything
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Camera stream runs separately (vision team)
python vision/camera_stream.py   # serves MJPEG on :5001
```

On the Pi for demo day — auto-starts on boot via systemd:
```bash
sudo systemctl enable caresight
sudo systemctl start caresight

# After a git pull:
sudo systemctl restart caresight
```

---

## API Endpoints

### Events
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/events` | Vision/hardware sends a detected event here |
| `GET` | `/events` | List recent events (dashboard, Hex) |
| `GET` | `/events/{event_id}` | Single event |
| `PATCH` | `/events/{event_id}/corrected` | Mark patient self-corrected |

### Patient & Config
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/patient` | Patient profile (name, age, meds schedule) |
| `POST` | `/patient` | Create/update patient profile |
| `GET` | `/config` | Current expected medication, thresholds |
| `POST` | `/config` | Caregiver updates settings |

### Real-Time
| | Endpoint | Description |
|---|---|---|
| `WS` | `/ws` | WebSocket — events pushed to dashboard in real time |
| `GET` | `/stream` | Live camera feed (MJPEG, proxied from vision :5001) |

### Utility
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Returns `{"status": "ok"}` |
| `POST` | `/nanoclaw/query` | NanoClaw agent calls this for caregiver chat queries |

---

## Event Schema

Events are flexible MongoDB documents — each type carries only the fields that apply.

```json
{ "type": "wrong_med_attempt", "expected": "red", "observed": "blue",  "severity": "medium", "zone": "kitchen" }
{ "type": "fall_detected",     "severity": "critical", "accel_magnitude": 4.2 }
{ "type": "wandering_detected","last_zone": "bedroom", "current_zone": "front_door", "severity": "high" }
{ "type": "correct_med_taken", "expected": "red", "observed": "red",   "severity": "low" }
{ "type": "unsafe_activity",   "detail": "stove_on",                   "severity": "high" }
{ "type": "no_activity",       "minutes_inactive": 45,                 "severity": "medium" }
```

**Severity levels:** `low` · `medium` · `high` · `critical`

**What fires at each level:**
- `low` — ElevenLabs audio on Pi speaker only
- `medium` — audio + MongoDB + WebSocket
- `high` — audio + MongoDB + WebSocket + NanoClaw WhatsApp/Telegram + Twilio voice call + buzzer
- `critical` — same as high but pre-cached audio (no Gemini delay, fires in < 300ms)

---

## For the Vision Team

Send events here whenever you detect something:

```python
import httpx

async def send_event(event_type: str, **kwargs):
    async with httpx.AsyncClient() as client:
        await client.post("http://localhost:8000/events", json={
            "type": event_type,
            **kwargs
        })

# Examples:
await send_event("wrong_med_attempt", expected="red", observed="blue", severity="medium", zone="kitchen")
await send_event("correct_med_taken", expected="red", observed="red", severity="low")
await send_event("wandering_detected", last_zone="bedroom", current_zone="front_door", severity="high")
```

Camera stream: serve your OpenCV MJPEG output on `:5001/stream`. The backend proxies it through `/stream` for the dashboard.

---

## For the Hardware Team

Send fall events when MPU-6050 threshold is exceeded:

```python
await send_event("fall_detected", severity="critical", accel_magnitude=float(magnitude))
```

The backend handles everything from there — pre-cached audio fires in < 300ms, all emergency alerts trigger simultaneously.

Buzzer is controlled by `intervention/alerts.py` via the Viam SDK. See `integrations/viam_client.py`.

---

## For the Dashboard Team

**Base URL:**
- Local: `http://caresight.local:8000`
- Remote / Vercel: use the Cloudflare Tunnel URL (set as `NEXT_PUBLIC_API_URL` in Vercel)

**Connect to real-time event feed:**
```javascript
const ws = new WebSocket(`${process.env.NEXT_PUBLIC_API_URL.replace('https','wss')}/ws`)
ws.onmessage = (msg) => {
    const event = JSON.parse(msg.data)
    // update your UI
}
```

**Embed camera stream:**
```jsx
<img src={`${process.env.NEXT_PUBLIC_API_URL}/stream`} />
```

**CORS is configured** for `https://*.vercel.app` and `http://localhost:3000`. Let the backend dev know your Vercel URL to whitelist it.

**Hex analytics:** connect directly to MongoDB Atlas (connection string from backend dev). Hex bypasses the API entirely — use it for historical charts on the `/analytics` page as an iframe embed.

---

## Environment Variables

```bash
# MongoDB
MONGODB_URL=mongodb+srv://...

# AI / Voice
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=eleven_flash_v2_5

# Alerts
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
FAMILY_PHONE=

# NanoClaw (WhatsApp/Telegram agent on Pi)
NANOCLAW_WEBHOOK_URL=http://localhost:3000/webhook
NANOCLAW_API_KEY=

# Viam (hardware)
VIAM_API_KEY=
VIAM_API_KEY_ID=
VIAM_ROBOT_ADDRESS=

# Dashboard
HEX_API_KEY=
```

---

## Latency Design

The hot path (event → patient hears audio) never touches the database.

```
Event → asyncio.Queue
            ↓
        context_builder (in-memory patient profile + recent events deque)
            ↓
        Gemini 2.0 Flash  ~150-300ms  (max_output_tokens=60, streaming)
            ↓
        ElevenLabs Flash WS  ~75ms to first audio chunk
            ↓
        pyaudio plays chunks as they arrive  ← patient hears this

Meanwhile (fire-and-forget, don't block audio):
    → MongoDB write
    → WebSocket broadcast
    → Twilio call          (if severity=high)
    → NanoClaw WhatsApp    (if severity=high)
    → Buzzer               (if severity=high)
```

**Fall detection** skips Gemini entirely — pre-cached audio phrase plays in < 300ms.

Target: **< 800ms** event to first spoken word for dynamic responses, **< 300ms** for cached emergency phrases.

---

## Stack

| Thing | Technology |
|---|---|
| Backend framework | FastAPI (async) |
| Database | MongoDB Atlas (Motor async driver) |
| LLM | Gemini 2.0 Flash |
| Text-to-speech | ElevenLabs (`eleven_flash_v2_5`, WebSocket streaming) |
| Voice calls | Twilio Programmable Voice |
| WhatsApp/Telegram | NanoClaw on Pi |
| Camera orchestration | Viam SDK |
| Computer vision | OpenCV (vision team) |
| Fall detection | MPU-6050 via I2C (hardware team) |
| Frontend | Next.js on Vercel |
| Historical analytics | Hex (connects to MongoDB Atlas) |
| Remote access | Cloudflare Tunnel |
| Hosting | Raspberry Pi (self-hosted, systemd) |
