import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { FOCUS_AREAS, focusAreaLabel } from "../constants/focusAreas";
import { formatINR } from "../utils/format";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const focus = searchParams.get("focus") || "";

  useEffect(() => {
    api.get("/core/projects/").then((res) => setProjects(res.data.results || res.data));
  }, []);

  const visible = focus ? projects.filter((p) => p.focus_area === focus) : projects;

  return (
    <div className="container">
      <h1>Projects</h1>

      <div className="actions-row" style={{ marginBottom: 24 }}>
        <button
          className={`btn ${focus ? "secondary" : ""}`}
          onClick={() => setSearchParams({})}
        >
          All
        </button>
        {FOCUS_AREAS.map((f) => (
          <button
            key={f.key}
            className={`btn ${focus === f.key ? "" : "secondary"}`}
            onClick={() => setSearchParams({ focus: f.key })}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {!visible.length && <p style={{ color: "var(--text-muted)" }}>No projects to show yet.</p>}
      {visible.map((p) => {
        const pct = p.target_budget > 0 ? Math.min(100, (p.funds_spent / p.target_budget) * 100) : 0;
        return (
          <div className="card" key={p.id}>
            <h3>
              {p.name} <span className="badge approved">{p.status}</span>{" "}
              <span className="badge draft">{focusAreaLabel(p.focus_area)}</span>
            </h3>
            <p style={{ color: "var(--text-secondary)" }}>{p.description}</p>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="stat-grid" style={{ margin: "12px 0 0" }}>
              <div className="stat-tile">
                <div className="value">{formatINR(p.target_budget)}</div>
                <div className="label">Target Budget</div>
              </div>
              <div className="stat-tile">
                <div className="value">{formatINR(p.funds_received)}</div>
                <div className="label">Funds Received</div>
              </div>
              <div className="stat-tile">
                <div className="value">{formatINR(p.funds_spent)}</div>
                <div className="label">Funds Spent</div>
              </div>
              <div className="stat-tile">
                <div className="value">{formatINR(p.funds_remaining)}</div>
                <div className="label">Remaining</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
