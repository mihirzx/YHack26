"""
Test harness for the logic engine.
Run: python -m pytest tests/test_logic.py -v
  or: python tests/test_logic.py
"""

import sys
import os
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from caresight.logic.rules import RulesEngine


def test_correct_medication():
    """Patient takes the right color — no event."""
    engine = RulesEngine(expected_color="red")
    event = engine.process({
        "person_detected": True,
        "hand_detected": True,
        "detected_color": "red",
        "timestamp": time.time(),
    })
    assert event is None, f"Expected no event, got {event}"
    print("PASS: correct medication — no alert")


def test_wrong_medication():
    """Patient takes wrong color — should trigger wrong_med_attempt."""
    engine = RulesEngine(expected_color="red")
    event = engine.process({
        "person_detected": True,
        "hand_detected": True,
        "detected_color": "blue",
        "timestamp": time.time(),
    })
    assert event is not None, "Expected an event"
    assert event["type"] == "wrong_med_attempt"
    assert event["expected_color"] == "red"
    assert event["observed_color"] == "blue"
    assert event["severity"] == "medium"
    print("PASS: wrong medication detected")


def test_correction():
    """Patient corrects after wrong attempt."""
    engine = RulesEngine(expected_color="red")

    # First: wrong attempt
    engine.process({
        "person_detected": True,
        "hand_detected": True,
        "detected_color": "blue",
        "timestamp": time.time(),
    })

    # Then: patient switches to correct color
    event = engine.process({
        "person_detected": True,
        "hand_detected": True,
        "detected_color": "red",
        "timestamp": time.time(),
    })
    assert event is not None, "Expected correction event"
    assert event["type"] == "corrected"
    assert event["severity"] == "low"
    print("PASS: correction detected")


def test_no_hand_no_alert():
    """No hand detected — should not trigger anything."""
    engine = RulesEngine(expected_color="red")
    event = engine.process({
        "person_detected": True,
        "hand_detected": False,
        "detected_color": "blue",
        "timestamp": time.time(),
    })
    assert event is None, f"Expected no event, got {event}"
    print("PASS: no hand — no alert")


def test_no_person_no_alert():
    """No person detected — should not trigger anything."""
    engine = RulesEngine(expected_color="red")
    event = engine.process({
        "person_detected": False,
        "hand_detected": True,
        "detected_color": "blue",
        "timestamp": time.time(),
    })
    assert event is None, f"Expected no event, got {event}"
    print("PASS: no person — no alert")


def test_spam_prevention():
    """Rapid repeated detections should be debounced."""
    engine = RulesEngine(expected_color="red")
    # Override cooldown for testing
    engine.state.alert_cooldown_seconds = 10.0

    # First detection — should fire
    event1 = engine.process({
        "person_detected": True,
        "hand_detected": True,
        "detected_color": "blue",
        "timestamp": time.time(),
    })
    assert event1 is not None, "First alert should fire"

    # Immediate second detection — should be suppressed
    event2 = engine.process({
        "person_detected": True,
        "hand_detected": True,
        "detected_color": "blue",
        "timestamp": time.time(),
    })
    assert event2 is None, f"Second alert should be suppressed, got {event2}"
    print("PASS: spam prevention works")


def test_none_color():
    """Vision sends None for color — should not crash or alert."""
    engine = RulesEngine(expected_color="red")
    event = engine.process({
        "person_detected": True,
        "hand_detected": True,
        "detected_color": None,
        "timestamp": time.time(),
    })
    assert event is None, f"Expected no event for None color, got {event}"
    print("PASS: None color handled gracefully")


def test_invalid_input():
    """Vision sends garbage — should not crash."""
    engine = RulesEngine(expected_color="red")
    event = engine.process("not a dict")
    assert event is None, f"Expected no event for bad input, got {event}"
    print("PASS: invalid input handled gracefully")


if __name__ == "__main__":
    test_correct_medication()
    test_wrong_medication()
    test_correction()
    test_no_hand_no_alert()
    test_no_person_no_alert()
    test_spam_prevention()
    test_none_color()
    test_invalid_input()
    print("\n--- ALL TESTS PASSED ---")
