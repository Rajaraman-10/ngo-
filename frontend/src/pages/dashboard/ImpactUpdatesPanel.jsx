import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatDate } from "../../utils/format";

const emptyForm = { project: "", title: "", description: "", people_impacted: "", date: "" };

export default function ImpactUpdatesPanel() {
  const [updates, setUpdates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  async function refresh() {
    const { data } = await api.get("/core/impact-updates/");
    setUpdates(data.results || data);
  }

  useEffect(() => {
    refresh();
    api.get("/core/projects/").then((res) => setProjects(res.data.results || res.data));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/core/impact-updates/", {
        ...form,
        people_impacted: Number(form.people_impacted) || 0,
        is_published: false,
      });
      setForm(emptyForm);
      refresh();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create update. Check required fields.");
    }
  }

  async function togglePublish(update) {
    await api.patch(`/core/impact-updates/${update.id}/`, { is_published: !update.is_published });
    refresh();
  }

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h3>Publish an impact update</h3>
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="field">
              <label>Project</label>
              <select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} required>
                <option value="">— Select —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="field">
              <label>People impacted</label>
              <input
                type="number"
                min="0"
                value={form.people_impacted}
                onChange={(e) => setForm({ ...form, people_impacted: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <button className="btn" type="submit">
            Save as Draft
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Impact Updates</h3>
        {updates.map((u) => (
          <div className="impact-row" key={u.id}>
            <div>
              <strong>{u.title}</strong>{" "}
              <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                {formatDate(u.date)} · {u.project_name}
              </span>
              <div>
                <span className={`badge ${u.is_published ? "approved" : "draft"}`}>
                  {u.is_published ? "published" : "draft"}
                </span>
              </div>
            </div>
            <button className="btn secondary" onClick={() => togglePublish(u)}>
              {u.is_published ? "Unpublish" : "Publish"}
            </button>
          </div>
        ))}
        {!updates.length && <p style={{ color: "var(--text-muted)" }}>No impact updates yet.</p>}
      </div>
    </div>
  );
}
