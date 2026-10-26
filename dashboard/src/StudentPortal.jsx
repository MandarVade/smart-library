import { useState } from "react";

export default function StudentPortal({ students, books, events }) {
  const [studentId, setStudentId] = useState("STU001");

  const student = students.find((item) => item.student_id === studentId);

  const activity = events.filter(
    (event) => event.student_id === studentId
  );

  const issuedBookIds = new Set();

  for (const event of [...activity].reverse()) {
    if (event.event_type === "issue") {
      issuedBookIds.add(event.book_id);
    } else if (event.event_type === "return") {
      issuedBookIds.delete(event.book_id);
    }
  }

  const borrowedBooks = books.filter((book) =>
    issuedBookIds.has(book.book_id)
  );

  return (
    <section className="library-data-section">
      <div className="section-heading">
        <h2>Student Portal</h2>
        <p>View book availability and recorded library activity.</p>
      </div>

      <div className="operation-form">
        <label>
          Select student
          <select
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
          >
            {students.map((item) => (
              <option key={item.student_id} value={item.student_id}>
                {item.student_id} — {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {student && (
        <div className="stats-grid">
          <article className="stat-card">
            <h3>{student.name}</h3>
            <p>{student.student_id}</p>
            <p>Year {student.academic_year} · {student.branch}</p>
            <p>Roll number: {student.roll_number}</p>
          </article>

          <article className="stat-card">
            <h3>Books currently borrowed</h3>
            <p>{borrowedBooks.length}</p>
          </article>

          <article className="stat-card">
            <h3>Recorded activity</h3>
            <p>{activity.length} events</p>
          </article>
        </div>
      )}

      <div className="library-tables-grid">
        <div className="panel">
          <h3>Book Inventory</h3>
          <div className="table-scroll">
            <table className="library-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Author</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.book_id}>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>
                      {book.available === 1 ? "Available" : "Issued"}
                    </td>
                  </tr>
                ))}
                {!books.length && (
                  <tr><td colSpan="3">No books available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h3>My Borrowed Books</h3>
          {borrowedBooks.length ? (
            borrowedBooks.map((book) => (
              <p key={book.book_id}>{book.title} ({book.book_id})</p>
            ))
          ) : (
            <p>No books currently recorded as borrowed.</p>
          )}
        </div>

        <div className="panel">
          <h3>My Recent Activity</h3>
          <div className="table-scroll">
            <table className="library-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Activity</th>
                  <th>Book</th>
                </tr>
              </thead>
              <tbody>
                {activity.slice(0, 10).map((event) => (
                  <tr key={event.id}>
                    <td>{new Date(event.timestamp).toLocaleString("en-IN")}</td>
                    <td>{event.event_type}</td>
                    <td>{event.book_title || "—"}</td>
                  </tr>
                ))}
                {!activity.length && (
                  <tr><td colSpan="3">No activity recorded.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
