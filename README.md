# YHack26


CareSight: Real-Time AI Caregiver for Medication Safety
Overview


CareSight is a real-time AI caregiver system designed to assist individuals with Alzheimer’s and dementia during daily routines. The system monitors user actions through a camera, detects incorrect or unsafe behavior, intervenes immediately with voice instructions, and logs events to a caregiver-facing dashboard.


The primary focus of the current implementation is medication safety, one of the most common and high-risk failure points for cognitively impaired individuals.


This project is developed as a hacka2thon MVP and prioritizes reliability, clarity of interaction, and real-time response over full clinical accuracy.


Problem


Individuals with Alzheimer’s and dementia frequently:


take the wrong medication
forget instructions
perform tasks incorrectly or unsafely


Caregivers cannot continuously monitor patients in real time, and existing solutions are typically reactive rather than preventative.


There is a need for a system that can observe behavior, detect mistakes as they happen, and intervene immediately.


Solution


CareSight provides a closed-loop system:


Observes user actions through a camera
Detects task-related behavior using computer vision
Determines whether the behavior is correct or unsafe
Intervenes immediately using voice feedback
Logs events for caregiver review
Optionally escalates critical situations


The system is designed to support caregivers by providing both real-time intervention and remote visibility into patient behavior.


Core Scenario: Medication Safety


The primary demonstration scenario uses colored M&Ms to simulate medication.


Each color represents a specific medication
The caregiver specifies the expected color for a given time
The system monitors the user selecting a pill
If the wrong color is selected, the system intervenes


Example:


Expected medication: red
Observed selection: blue
System response:
detect mismatch
generate corrective instruction
speak instruction aloud
log event to dashboard


If the user corrects their behavior, the system records the correction.


System Architecture


The system is composed of five main components.


1. Vision Layer
Webcam input
Integrated with Viam for image recognition
Outputs structured data such as:
person_detected
hand_detected
detected_color


OpenCV may be used for additional processing if needed.


2. Logic Engine
Compares observed behavior with expected behavior
Determines whether an action is correct or incorrect
Handles:
timing
state tracking
correction detection
escalation conditions


Produces structured event outputs.


3. Voice System
Uses the Gemini API to generate short, clear corrective instructions
Uses ElevenLabs to convert text into speech
Delivers real-time audio feedback to the user
4. Caregiver Dashboard
Built using Hex
Displays:
current expected medication
recent alerts
event timeline
correction status


Allows caregiver input for schedules and reminders.


5. Integration Layer
Connects vision, logic, voice, and dashboard components
Handles event flow across the system
Manages API calls and data movement


Optional features include SMS escalation via NanoClaw and hardware-based alerts.


Event Flow


The system follows this flow:


Camera detects user interaction
Vision system outputs structured detection data
Logic engine evaluates behavior
If incorrect:
event is generated
voice instruction is created and played
event is sent to dashboard
System continues monitoring
If corrected:
correction event is logged
Example Event Structure
{
 "event_id": "evt_001",
 "timestamp": "2026-03-28T09:02:00Z",
 "type": "wrong_med_attempt",
 "expected_color": "red",
 "observed_color": "blue",
 "corrected": false,
 "severity": "medium"
}
Technology Stack
Vision: Viam with webcam input
Optional vision support: OpenCV
Logic: Python or Node.js
LLM: Gemini API
Speech: ElevenLabs
Dashboard: Hex
Hardware (optional): Arduino or Raspberry Pi
SMS escalation (optional): NanoClaw
Build Priorities


The system is built in phases.


Phase 1 (Required)
camera detection working
logic engine identifies incorrect behavior
voice intervention works
Phase 2
dashboard integration
event logging
Phase 3
correction detection
improved interaction loop
Phase 4 (Optional)
hardware alerts
SMS escalation
additional scenarios
Demo Flow
Caregiver dashboard displays expected medication
User reaches for incorrect color
System detects mismatch
Voice instruction is played
Dashboard logs event
User corrects action
Dashboard logs correction
Design Constraints
The system does not perform medical diagnosis
It is not a replacement for caregivers
The MVP uses color-based detection for reliability
The system focuses on real-time intervention rather than perfect accuracy
Future Work
real medication recognition
multi-task monitoring (cooking, movement, etc.)
long-term behavioral trend analysis
wearable camera integration
expanded caregiver notification system
Summary


CareSight is designed to demonstrate that real-time intervention is possible using low-cost hardware and modern AI tools. By detecting incorrect actions and responding immediately, the system helps prevent mistakes before they occur and provides caregivers with meaningful visibility into patient behavior.
