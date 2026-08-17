import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import Media from "../components/Media";
import { FOCUS_AREAS, focusAreaLabel } from "../constants/focusAreas";
import { formatINR } from "../utils/format";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const focus = searchParams.get("focus") || "";
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [startAfter, setStartAfter] = useState("");

  useEffect(() => {
    api.get("/core/projects/").then((res) => setProjects(res.data.results || res.data));
  }, []);

  const locations = useMemo(
    () => [...new Set(projects.map((p) => p.location).filter(Boolean))],
    [projects]
  );

  const visible = projects.filter((p) => {
    if (focus && p.focus_area !== focus) return false;
    if (status && p.status !== status) return false;
    if (location && p.location !== location) return false;
    if (startAfter && (!p.start_date || p.start_date < startAfter)) return false;
    return true;
  });

  return (
    <div className="container">
      <h1>Projects</h1>

      <div className="actions-row" style={{ marginBottom: 12 }}>
        <button className={`btn ${focus ? "secondary" : ""}`} onClick={() => setSearchParams({})}>
          All Missions
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

      <div className="form-grid" style={{ marginBottom: 24 }}>
        <div className="field">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>
        <div className="field">
          <label>Location</label>
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">All</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Started after</label>
          <input type="date" value={startAfter} onChange={(e) => setStartAfter(e.target.value)} />
        </div>
      </div>

      {!visible.length && <p style={{ color: "var(--text-muted)" }}>No projects to show yet.</p>}
      {visible.map((p) => {
        const pct = p.target_budget > 0 ? Math.min(100, (p.funds_spent / p.target_budget) * 100) : 0;
        return (
          <div className="card" key={p.id}>
            <Media src={p.cover_image} alt={p.name} placeholder="Project photo not added yet" />
            <h3>
              {p.name} <span className="badge approved">{p.status}</span>{" "}
              <span className="badge draft">{focusAreaLabel(p.focus_area)}</span>
              {p.location && <span className="badge pending_approval">{p.location}</span>}
            </h3>
            <p style={{ color: "var(--text-secondary)" }}>{p.description}</p>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="stat-grid" style={{ margin: "12px 0" }}>
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
            <Link to={`/projects/${p.slug}`} className="btn secondary">
              View Project
            </Link>
          </div>
        );
      })}
    </div>
  );
}
