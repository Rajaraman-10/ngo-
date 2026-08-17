import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import Media from "../components/Media";
import { FOCUS_AREA_MAP } from "../constants/focusAreas";
import { formatDate, formatINR } from "../utils/format";

export default function MissionDetail() {
  const { focusArea } = useParams();
  const meta = FOCUS_AREA_MAP[focusArea];

  const [mission, setMission] = useState(null);
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [stories, setStories] = useState([]);

  useEffect(() => {
    api
      .get(`/core/missions/${focusArea}/`)
      .then((res) => setMission(res.data))
      .catch(() => setMission(null));
    api.get("/finance/summary/").then((res) => setSummary(res.data));
    api.get("/core/projects/").then((res) => {
      const all = res.data.results || res.data;
      setProjects(all.filter((p) => p.focus_area === focusArea));
    });
    api.get("/core/impact-updates/").then((res) => {
      const all = res.data.results || res.data;
      setUpdates(all.filter((u) => u.focus_area === focusArea));
    });
    api.get("/core/stories/").then((res) => {
      const all = res.data.results || res.data;
      setStories(all);
    });
  }, [focusArea]);

  if (!meta) {
    return (
      <div className="container">
        <p>Unknown mission area.</p>
      </div>
    );
  }

  const fundsSpent = summary?.expenses_by_focus_area?.[focusArea] || 0;
  const beneficiaries = summary?.beneficiaries_by_focus_area?.[focusArea] || 0;
  const projectStories = stories.filter((s) => projects.some((p) => p.name === s.project_name));

  return (
    <div className="container">
      <div className="card" style={{ textAlign: "center" }}>
        {mission?.hero_image && <Media src={mission.hero_image} alt={meta.label} />}
        <div className="pillar-icon" style={{ background: meta.color, margin: "0 auto 12px" }}>
          {meta.icon}
        </div>
        <h1>{meta.label}</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto" }}>
          {mission?.tagline || meta.tagline}
        </p>
      </div>

      <div className="card">
        <h2>Why It Matters</h2>
        <p style={{ color: "var(--text-secondary)" }}>
          {mission?.why_it_matters || meta.description}
        </p>
      </div>

      {mission?.programs?.length > 0 && (
        <div className="card">
          <h2>Current Programs</h2>
          <ul className="checklist" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {mission.programs.map((p) => (
              <li key={p}>✓ {p}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-tile">
          <div className="value">{formatINR(fundsSpent)}</div>
          <div className="label">Funds Spent on {meta.label}</div>
        </div>
        <div className="stat-tile">
          <div className="value">{beneficiaries}</div>
          <div className="label">People Impacted</div>
        </div>
        <div className="stat-tile">
          <div className="value">{projects.length}</div>
          <div className="label">Active Projects</div>
        </div>
      </div>

      <div className="card">
        <h2>Active Projects</h2>
        {!projects.length && <p style={{ color: "var(--text-muted)" }}>No projects published yet.</p>}
        {projects.map((p) => {
          const pct = p.target_budget > 0 ? Math.min(100, (p.funds_spent / p.target_budget) * 100) : 0;
          return (
            <div key={p.id} style={{ marginBottom: 16 }}>
              <strong>{p.name}</strong>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                {formatINR(p.funds_spent)} of {formatINR(p.target_budget)} spent · {pct.toFixed(0)}%
              </p>
              <Link to={`/projects/${p.slug}`}>View Project →</Link>
            </div>
          );
        })}
      </div>

      {updates.length > 0 && (
        <div className="card">
          <h2>Recent Updates</h2>
          {updates.map((u) => (
            <div key={u.id} style={{ marginBottom: 14 }}>
              {u.photo && <Media src={u.photo} alt={u.title} />}
              <strong>{u.title}</strong>{" "}
              <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{formatDate(u.date)}</span>
              <p style={{ color: "var(--text-secondary)", margin: "4px 0" }}>{u.description}</p>
            </div>
          ))}
        </div>
      )}

      {projectStories.length > 0 && (
        <div className="card">
          <h2>Stories</h2>
          {projectStories.map((s) => (
            <div key={s.id} style={{ marginBottom: 14 }}>
              <strong>{s.title}</strong>
              <p style={{ color: "var(--text-secondary)", margin: "4px 0" }}>{s.current_situation}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card donate-cta">
        <h3>Support {meta.label}</h3>
        <Link to={`/donate?mission=${focusArea}`} className="btn">
          Donate to {meta.label}
        </Link>
      </div>
    </div>
  );
}
