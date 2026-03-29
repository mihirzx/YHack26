from __future__ import annotations

import serial
from typing import Any, ClassVar, Mapping, Optional

from viam.components.movement_sensor import MovementSensor
from viam.proto.common import Vector3
from viam.resource.base import ResourceBase
from viam.resource.types import Model, ModelFamily


class ArduinoAccelerometer(MovementSensor, ResourceBase):
    MODEL: ClassVar[Model] = Model(
        ModelFamily("yhack", "movementsensor"),
        "arduino_accel",
    )

    def __init__(self, name: str):
        super().__init__(name)
        self.ser: Optional[serial.Serial] = None
        self.latest_accel = Vector3(x=0.0, y=0.0, z=0.0)
        self.latest_gyro = Vector3(x=0.0, y=0.0, z=0.0)

    @classmethod
    def new(cls, config, dependencies):
        sensor = cls(config.name)

        attributes = config.attributes if hasattr(config, "attributes") else {}
        port = attributes.get("port", "/dev/cu.usbmodemB43A45B362F82")
        baud_rate = int(attributes.get("baud_rate", 115200))
        timeout = float(attributes.get("timeout", 1.0))

        sensor.ser = serial.Serial(port, baud_rate, timeout=timeout)
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
        except ValueError:
            pass

    async def get_linear_acceleration(self, extra=None, **kwargs) -> Vector3:
        self._read_serial_line()
        return self.latest_accel

    async def get_angular_velocity(self, extra=None, **kwargs) -> Vector3:
        self._read_serial_line()
        return self.latest_gyro

    async def get_orientation(self, extra=None, **kwargs):
        return None

    async def get_position(self, extra=None, **kwargs):
        return None

    async def get_linear_velocity(self, extra=None, **kwargs):
        return None

    async def get_compass_heading(self, extra=None, **kwargs):
        return None

    async def get_accuracy(self, extra=None, **kwargs):
        return None

    async def get_properties(self, extra=None, **kwargs):
        return MovementSensor.Properties(
            linear_acceleration_supported=True,
            angular_velocity_supported=True,
        )

    async def close(self):
        if self.ser is not None and self.ser.is_open:
            self.ser.close()