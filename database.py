
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "database" / "library.db"


def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.executescript("""
            CREATE TABLE IF NOT EXISTS students (
                student_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                academic_year INTEGER NOT NULL,
                branch TEXT NOT NULL,
                roll_number TEXT NOT NULL UNIQUE
            );

            CREATE TABLE IF NOT EXISTS books (
                book_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                author TEXT,
                available INTEGER NOT NULL DEFAULT 1
                    CHECK (available IN (0, 1))
            );

            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT,
                book_id TEXT,
                event_type TEXT NOT NULL CHECK (
                    event_type IN (
                        'entry', 'exit', 'issue', 'return'
                    )
                ),
                timestamp TEXT NOT NULL DEFAULT (
                    strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
                ),
                due_date TEXT,
                FOREIGN KEY (student_id)
                    REFERENCES students(student_id),
                FOREIGN KEY (book_id)
                    REFERENCES books(book_id)
            );

            CREATE INDEX IF NOT EXISTS idx_events_timestamp
                ON events(timestamp);

            CREATE INDEX IF NOT EXISTS idx_events_student
                ON events(student_id);

            CREATE INDEX IF NOT EXISTS idx_events_book
                ON events(book_id);
        """)

    print(f"Database initialized: {DB_PATH}")


if __name__ == "__main__":
    initialize_database()
