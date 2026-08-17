import { Link } from "react-router-dom";
import { FOCUS_AREAS } from "../constants/focusAreas";

export default function Mission() {
  return (
    <div className="container">
      <h1>Our Mission</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Five foundations for a better life — each with its own programs, active projects, and
        live financial record.
      </p>
      <div className="pillar-grid">
        {FOCUS_AREAS.map((f) => (
          <Link to={`/mission/${f.key}`} className="pillar-card" key={f.key}>
            <div className="pillar-icon" style={{ background: f.color }}>
              {f.icon}
            </div>
            <h3>{f.label}</h3>
            <p className="pillar-tagline">{f.tagline}</p>
            <p className="pillar-description">{f.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
