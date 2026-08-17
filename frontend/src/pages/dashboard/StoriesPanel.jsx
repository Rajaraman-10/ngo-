import { useEffect, useState } from "react";
import { api } from "../../api/client";

const emptyForm = {
  title: "",
  person_name: "",
  situation_before: "",
  support_received: "",
  current_situation: "",
  project: "",
};

export default function StoriesPanel() {
  const [stories, setStories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  async function refresh() {
    const { data } = await api.get("/core/stories/");
    setStories(data.results || data);
  }

  useEffect(() => {
    refresh();
    api.get("/core/projects/").then((res) => setProjects(res.data.results || res.data));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/core/stories/", { ...form, project: form.project || null, consent_given: false, is_published: false });
      setForm(emptyForm);
      refresh();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save story. Check required fields.");
    }
  }

  async function toggle(story, field) {
    await api.patch(`/core/stories/${story.id}/`, { [field]: !story[field] });
    refresh();
  }

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h3>Add a story</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
          Stories only appear publicly once both consent AND publish are turned on below —
          never publish without explicit consent from the person involved.
        </p>
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="field">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="field">
              <label>Person's name (or pseudonym)</label>
              <input value={form.person_name} onChange={(e) => setForm({ ...form, person_name: e.target.value })} />
            </div>
            <div className="field">
              <label>Project (optional)</label>
              <select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>
                <option value="">— None —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Situation before</label>
            <textarea rows={2} value={form.situation_before} onChange={(e) => setForm({ ...form, situation_before: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Support received</label>
            <textarea rows={2} value={form.support_received} onChange={(e) => setForm({ ...form, support_received: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Current situation</label>
            <textarea rows={2} value={form.current_situation} onChange={(e) => setForm({ ...form, current_situation: e.target.value })} />
          </div>
          <button className="btn" type="submit">
            Save Draft
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Stories</h3>
        {stories.map((s) => (
          <div className="impact-row" key={s.id}>
            <div>
              <strong>{s.title}</strong>
              <div className="actions-row" style={{ marginTop: 4 }}>
                <span className={`badge ${s.consent_given ? "approved" : "rejected"}`}>
                  {s.consent_given ? "consent given" : "no consent"}
                </span>
                <span className={`badge ${s.is_published ? "approved" : "draft"}`}>
                  {s.is_published ? "published" : "draft"}
                </span>
              </div>
            </div>
            <div className="actions-row">
              <button className="btn secondary" onClick={() => toggle(s, "consent_given")}>
                {s.consent_given ? "Revoke Consent" : "Mark Consent Given"}
              </button>
              <button className="btn secondary" onClick={() => toggle(s, "is_published")}>
                {s.is_published ? "Unpublish" : "Publish"}
              </button>
            </div>
          </div>
        ))}
        {!stories.length && <p style={{ color: "var(--text-muted)" }}>No stories yet.</p>}
      </div>
    </div>
  );
}
