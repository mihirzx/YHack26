"""
Rules engine for CareSight.

Takes vision data, runs it through state tracking,
and decides what events to emit.

This is the main entry point for the logic layer.
Other components call: engine.process(vision_data)

Input: raw vision data dict from camera system
Output: event dict (or None if no action needed)
"""

import time
import logging
from caresight.logic.state import PatientState
from caresight.logic.events import wrong_med_event, corrected_event, escalated_event

logger = logging.getLogger(__name__)


class RulesEngine:
    """Decision engine that evaluates patient actions.

    Usage:
        engine = RulesEngine(expected_color="red")
        event = engine.process(vision_data)
        if event:
            send_to_backend(event)
    """

    # Seconds to wait before escalating an uncorrected wrong attempt
    ESCALATION_TIMEOUT = 15.0

    def __init__(self, expected_color: str):
        self.state = PatientState(expected_color)
        self._wrong_attempt_time = None
        self._escalated = False

    def process(self, vision_data: dict) -> dict | None:
        """Process a single frame of vision data.

        Returns an event dict if action is needed, None otherwise.
        """
        self.state.update(vision_data)

        # No person or no hand interaction — nothing to evaluate
        if not self.state.person_detected or not self.state.hand_detected:
            return None

        # Patient corrected their action
        if self.state.corrected:
            self.state.corrected = False
            self._wrong_attempt_time = None
            self._escalated = False
            logger.info("Correction detected")
            return corrected_event(
                self.state.expected_color,
                self.state.observed_color,
            )

        # Wrong medication detected
        if self.state.is_mismatch() and self.state.can_alert():
            self.state.mark_alerted()

            # Track when the wrong attempt started for escalation
            if self._wrong_attempt_time is None:
                self._wrong_attempt_time = time.time()

            logger.info(
                "Wrong medication: expected=%s, observed=%s",
                self.state.expected_color,
                self.state.observed_color,
            )
            return wrong_med_event(
                self.state.expected_color,
                self.state.observed_color,
            )

        # Check for escalation: wrong attempt not corrected after timeout
        if self._wrong_attempt_time and not self._escalated:
            elapsed = time.time() - self._wrong_attempt_time
            if elapsed >= self.ESCALATION_TIMEOUT:
                self._escalated = True
                logger.warning("Escalating: patient did not correct after %.0fs", elapsed)
                return escalated_event(
                    self.state.expected_color,
                    self.state.observed_color,
                )

        return None

    def set_expected_color(self, color: str) -> None:
        """Update expected medication (called when caregiver changes it)."""
        self.state.set_expected_color(color)
        self._wrong_attempt_time = None
        self._escalated = False

    def get_status(self) -> dict:
        """Get current engine status for dashboard."""
        return {
            **self.state.get_state(),
            "escalation_timeout": self.ESCALATION_TIMEOUT,
            "escalated": self._escalated,
        }
