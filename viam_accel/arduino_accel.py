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
    def new(
        cls,
        config,
        dependencies,
    ) -> "ArduinoAccelerometer":
        sensor = cls(config.name)

        attributes = config.attributes if hasattr(config, "attributes") else {}
        port = attributes.get("port", "/dev/cu.usbmodemB43A45B362F82")
        baud_rate = int(attributes.get("baud_rate", 115200))
        timeout = float(attributes.get("timeout", 1.0))

        sensor.ser = serial.Serial(port, baud_rate, timeout=timeout)
        return sensor

    @classmethod
    def validate_config(cls, config) -> list[str]:
        return []

    def _read_serial_line(self) -> None:
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
            # Skip malformed lines such as startup text
            return

    async def get_linear_acceleration(
        self,
        extra: Optional[Mapping[str, Any]] = None,
        **kwargs,
    ) -> Vector3:
        self._read_serial_line()
        return self.latest_accel

    async def get_angular_velocity(
        self,
        extra: Optional[Mapping[str, Any]] = None,
        **kwargs,
    ) -> Vector3:
        self._read_serial_line()
        return self.latest_gyro

    async def get_properties(
        self,
        extra: Optional[Mapping[str, Any]] = None,
        **kwargs,
    ) -> MovementSensor.Properties:
        return MovementSensor.Properties(
            linear_acceleration_supported=True,
            angular_velocity_supported=True,
        )

    async def close(self) -> None:
        if self.ser is not None and self.ser.is_open:
            self.ser.close()