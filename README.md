# CareSight — AI-Powered Virtual Caregiver System

> A real-time AI caregiver system that monitors user behavior through vision, detects unsafe or incorrect actions (e.g., medication errors), and intervenes instantly with voice guidance — while providing caregivers with live insights and alerts.

---

## What It Does

Patients with dementia or cognitive impairment often make small mistakes that can lead to serious consequences:

- Taking the wrong medication  
- Forgetting to take medication  
- Leaving unsafe situations unattended  

CareSight continuously observes user actions through a camera and:

- Detects incorrect behavior in real time  
- Intervenes immediately with voice instructions  
- Logs events for caregiver visibility  
- Escalates critical situations when necessary  

This allows one caregiver to safely monitor multiple patients while preserving independence for the user.

---

## Project Structure

```
caresight/
│
├── vision/                    # Camera + detection
│   ├── camera_stream.py      # Webcam feed
│   ├── detection.py          # Viam + OpenCV detection logic
│   └── zones.py              # Interaction zones
│
├── logic/                     # Decision engine
│   ├── rules.py              # Safety + correctness rules
│   ├── state.py              # Tracks user state
│   └── events.py             # Event generation
│
├── intervention/              # Response system
│   ├── llm.py                # Gemini API
│   ├── speech.py             # ElevenLabs TTS
│   └── alerts.py             # Buzzer / hardware
│
├── backend/                   # API + event handling
│   ├── main.py
│   ├── event_handler.py
│   └── database.py
│
├── dashboard/                 # Caregiver dashboard
│   ├── app.py
│   └── components/
│
├── hardware/                  # Optional Pi + sensors
│   ├── buzzer.py
│   ├── ultrasonic.py
│   └── controller.py
│
├── integrations/
│   ├── viam_client.py
│   └── sms.py
│
├── .env.example
├── requirements.txt
└── README.md
```

---

## Tech Stack

### Languages

| Language | Usage |
|----------|-------|
| Python | Vision, backend, logic |
| JavaScript | Dashboard |
| SQL | Event logging |

---

### Core Systems

| Tool | Usage |
|------|-------|
| Viam | Camera + hardware orchestration |
| OpenCV | Image processing |
| Webcam | Video input |

---

### AI / ML

| Tool | Usage |
|------|-------|
| Gemini API | Generates instructions |
| CV models | Object + color detection |

---

### Intervention

| Tool | Usage |
|------|-------|
| ElevenLabs | Text-to-speech |
| Buzzer | Physical alerts |

---

### Backend + Dashboard

| Tool | Usage |
|------|-------|
| FastAPI | API |
| Hex API | Dashboard |
| PostgreSQL | Event storage |

---

## System Architecture

```
Camera (Viam) → Detection → Logic Engine → Event → Intervention + Dashboard
```

---

## Event Flow (Medication Demo)

```
User reaches for medication
        ↓
Camera detects hand + object color (blue)
        ↓
System compares with expected color (red)
        ↓
Mismatch detected
        ↓
Event generated: wrong_med_attempt
        ↓
Gemini generates instruction
        ↓
ElevenLabs speaks:
"That is not the correct medication. Please take the red one."
        ↓
Dashboard logs event
        ↓
User corrects action
        ↓
System logs correction
```

---

## Event Schema

```json
{
  "event_id": "evt_001",
  "timestamp": "...",
  "type": "wrong_med_attempt",
  "expected": "red",
  "observed": "blue",
  "corrected": false,
  "severity": "medium"
}
```

---

## Key Innovation

- Real-time intervention (not just monitoring)
- Multimodal system (vision + logic + voice)
- Low-cost hardware (< $200)
- Scalable caregiver-to-patient ratio
- Event-driven architecture

---

## Demo Flow

1. Caregiver inputs expected medication color  
2. User interacts with pills (M&Ms)  
3. System detects incorrect choice  
4. Voice correction is issued  
5. Dashboard updates  
6. Correction is tracked  

---

## Getting Started

### 1. Install dependencies
```
pip install -r requirements.txt
```

### 2. Run camera system
```
python vision/camera_stream.py
```

### 3. Start backend
```
uvicorn backend.main:app --reload
```

### 4. Start dashboard
```
python dashboard/app.py
```

---

## Resume Bullet

Built a real-time AI caregiver system using computer vision, event-driven logic, and voice synthesis that detects unsafe patient behavior and intervenes instantly, integrating Viam, Gemini, ElevenLabs, and a caregiver dashboard.

---

## Design Constraints

- Not a medical diagnostic tool  
- Focused on intervention, not prediction  
- Uses color-based detection for MVP reliability  

---

## Future Work

- Real medication recognition  
- Activity monitoring (cooking, falls)  
- Wearable camera integration  
- Behavioral analytics  
- Advanced caregiver alerts  

---

## Authors

YHack 2026 Team

---

## Disclaimer

This system is a prototype and does not replace professional medical care. It is intended for demonstration purposes only.
