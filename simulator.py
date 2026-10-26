
import random
import time
import urllib.parse
import urllib.request
from datetime import date

CHANNEL_ID = "3551621"
WRITE_API_KEY = "KMNQMSD48WU1Z1JD"
CAPACITY = 100
UPLOAD_INTERVAL = 20

# Initial demo state. These values persist while the simulator runs.
occupancy = 28
entries_today = 85
issued_today = 14
returned_today = 10
year_visits = [17, 22, 25, 21]
current_day = date.today()

def reset_daily_counters():
    global entries_today, issued_today, returned_today, current_day

    today = date.today()
    if today != current_day:
        entries_today = 0
        issued_today = 0
        returned_today = 0
        current_day = today

def simulate_event():
    global occupancy, entries_today, issued_today, returned_today

    reset_daily_counters()

    # Entries are more likely during this demo.
    action = random.choices(
        ["entry", "exit", "issue", "return", "no_activity"],
        weights=[35, 25, 18, 12, 10],
        k=1,
    )[0]

    if action == "entry" and occupancy < CAPACITY:
        occupancy += 1
        entries_today += 1
        year_visits[random.randrange(4)] += 1

    elif action == "exit" and occupancy > 0:
        occupancy -= 1

    elif action == "issue":
        issued_today += 1

    elif action == "return":
        returned_today += 1

    return action

def upload():
    action = simulate_event()

    fields = {
        "api_key": WRITE_API_KEY,
        "field1": occupancy,
        "field2": entries_today,
        "field3": issued_today,
        "field4": returned_today,
        "field5": year_visits[0],
        "field6": year_visits[1],
        "field7": year_visits[2],
        "field8": year_visits[3],
    }

    url = (
        f"https://api.thingspeak.com/update?"
        f"{urllib.parse.urlencode(fields)}"
    )

    try:
        with urllib.request.urlopen(url, timeout=15) as response:
            result = response.read().decode().strip()

        if result and result != "0":
            print(
                f"Entry {result} | Event: {action} | "
                f"Occupancy: {occupancy}/{CAPACITY} | "
                f"Visits today: {entries_today} | "
                f"Issued: {issued_today} | Returned: {returned_today}"
            )
        else:
            print("Upload rejected. Check the API key or rate limit.")

    except Exception as error:
        print("Upload failed:", error)

if __name__ == "__main__":
    print("Smart Library event simulator started. Press Ctrl+C to stop.")

    while True:
        upload()
        time.sleep(UPLOAD_INTERVAL)
