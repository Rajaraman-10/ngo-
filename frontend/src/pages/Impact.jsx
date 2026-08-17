import { useEffect, useState } from "react";
import { api } from "../api/client";
import { FOCUS_AREAS } from "../constants/focusAreas";
import { formatINR } from "../utils/format";

export default function Impact() {
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [updates, setUpdates] = useState([]);

  useEffect(() => {
    api.get("/finance/summary/").then((res) => setSummary(res.data));
    api.get("/core/projects/").then((res) => setProjects(res.data.results || res.data));
    api.get("/core/impact-updates/").then((res) => setUpdates(res.data.results || res.data));
  }, []);

  const activeProjects = projects.filter((p) => p.status === "active").length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const peopleImpactedByUpdates = updates.reduce((sum, u) => sum + (u.people_impacted || 0), 0);

  return (
    <div className="container">
      <h1>Our Impact</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Every figure below is computed live from our records — beneficiaries added to real
        projects, and people counted in published impact updates. Nothing here is a fixed
        statistic; it grows as our programs do.
      </p>

      <div className="stat-grid">
        <div className="stat-tile">
          <div className="value">{summary?.total_beneficiaries ?? 0}</div>
          <div className="label">People Supported</div>
        </div>
        <div className="stat-tile">
          <div className="value">{peopleImpactedByUpdates}</div>
          <div className="label">People Reached (Impact Updates)</div>
        </div>
        <div className="stat-tile">
          <div className="value">{activeProjects}</div>
          <div className="label">Active Projects</div>
        </div>
        <div className="stat-tile">
          <div className="value">{completedProjects}</div>
          <div className="label">Completed Projects</div>
        </div>
      </div>

      <div className="card">
        <h3>Mission-wise Impact</h3>
        {FOCUS_AREAS.map((f) => {
          const beneficiaries = summary?.beneficiaries_by_focus_area?.[f.key] || 0;
          const spent = summary?.expenses_by_focus_area?.[f.key] || 0;
          return (
            <div className="bar-row" key={f.key}>
              <span>
                {f.icon} {f.label}
              </span>
              <div className="track">
                <div
                  className="fill"
                  style={{
                    width: `${summary?.total_spent ? Math.min(100, (spent / summary.total_spent) * 100) : 0}%`,
                    background: f.color,
                  }}
                />
              </div>
              <span className="amount">{beneficiaries} people</span>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h3>Funds Received vs Spent</h3>
        {summary && (
          <>
            <div className="bar-row">
              <span>Received</span>
              <div className="track">
                <div className="fill" style={{ width: "100%" }} />
              </div>
              <span className="amount">{formatINR(summary.total_received)}</span>
            </div>
            <div className="bar-row">
              <span>Spent</span>
              <div className="track">
                <div
                  className="fill"
                  style={{
                    width: `${summary.total_received ? (summary.total_spent / summary.total_received) * 100 : 0}%`,
                    background: "var(--series-2)",
                  }}
                />
              </div>
              <span className="amount">{formatINR(summary.total_spent)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
