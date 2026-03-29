"""
Event generation for CareSight.

Creates structured event dicts that get sent to the backend
for logging, voice intervention, and dashboard updates.

Event types: wrong_med_attempt, corrected, escalated
"""

import time
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Auto-incrementing event counter
_event_counter = 0


def _next_event_id() -> str:
    """Generate a sequential event ID."""
    global _event_counter
    _event_counter += 1
    return f"evt_{_event_counter:03d}"


def create_event(
    event_type: str,
    expected_color: str,
    observed_color: str,
    severity: str = "medium",
) -> dict:
    """Create a structured event dict.

    Args:
        event_type: one of 'wrong_med_attempt', 'corrected', 'escalated'
        expected_color: what the patient should take
        observed_color: what the patient reached for
        severity: 'low', 'medium', or 'high'

    Returns:
        Event dict matching the project schema.

    Usage:
        event = create_event("wrong_med_attempt", "red", "blue")
    """
    valid_types = {"wrong_med_attempt", "corrected", "escalated"}
    if event_type not in valid_types:
        logger.warning("Unknown event type: %s", event_type)

    valid_severities = {"low", "medium", "high"}
    if severity not in valid_severities:
        logger.warning("Unknown severity: %s, defaulting to medium", severity)
        severity = "medium"

    return {
        # 'event_id' omitted; backend will assign
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "type": event_type,
        "expected": expected_color,
        "observed": observed_color,
        "corrected": event_type == "corrected",
        "severity": severity,
    }


def wrong_med_event(expected: str, observed: str) -> dict:
    """Shortcut: patient reached for wrong medication."""
    return create_event("wrong_med_attempt", expected, observed, severity="medium")


def corrected_event(expected: str, observed: str) -> dict:
    """Shortcut: patient corrected to the right medication."""
    return create_event("corrected", expected, observed, severity="low")


def escalated_event(expected: str, observed: str) -> dict:
    """Shortcut: patient ignored correction, escalating."""
    return create_event("escalated", expected, observed, severity="high")
