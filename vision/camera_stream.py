import asyncio
import json
import time
from datetime import datetime

from dotenv import load_dotenv
import os

VIAM_API_KEY = os.getenv("VIAM_API_KEY")
VIAM_API_KEY_ID = os.getenv("VIAM_API_KEY_ID")
VIAM_ADDRESS = os.getenv("VIAM_ADDRESS", "caresight-main.r756pbub7x.viam.cloud")

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "..", "camera_output.json")

from viam.robot.client import RobotClient
from viam.components.camera import Camera
from viam.services.vision import VisionClient
from viam.services.mlmodel import MLModelClient
from viam.services.generic import Generic as GenericService


def write_detection(color, detection=None):
    """Write current detection state to camera_output.json."""
    bbox = None
    if detection is not None:
        bbox = {
            "x_min": detection.x_min,
            "y_min": detection.y_min,
            "x_max": detection.x_max,
            "y_max": detection.y_max,
        }

    data = {
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "detected_color": color,
        "hand_detected": color is not None,
        "bounding_box": bbox,
    }

    with open(OUTPUT_FILE, "w") as f:
        json.dump(data, f, indent=2)


async def connect():
    opts = RobotClient.Options.with_api_key(

        api_key=VIAM_API_KEY,

        api_key_id=VIAM_API_KEY_ID:
    )
    return await RobotClient.at_address(VIAM_ADDRESS, opts)

async def main():
    async with await connect() as machine:

        red_vision_service = VisionClient.from_robot(machine, "color-detection-model-red")
        green_vision_service = VisionClient.from_robot(machine, "color-detection-model-green")
        yellow_vision_service = VisionClient.from_robot(machine, "color-detection-model-yellow")
        while True:
            time.sleep(1)

            best_color = None
            best_confidence = 0.0
            best_detection = None

            green_classification = await green_vision_service.get_detections_from_camera(camera_name='camera')
            if len(green_classification) > 0:
                print(f"green_vision_service classify return value: {green_classification}")
                for det in green_classification:
                    if getattr(det, "confidence", 0) > best_confidence:
                        best_confidence = det.confidence
                        best_color = "green"
                        best_detection = det

            red_classification = await red_vision_service.get_detections_from_camera(camera_name='camera')
            if len(red_classification) > 0:
                print(f"red_vision_service classify return value: {red_classification}")
                for det in red_classification:
                    if getattr(det, "confidence", 0) > best_confidence:
                        best_confidence = det.confidence
                        best_color = "red"
                        best_detection = det

            yellow_classification = await yellow_vision_service.get_detections_from_camera(camera_name='camera')
            if len(yellow_classification) > 0:
                print(f"yellow_vision_service classify return value: {yellow_classification}")
                for det in yellow_classification:
                    if getattr(det, "confidence", 0) > best_confidence:
                        best_confidence = det.confidence
                        best_color = "yellow"
                        best_detection = det

            write_detection(best_color, best_detection)

if __name__ == '__main__':
    asyncio.run(main())
