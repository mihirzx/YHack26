"""
Patient state tracker for CareSight.

Tracks what the patient is doing, what medication is expected,
and whether they've corrected after a wrong attempt.

Input: vision data (detected_color, hand_detected, etc.)
Output: current state dict used by rules engine
"""

import time
import logging

logger = logging.getLogger(__name__)


class PatientState:
    """Tracks the current state of a single patient session.

    Usage:
        state = PatientState(expected_color="red")
        state.update(vision_data)
        print(state.get_state())
    """

    def __init__(self, expected_color: str):
        self.expected_color = expected_color.lower().strip()
        self.observed_color = None
        self.person_detected = False
        self.hand_detected = False
        self.last_update_time = None
        self.last_alert_time = None
        self.corrected = False
        self.alert_active = False

        # Cooldown: minimum seconds between alerts to prevent spam
        self.alert_cooldown_seconds = 5.0

    def update(self, vision_data: dict) -> None:
        """Update state from vision system output.

        Args:
            vision_data: dict with keys person_detected, hand_detected,
                        detected_color, timestamp
        """
        if not isinstance(vision_data, dict):
            logger.warning("Invalid vision data: expected dict, got %s", type(vision_data))
            return

        self.person_detected = bool(vision_data.get("person_detected", False))
        self.hand_detected = bool(vision_data.get("hand_detected", False))

        raw_color = vision_data.get("detected_color")
        if raw_color is not None:
            self.observed_color = str(raw_color).lower().strip()
        else:
            self.observed_color = None

        self.last_update_time = vision_data.get("timestamp", time.time())

        # Check if user corrected their action
        if self.alert_active and self.observed_color == self.expected_color:
            self.corrected = True
            self.alert_active = False
            logger.info("Patient corrected: now holding %s", self.observed_color)

    def is_mismatch(self) -> bool:
        """Return True if the observed color does not match the expected color and both are set."""
        if self.observed_color is None or self.expected_color is None:
            return False
        return self.observed_color != self.expected_color

    def is_correct(self) -> bool:
        """Return True if the observed color matches the expected color and both are set."""
        if self.observed_color is None or self.expected_color is None:
            return False
        return self.observed_color == self.expected_color

    def can_alert(self) -> bool:
        """Check if enough time has passed since last alert (anti-spam)."""
        if self.last_alert_time is None:
            return True
        elapsed = time.time() - self.last_alert_time
        return elapsed >= self.alert_cooldown_seconds

    def mark_alerted(self) -> None:
        """Record that an alert was just sent."""
        self.last_alert_time = time.time()
        self.alert_active = True
        self.corrected = False

    def set_expected_color(self, color: str) -> None:
        """Update expected medication color (caregiver input)."""
        self.expected_color = color.lower().strip()
        self.corrected = False
        self.alert_active = False
        logger.info("Expected color updated to: %s", self.expected_color)

    def get_state(self) -> dict:
        """Return current state as a dict for the rules engine."""
        return {
            "expected_color": self.expected_color,
            "observed_color": self.observed_color,
            "person_detected": self.person_detected,
            "hand_detected": self.hand_detected,
            "is_mismatch": self.is_mismatch(),
            "can_alert": self.can_alert(),
            "alert_active": self.alert_active,
            "corrected": self.corrected,
            "last_update_time": self.last_update_time,
        }
