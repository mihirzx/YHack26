import asyncio
import time

from dotenv import load_dotenv
import os

load_dotenv()

VIAM_API_KEY = os.getenv("VIAM_API_KEY")
VIAM_API_KEY_ID = os.getenv("VIAM_API_KEY_ID")

from viam.robot.client import RobotClient
from viam.components.camera import Camera
from viam.services.vision import VisionClient
from viam.services.mlmodel import MLModelClient
from viam.services.generic import Generic as GenericService

async def connect():
    opts = RobotClient.Options.with_api_key(

        api_key=VIAM_API_KEY,

        api_key_id=VIAM_API_KEY_ID
    )
    return await RobotClient.at_address('caresight-main.r756pbub7x.viam.cloud', opts)

async def main():
    async with await connect() as machine:

        red_vision_service = VisionClient.from_robot(machine, "color-detection-model-red")
        green_vision_service = VisionClient.from_robot(machine, "color-detection-model-green")
        yellow_vision_service = VisionClient.from_robot(machine, "color-detection-model-yellow")
        while True:
            time.sleep(1)
            green_classification = await green_vision_service.get_detections_from_camera(camera_name='camera')
            if len(green_classification) > 0:
                print(f"green_vision_service classify return value: {green_classification}")
            red_classification = await red_vision_service.get_detections_from_camera(camera_name='camera')
            if len(red_classification) > 0:
                print(f"red_vision_service classify return value: {red_classification}")
            yellow_classification = await yellow_vision_service.get_detections_from_camera(camera_name='camera')
            if len(yellow_classification) > 0:
                print(f"yellow_vision_service classify return value: {yellow_classification}")

if __name__ == '__main__':
    asyncio.run(main())
