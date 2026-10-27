# Smart Library ESP8266 Firmware

## Architecture
ESP8266 + RC522 + OLED + buzzer -> Express API -> SQLite database.

The existing Express API is the source of truth. Firebase is not used.

## Configuration
Edit config.h:
- Set the 2.4 GHz Wi-Fi SSID and password.
- Keep API_BASE_URL pointed at the RHEL machine's current LAN IP.
- Replace placeholder RFID UIDs with actual card/tag UIDs.

## API operations
POST /api/operations/entry
POST /api/operations/exit
POST /api/operations/issue
POST /api/operations/return

JSON body example:
{"student_id":"STU001","book_id":"BK001"}

Entry and exit require student_id. Issue and return require both IDs.

## Hardware pin plan
RC522: SDA D4, SCK D5, MOSI D7, MISO D6, RST D3, 3.3V, GND.
OLED I2C: SCL D1, SDA D2.
Buzzer signal: D0.

Do not power the RC522 from 5V.

## Dependencies
Install these through Arduino IDE Library Manager:
- MFRC522
- Adafruit SSD1306
- Adafruit GFX Library
- ArduinoJson

Use the ESP8266 board package and select NodeMCU 1.0 (ESP-12E Module).

## Current status
This workspace contains configuration scaffolding only. Firmware must be added,
compiled, and tested when the actual RFID hardware and UID values are available.
