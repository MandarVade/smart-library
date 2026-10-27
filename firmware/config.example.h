#pragma once

// Wi-Fi: use a 2.4 GHz network supported by ESP8266.
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// RHEL machine LAN address; do not use localhost.
#define API_BASE_URL "http://192.168.1.10:3001"

// Replace these examples with the actual RFID UIDs.
struct RfidMapping {
  const char* uid;
  const char* recordId;
};

const RfidMapping STUDENT_MAPPINGS[] = {
  {"REPLACE_WITH_STUDENT_UID_1", "STU001"},
  {"REPLACE_WITH_STUDENT_UID_2", "STU002"},
  {"REPLACE_WITH_STUDENT_UID_3", "STU003"},
  {"REPLACE_WITH_STUDENT_UID_4", "STU004"}
};

const RfidMapping BOOK_MAPPINGS[] = {
  {"REPLACE_WITH_BOOK_UID_1", "BK001"},
  {"REPLACE_WITH_BOOK_UID_2", "BK002"},
  {"REPLACE_WITH_BOOK_UID_3", "BK003"},
  {"REPLACE_WITH_BOOK_UID_4", "BK004"},
  {"REPLACE_WITH_BOOK_UID_5", "BK005"}
};

constexpr unsigned long BOOK_SCAN_TIMEOUT_MS = 15000;
