
const express = require("express");
const cors = require("cors");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const app = express();
const PORT = 3001;
const PROJECT_DIR = path.resolve(__dirname, "..");
const DB_PATH = path.join(PROJECT_DIR, "database", "library.db");

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

function queryDatabase(sql, params = []) {
  const script = `
import sqlite3, json, sys
db, query, params = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
conn = sqlite3.connect(db)
conn.row_factory = sqlite3.Row
rows = conn.execute(query, params).fetchall()
print(json.dumps([dict(row) for row in rows]))
conn.close()
`;

  const result = spawnSync(
    "python3",
    ["-c", script, DB_PATH, sql, JSON.stringify(params)],
    { encoding: "utf8" }
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || "Database query failed");
  }

  return JSON.parse(result.stdout);
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Smart Library API" });
});

app.get("/api/students", (req, res) => {
  try {
    res.json(queryDatabase(
      "SELECT student_id, name, academic_year, branch, roll_number FROM students ORDER BY name"
    ));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/books", (req, res) => {
  try {
    res.json(queryDatabase(
      "SELECT book_id, title, author, available FROM books ORDER BY title"
    ));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/events", (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    res.json(queryDatabase(`
      SELECT e.id, e.student_id, s.name AS student_name,
             s.academic_year, s.branch, e.book_id, b.title AS book_title,
             e.event_type, e.timestamp, e.due_date
      FROM events e
      LEFT JOIN students s ON s.student_id = e.student_id
      LEFT JOIN books b ON b.book_id = e.book_id
      ORDER BY e.id DESC
      LIMIT ?
    `, [limit]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/overdue", (req, res) => {
  try {
    res.json(queryDatabase(`
      SELECT e.student_id, s.name AS student_name,
             s.branch, s.academic_year, e.book_id,
             b.title AS book_title, e.due_date
      FROM events e
      JOIN students s ON s.student_id = e.student_id
      JOIN books b ON b.book_id = e.book_id
      WHERE e.event_type = 'issue'
        AND e.due_date < date('now')
        AND NOT EXISTS (
          SELECT 1 FROM events r
          WHERE r.book_id = e.book_id
            AND r.event_type = 'return'
            AND r.id > e.id
        )
      ORDER BY e.due_date
    `));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get("/api/analytics/daily", (req, res) => {
  try {
    const rows = queryDatabase(`
      SELECT
  date(e.timestamp, '+5 hours', '+30 minutes') AS day,
  COUNT(CASE WHEN e.event_type = 'entry' THEN 1 END) AS entries,
  COUNT(CASE WHEN e.event_type = 'exit' THEN 1 END) AS exits,
  COUNT(CASE WHEN e.event_type = 'issue' THEN 1 END) AS issues,
  COUNT(CASE WHEN e.event_type = 'return' THEN 1 END) AS returns
FROM events e
WHERE date(e.timestamp, '+5 hours', '+30 minutes')
      >= date('now', '+5 hours', '+30 minutes', '-29 days')
GROUP BY date(e.timestamp, '+5 hours', '+30 minutes')
ORDER BY day
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/analytics/hourly", (req, res) => {
  try {
    const rows = queryDatabase(`
      SELECT
  strftime('%H', e.timestamp, '+5 hours', '+30 minutes') AS hour,
  COUNT(*) AS entries
FROM events e
WHERE e.event_type = 'entry'
  AND date(e.timestamp) >= date('now', '-6 days')
GROUP BY strftime('%H', e.timestamp, '+5 hours', '+30 minutes')
ORDER BY hour
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/analytics/students", (req, res) => {
  try {
    const rows = queryDatabase(`
      SELECT
        s.student_id,
        s.name,
        s.academic_year,
        COUNT(CASE WHEN e.event_type = 'entry' THEN 1 END) AS entries,
        COUNT(CASE WHEN e.event_type = 'issue' THEN 1 END) AS books_issued,
        COUNT(CASE WHEN e.event_type = 'return' THEN 1 END) AS books_returned
      FROM students s
      LEFT JOIN events e ON s.student_id = e.student_id
      GROUP BY s.student_id, s.name, s.academic_year
      ORDER BY entries DESC, s.name
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/analytics/books", (req, res) => {
  try {
    const rows = queryDatabase(`
      SELECT
        b.book_id,
        b.title,
        b.author,
        b.available,
        COUNT(CASE WHEN e.event_type = 'issue' THEN 1 END) AS total_issues,
        COUNT(CASE WHEN e.event_type = 'return' THEN 1 END) AS total_returns
      FROM books b
      LEFT JOIN events e ON b.book_id = e.book_id
      GROUP BY b.book_id, b.title, b.author, b.available
      ORDER BY total_issues DESC, b.title
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/analytics/summary", (req, res) => {
  try {
    const summary = queryDatabase(`
      SELECT
        COUNT(CASE WHEN event_type = 'entry' THEN 1 END) AS entries,
        COUNT(CASE WHEN event_type = 'exit' THEN 1 END) AS exits,
        COUNT(CASE WHEN event_type = 'issue' THEN 1 END) AS issues,
        COUNT(CASE WHEN event_type = 'return' THEN 1 END) AS returns
      FROM events
    `)[0];

    const byYear = queryDatabase(`
      SELECT s.academic_year, COUNT(*) AS visits
      FROM events e
      JOIN students s ON s.student_id = e.student_id
      WHERE e.event_type = 'entry'
      GROUP BY s.academic_year
      ORDER BY s.academic_year
    `);

    res.json({ ...summary, byYear });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/analytics/occupancy", (req, res) => {
  try {
    const rows = queryDatabase(`
      SELECT
        s.student_id,
        s.name,
        s.academic_year,
        latest.timestamp AS entry_time
      FROM students s
      JOIN events latest
        ON latest.student_id = s.student_id
      WHERE latest.event_type IN ('entry', 'exit')
        AND NOT EXISTS (
          SELECT 1
          FROM events newer
          WHERE newer.student_id = latest.student_id
            AND newer.event_type IN ('entry', 'exit')
            AND newer.id > latest.id
        )
        AND latest.event_type = 'entry'
      ORDER BY s.name
    `);

    res.json({
      currentOccupancy: rows.length,
      students: rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/operations/:eventType", (req, res) => {
  const eventType = req.params.eventType;
  const allowedEvents = new Set(["entry", "exit", "issue", "return"]);

  if (!allowedEvents.has(eventType)) {
    return res.status(400).json({
      error: "Event must be entry, exit, issue, or return."
    });
  }

  const { student_id, book_id } = req.body || {};

  if (typeof student_id !== "string" || !student_id.trim()) {
    return res.status(400).json({ error: "A valid student ID is required." });
  }

  if (
    ["issue", "return"].includes(eventType) &&
    (typeof book_id !== "string" || !book_id.trim())
  ) {
    return res.status(400).json({ error: "A valid book ID is required." });
  }

  const payload = JSON.stringify({
    event_type: eventType,
    student_id: student_id.trim(),
    book_id: typeof book_id === "string" ? book_id.trim() : null
  });

  const result = spawnSync(
    "python3",
    [path.join(PROJECT_DIR, "backend", "operations.py"), payload],
    { encoding: "utf8" }
  );

  let responseData;

  try {
    responseData = JSON.parse(result.stdout);
  } catch {
    console.error("Python operation failed:", result.stderr || result.stdout);
    return res.status(500).json({ error: "Unable to process library operation." });
  }

  if (result.status !== 0) {
    const statusCode = result.status === 2 ? 400 : 500;
    return res.status(statusCode).json(responseData);
  }

  return res.status(200).json(responseData);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Smart Library API running at http://localhost:${PORT}`);
});
