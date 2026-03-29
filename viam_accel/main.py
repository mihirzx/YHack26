import asyncio

from viam.components.movement_sensor import MovementSensor
from viam.module.module import Module
from viam.resource.registry import Registry, ResourceCreatorRegistration

from arduino_accel import ArduinoAccelerometer


async def main():
    print("LOADING UPDATED MAIN.PY")
    print("REGISTERING MODEL:", ArduinoAccelerometer.MODEL)

    Registry.register_resource_creator(
        MovementSensor.API,
        ArduinoAccelerometer.MODEL,
        ResourceCreatorRegistration(
            ArduinoAccelerometer.new,
            ArduinoAccelerometer.validate_config,
        ),
    )

    module = Module.from_args()
    module.add_model_from_registry(
        MovementSensor.API,
        ArduinoAccelerometer.MODEL,
    )
    await module.start()


if __name__ == "__main__":
    asyncio.run(main())