import { useEffect, useState } from "react";
import { api } from "../api/client";
import Media from "../components/Media";

export default function Stories() {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    api.get("/core/stories/").then((res) => setStories(res.data.results || res.data));
  }, []);

  return (
    <div className="container">
      <h1>Stories of Change</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Real stories, shared only with the person's consent — never as poverty on display,
        always as what became possible with an opportunity.
      </p>

      {!stories.length && (
        <div className="card">
          <p style={{ color: "var(--text-muted)" }}>
            No stories are published yet. Stories are only shared with explicit consent from
            the person involved — check back as our programs grow.
          </p>
        </div>
      )}

      {stories.map((s) => (
        <div className="card" key={s.id}>
          <Media src={s.photo} alt={s.title} placeholder="Photo shared with consent, not yet added" />
          <h3>{s.title}</h3>
          {s.person_name && <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{s.person_name}</p>}
          {s.situation_before && (
            <p style={{ color: "var(--text-secondary)" }}>
              <strong>Before:</strong> {s.situation_before}
            </p>
          )}
          {s.support_received && (
            <p style={{ color: "var(--text-secondary)" }}>
              <strong>Support received:</strong> {s.support_received}
            </p>
          )}
          {s.current_situation && (
            <p style={{ color: "var(--text-secondary)" }}>
              <strong>Today:</strong> {s.current_situation}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
