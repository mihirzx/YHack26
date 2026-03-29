import json
import time
import serial

PORT = "/dev/cu.usbmodemB43A45B362F82"
BAUD = 115200
OUTFILE = "imu_output.json"

ser = serial.Serial(PORT, BAUD, timeout=1)
time.sleep(2)

print(f"Reading IMU from {PORT} at {BAUD} baud")

while True:
    line = ser.readline().decode("utf-8", errors="ignore").strip()
    if not line:
        continue

    try:
        ax, ay, az, gx, gy, gz = map(float, line.split(","))

        payload = {
            "timestamp": time.time(),
            "ax": ax,
            "ay": ay,
            "az": az,
            "gx": gx,
            "gy": gy,
            "gz": gz,
        }

        with open(OUTFILE, "w") as f:
            json.dump(payload, f)

        print(payload)

    except Exception as e:
        print("Parse error:", e, "raw:", line)