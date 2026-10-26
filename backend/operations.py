import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from contextlib import redirect_stdout
from io import StringIO

from database import initialize_database
from library_service import record_event

def main():
    if len(sys.argv) != 2:
        raise ValueError("Expected one JSON argument.")

    payload = json.loads(sys.argv[1])
    event_type = payload.get("event_type")
    student_id = payload.get("student_id")
    book_id = payload.get("book_id")

    if not isinstance(student_id, str) or not student_id.strip():
        raise ValueError("A valid student ID is required.")

    if event_type not in {"entry", "exit", "issue", "return"}:
        raise ValueError("Event must be entry, exit, issue, or return.")

    if event_type in {"issue", "return"}:
        if not isinstance(book_id, str) or not book_id.strip():
            raise ValueError("A valid book ID is required.")

    # Keep initialization and service messages out of the JSON response.
    with redirect_stdout(StringIO()):
        initialize_database()
        record_event(event_type, student_id.strip(), book_id)

    print(json.dumps({
        "success": True,
        "message": f"{event_type.capitalize()} recorded successfully.",
    }))

if __name__ == "__main__":
    try:
        main()
    except (ValueError, json.JSONDecodeError) as error:
        print(json.dumps({"error": str(error)}))
        sys.exit(2)
    except Exception:
        print(json.dumps({"error": "Operation failed. Check the backend logs."}))
        sys.exit(1)
