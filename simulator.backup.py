
import random
import time
import urllib.parse
import urllib.request

CHANNEL_ID = "3551621"
WRITE_API_KEY = "KMNQMSD48WU1Z1JD"

occupancy = 25
entries_today = 80
issued_today = 12
returned_today = 7

year_visits = [15, 20, 25, 20]

def upload():
    global occupancy, entries_today, issued_today, returned_today

    action = random.choice(["entry", "entry", "exit", "issue", "return"])

    if action == "entry":
        occupancy = min(occupancy + 1, 100)
        entries_today += 1
        year_visits[random.randrange(4)] += 1
    elif action == "exit":
        occupancy = max(occupancy - 1, 0)
    elif action == "issue":
        issued_today += 1
    elif action == "return":
        returned_today += 1

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
        "https://api.thingspeak.com/update?"
        + urllib.parse.urlencode(fields)
    )

    try:
        with urllib.request.urlopen(url, timeout=15) as response:
            result = response.read().decode().strip()

        if result and result != "0":
            print(
                f"Entry {result}: action={action}, "
                f"occupancy={occupancy}, entries={entries_today}, "
                f"issued={issued_today}, returned={returned_today}"
            )
        else:
            print("Update rejected. Check the API key or rate limit.")

    except Exception as error:
        print("Upload failed:", error)


if __name__ == "__main__":
    print("Library simulator running. Press Ctrl+C to stop.")

    while True:
        upload()
        time.sleep(20)
