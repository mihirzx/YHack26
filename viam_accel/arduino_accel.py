print("VERSION CHECK: NEW FILE LOADED")

import serial
from typing import ClassVar

from viam.components.movement_sensor import MovementSensor
from viam.proto.common import GeoPoint, Vector3
from viam.proto.component.movementsensor import GetAccuracyResponse
from viam.resource.base import ResourceBase
from viam.resource.types import Model, ModelFamily


class ArduinoAccelerometer(MovementSensor, ResourceBase):
    MODEL: ClassVar[Model] = Model(
        ModelFamily("yhack", "movementsensor"),
        "arduino_accel",
    )

    def __init__(self, name: str):
        print("ENTERING __init__ WITH NAME:", name)

        super().__init__(name)

        self.ser = None
        self.latest_accel = Vector3(x=0.0, y=0.0, z=0.0)
        self.latest_gyro = Vector3(x=0.0, y=0.0, z=0.0)

        print("EXITED __init__")

    @classmethod
    def new(cls, config, dependencies):
        print("USING FINAL ArduinoAccelerometer.new()")
        print("CONFIG OBJECT TYPE:", type(config))
        print("ABOUT TO READ CONFIG NAME")

        try:
            cfg_name = config.name
            print("CONFIG NAME:", cfg_name)
        except Exception as e:
            print("FAILED READING config.name:", repr(e))
            cfg_name = "arduino-imu"

        print("ABOUT TO CONSTRUCT SENSOR")
        sensor = cls("arduino-imu")
        print("SENSOR CONSTRUCTED")

        port = "/dev/cu.usbmodemB43A45B362F82"
        baud_rate = 115200
        timeout = 1.0

        print("OPENING SERIAL PORT:", port)
        sensor.ser = serial.Serial(port, baud_rate, timeout=timeout)
        print("SERIAL OPENED")

        return sensor

    @classmethod
    def validate_config(cls, config):
        return []

    def _read_serial_line(self):
        if self.ser is None:
            return

        line = self.ser.readline().decode("utf-8", errors="ignore").strip()
        if not line:
            return

        try:
            ax, ay, az, gx, gy, gz = map(float, line.split(","))
            self.latest_accel = Vector3(x=ax, y=ay, z=az)
            self.latest_gyro = Vector3(x=gx, y=gy, z=gz)
        except Exception as e:
            print("PARSE ERROR:", e)
            print("RAW LINE:", line)

    async def get_linear_acceleration(self, extra=None, timeout=None, **kwargs):
        self._read_serial_line()
        return self.latest_accel

    async def get_angular_velocity(self, extra=None, timeout=None, **kwargs):
        self._read_serial_line()
        return self.latest_gyro

    async def get_orientation(self, extra=None, timeout=None, **kwargs):
        return None

    async def get_position(self, extra=None, timeout=None, **kwargs):
        return GeoPoint(latitude=0.0, longitude=0.0), 0.0

    async def get_linear_velocity(self, extra=None, timeout=None, **kwargs):
        return Vector3(x=0.0, y=0.0, z=0.0)

    async def get_compass_heading(self, extra=None, timeout=None, **kwargs):
        return 0.0

    async def get_accuracy(self, extra=None, timeout=None, **kwargs):
        return GetAccuracyResponse()

    async def get_properties(self, extra=None, timeout=None, **kwargs):
        return MovementSensor.Properties(
            linear_acceleration_supported=True,
            angular_velocity_supported=True,
            orientation_supported=False,
            position_supported=False,
            compass_heading_supported=False,
            linear_velocity_supported=False,
        )

    async def close(self):
        if self.ser is not None and self.ser.is_open:
            self.ser.close()