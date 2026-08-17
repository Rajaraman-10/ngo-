import { useEffect, useState } from "react";
import { api } from "../api/client";
import { formatINR } from "../utils/format";

export default function Projects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api.get("/core/projects/").then((res) => setProjects(res.data.results || res.data));
  }, []);

  return (
    <div className="container">
      <h1>Projects</h1>
      {!projects.length && <p style={{ color: "var(--text-muted)" }}>No projects published yet.</p>}
      {projects.map((p) => {
        const pct = p.target_budget > 0 ? Math.min(100, (p.funds_spent / p.target_budget) * 100) : 0;
        return (
          <div className="card" key={p.id}>
            <h3>
              {p.name} <span className="badge approved">{p.status}</span>
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
