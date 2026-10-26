
import { useEffect, useState } from "react";
import "./App.css";

const CHANNEL_ID = "3551621";
const READ_API_KEY = "KMNQMSD48WU1Z1JD";

const demoData = {
  occupancy: 25,
  entries: 80,
  issued: 12,
  returned: 7,
  years: [15, 20, 25, 20],
};

const initialHours = [
  { label: "8 AM", value: 12 },
  { label: "9 AM", value: 22 },
  { label: "10 AM", value: 18 },
  { label: "11 AM", value: 45 },
  { label: "12 PM", value: 78 },
  { label: "1 PM", value: 65 },
  { label: "2 PM", value: 32 },
];

const yearNames = ["First Year", "Second Year", "Third Year", "Fourth Year"];

function StatCard({ title, value, detail, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail">{detail}</div>
    </div>
  );
}

function BarChart({ data, color = "blue" }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="bar-chart">
      {data.map((item) => (
        <div className="bar-item" key={item.label}>
          <div className="bar-track">
            <div
              className={`bar-fill ${color}`}
              style={{
                height: `${Math.max((item.value / max) * 100, 3)}%`,
              }}
              title={`${item.label}: ${item.value}`}
            />
          </div>
          <span className="bar-label">{item.label}</span>
          <span className="bar-number">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [view, setView] = useState("admin");
  const [data, setData] = useState(demoData);
  const [loading, setLoading] = useState(true);
  const [hourlyData, setHourlyData] = useState([]);
  const [historyStatus, setHistoryStatus] = useState("Loading history");
  const [cloudStatus, setCloudStatus] = useState("Connecting");
  const [lastUpdated, setLastUpdated] = useState(null);

  async function fetchHistory() {
    try {
      const params = new URLSearchParams({ results: "100" });

      if (READ_API_KEY.trim()) {
        params.set("api_key", READ_API_KEY.trim());
      }

      const response = await fetch(
        `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?${params}`
      );

      if (!response.ok) {
        throw new Error("History request failed");
      }

      const result = await response.json();

      const feeds = (result.feeds || []).filter(
        (feed) => feed.created_at && feed.field1 !== null
      );

      const groups = {};

      feeds.forEach((feed) => {
        const date = new Date(feed.created_at);
        const hour = date.getHours();
        const label = date.toLocaleTimeString([], {
          hour: "numeric",
          hour12: true,
        });

        if (!groups[hour]) {
          groups[hour] = {
            label,
            total: 0,
            count: 0,
          };
        }

        groups[hour].total += Number(feed.field1) || 0;
        groups[hour].count += 1;
      });

      const hourly = Object.entries(groups)
        .map(([hour, group]) => ({
          hour: Number(hour),
          label: group.label,
          value: Math.round(group.total / group.count),
        }))
        .sort((a, b) => a.hour - b.hour)
        .map(({ label, value }) => ({ label, value }));

      setHourlyData(hourly);
      setHistoryStatus(
        hourly.length ? `${feeds.length} records loaded` : "No history yet"
      );
    } catch {
      setHistoryStatus("History unavailable");
    }
  }
  async function fetchThingSpeak() {
    try {
      const params = new URLSearchParams();

      if (READ_API_KEY.trim()) {
        params.set("api_key", READ_API_KEY.trim());
      }

      const suffix = params.toString() ? `?${params.toString()}` : "";
      const response = await fetch(
        `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds/last.json${suffix}`
      );

      if (!response.ok) {
        throw new Error("ThingSpeak request failed");
      }

      const feed = await response.json();

      if (!feed.created_at || feed.field1 == null) {
        throw new Error("No channel data available");
      }

      const number = (value, fallback) => {
        const parsed = Number(value);
        return value != null && value !== "" && Number.isFinite(parsed)
          ? parsed
          : fallback;
      };

      setData({
        occupancy: number(feed.field1, demoData.occupancy),
        entries: number(feed.field2, demoData.entries),
        issued: number(feed.field3, demoData.issued),
        returned: number(feed.field4, demoData.returned),
        years: [
          number(feed.field5, demoData.years[0]),
          number(feed.field6, demoData.years[1]),
          number(feed.field7, demoData.years[2]),
          number(feed.field8, demoData.years[3]),
        ],
      });

      setCloudStatus("Connected");
      setLastUpdated(new Date(feed.created_at));
    } catch {
      setCloudStatus("Demo mode");
      setLastUpdated(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchThingSpeak();
    fetchHistory();

    const timer = setInterval(() => {
      fetchThingSpeak();
      fetchHistory();
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const capacity = 100;
  const occupancyPercent = Math.min(
    Math.round((data.occupancy / capacity) * 100),
    100
  );

  const yearData = yearNames.map((label, index) => ({
    label,
    value: data.years[index],
  }));

  const totalYearVisits = data.years.reduce((sum, value) => sum + value, 0);

  const totalTransactions = data.issued + data.returned;

  const formatTime = (date) =>
    date
      ? date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
      : "Using sample data";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">SL</div>
          <div>
            <strong>Smart Library</strong>
            <span>IoE Management System</span>
          </div>
        </div>

        <div className="side-label">WORKSPACE</div>

        <button className="nav-item active">
          <span>▦</span> Dashboard
        </button>
        <button className="nav-item" onClick={() => setView("student")}>
          <span>♙</span> Student Portal
        </button>
        <button className="nav-item" onClick={() => setView("admin")}>
          <span>▤</span> Analytics & Reports
        </button>

        <div className="sidebar-bottom">
          <div className="cloud-card">
            <div className="cloud-title">
              <span className="status-dot" />
              ThingSpeak Cloud
            </div>
            <strong>{cloudStatus}</strong>
            <p>
              {lastUpdated
                ? `Last entry: ${formatTime(lastUpdated)}`
                : "Previewing sample data"}
            </p>
            <button className="refresh-button" onClick={fetchThingSpeak}>
              ↻ Refresh data
            </button>
          </div>
          <div className="profile">
            <div className="avatar">SL</div>
            <div>
              <strong>Library System</strong>
              <span>Project dashboard</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="breadcrumb">Workspace / Dashboard</div>
            <h1>Library Overview</h1>
            <p className="subtitle">
              Monitor occupancy, book activity and library utilization.
            </p>
          </div>

          <div className="top-actions">
            <span className="cloud-badge">
              <span className="status-dot" />
              {cloudStatus}
            </span>
            <button
              className="primary-button"
              onClick={fetchThingSpeak}
              disabled={loading}
            >
              ↻ {loading ? "Loading..." : "Sync data"}
            </button>
          </div>
        </header>

        <div className="view-switch">
          <button
            className={view === "admin" ? "switch-active" : ""}
            onClick={() => setView("admin")}
          >
            Admin Dashboard
          </button>
          <button
            className={view === "student" ? "switch-active" : ""}
            onClick={() => setView("student")}
          >
            Student Dashboard
          </button>
        </div>

        {view === "admin" ? (
          <>
            <section className="welcome-row">
              <div>
                <h2>Library analytics</h2>
                <p>Insights to support better resource management.</p>
              </div>
              <span className="date-chip">
                <span className="status-dot" />
                Live channel monitoring
              </span>
            </section>

            <section className="stats-grid">
              <StatCard
                title="Current Occupancy"
                value={`${data.occupancy}`}
                detail={`${occupancyPercent}% of assumed capacity`}
                icon="♙"
              />
              <StatCard
                title="Entries Recorded"
                value={data.entries.toLocaleString()}
                detail="Reported by ThingSpeak"
                icon="↗"
              />
              <StatCard
                title="Books Issued"
                value={data.issued}
                detail="Latest channel counter"
                icon="▤"
              />
              <StatCard
                title="Books Returned"
                value={data.returned}
                detail="Latest channel counter"
                icon="↩"
              />
            </section>

            <section className="charts-grid">
              <div className="panel occupancy-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Current library occupancy</h3>
                    <p>Estimated utilization against configured capacity</p>
                  </div>
                  <span className="tag">Live</span>
                </div>

                <div className="occupancy-content">
                  <div
                    className="occupancy-ring"
                    style={{
                      background: `conic-gradient(#4169e1 ${occupancyPercent * 3.6}deg, #e9edf5 0deg)`,
                    }}
                  >
                    <div className="ring-inner">
                      <strong>{occupancyPercent}%</strong>
                      <span>Occupied</span>
                    </div>
                  </div>

                  <div className="occupancy-details">
                    <div>
                      <span className="legend-dot blue-dot" />
                      <span>People inside</span>
                      <strong>{data.occupancy}</strong>
                    </div>
                    <div>
                      <span className="legend-dot grey-dot" />
                      <span>Remaining capacity</span>
                      <strong>{Math.max(capacity - data.occupancy, 0)}</strong>
                    </div>
                    <p className="note">
                      Capacity is a demo setting of 100 people. Adjust it to
                      match your actual library.
                    </p>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Year-wise visit distribution</h3>
                    <p>Aggregate visits by student year</p>
                  </div>
                </div>

                <BarChart data={yearData} color="blue" />

                <div className="chart-summary">
                  <span>Total year-wise visits</span>
                  <strong>{totalYearVisits}</strong>
                </div>
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Historical hourly occupancy</h3>
                    <p>Average occupancy grouped by local hour</p>
                  </div>
                  <span className="tag muted-tag">{historyStatus}</span>
                </div>

                {hourlyData.length > 0 ? (
                  <BarChart data={hourlyData} color="teal" />
                ) : (
                  <p className="note">
                    {historyStatus}. Collect more timestamped readings to build this chart.
                  </p>
                )}
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Book transaction summary</h3>
                    <p>Issue and return counts from the channel</p>
                  </div>
                </div>

                <div className="transaction-total">
                  <span>Total recorded transactions</span>
                  <strong>{totalTransactions}</strong>
                </div>

                <div className="transaction-row">
                  <div className="transaction-label">
                    <span className="legend-dot blue-dot" />
                    Books issued
                  </div>
                  <strong>{data.issued}</strong>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${totalTransactions
                        ? (data.issued / totalTransactions) * 100
                        : 0
                        }%`,
                    }}
                  />
                </div>

                <div className="transaction-row">
                  <div className="transaction-label">
                    <span className="legend-dot teal-dot" />
                    Books returned
                  </div>
                  <strong>{data.returned}</strong>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill teal-fill"
                    style={{
                      width: `${totalTransactions
                        ? (data.returned / totalTransactions) * 100
                        : 0
                        }%`,
                    }}
                  />
                </div>

                <p className="note">
                  These are counters, not individual book records. Detailed
                  borrowing history will come from the library database.
                </p>
              </div>
            </section>

            <section className="panel conclusion-panel">
              <div className="panel-heading">
                <div>
                  <h3>Management insights</h3>
                  <p>Preliminary observations from available metrics</p>
                </div>
              </div>
              <div className="insight-list">
                <div>
                  <span className="insight-number">01</span>
                  <div>
                    <strong>Capacity monitoring</strong>
                    <p>
                      {occupancyPercent >= 80
                        ? "Occupancy is high. Consider checking seating and circulation."
                        : "Current occupancy is below the demo high-occupancy threshold."}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="insight-number">02</span>
                  <div>
                    <strong>Student-year comparison</strong>
                    <p>
                      {totalYearVisits
                        ? `${yearNames[data.years.indexOf(Math.max(...data.years))]} has the highest recorded count among the four year groups in this sample.`
                        : "Collect year-wise visits before comparing student groups."}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="insight-number">03</span>
                  <div>
                    <strong>Historical analysis</strong>
                    <p>
                      Daily, monthly and peak-hour conclusions require multiple
                      timestamped readings over time.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="welcome-row">
              <div>
                <h2>Student library portal</h2>
                <p>Check library conditions before making your visit.</p>
              </div>
              <span className="date-chip">Library status</span>
            </section>

            <section className="student-hero">
              <div>
                <span className="eyebrow">CURRENT LIBRARY STATUS</span>
                <h2>
                  {occupancyPercent >= 80
                    ? "The library is busy"
                    : occupancyPercent >= 50
                      ? "The library is moderately occupied"
                      : "The library has available capacity"}
                </h2>
                <p>
                  The latest reported occupancy is {data.occupancy} people out
                  of the demo capacity of {capacity}.
                </p>
              </div>
              <div
                className="student-occupancy"
                style={{
                  background: `conic-gradient(#4169e1 ${occupancyPercent * 3.6}deg, #e9edf5 0deg)`,
                }}
              >
                <div>
                  <strong>{occupancyPercent}%</strong>
                  <span>Occupied</span>
                </div>
              </div>
            </section>

            <section className="stats-grid student-stats">
              <StatCard
                title="People inside"
                value={data.occupancy}
                detail="Latest occupancy reading"
                icon="♙"
              />
              <StatCard
                title="Space remaining"
                value={Math.max(capacity - data.occupancy, 0)}
                detail="Based on demo capacity"
                icon="⌂"
              />
              <StatCard
                title="Books issued today"
                value={data.issued}
                detail="Reported channel counter"
                icon="▤"
              />
              <StatCard
                title="Books returned today"
                value={data.returned}
                detail="Reported channel counter"
                icon="↩"
              />
            </section>

            <section className="charts-grid">
              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Library usage by year</h3>
                    <p>Aggregated visits across student years</p>
                  </div>
                </div>
                <BarChart data={yearData} color="blue" />
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Before you visit</h3>
                    <p>What the current data can tell you</p>
                  </div>
                </div>
                <div className="student-tip">
                  <div className="tip-icon">i</div>
                  <div>
                    <strong>Check the latest occupancy</strong>
                    <p>
                      Refresh the dashboard before heading to the library.
                      Historical peak-hour data will become more useful as
                      the system collects readings.
                    </p>
                  </div>
                </div>
                <div className="student-tip">
                  <div className="tip-icon">↻</div>
                  <div>
                    <strong>Data refresh</strong>
                    <p>
                      The dashboard attempts to refresh from ThingSpeak every
                      30 seconds.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        <footer className="footer">
          <span>Smart Library Management System</span>
          <span>IoT · RFID · ThingSpeak Analytics</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
