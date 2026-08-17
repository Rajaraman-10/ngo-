import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatDate } from "../../utils/format";

const emptyForm = { project: "", title: "", description: "", date: "" };

export default function ActivitiesPanel() {
  const [activities, setActivities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");

  async function refresh() {
    const { data } = await api.get("/core/activities/");
    setActivities(data.results || data);
  }

  useEffect(() => {
    refresh();
    api.get("/core/projects/").then((res) => setProjects(res.data.results || res.data));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append("photo", photo);
      await api.post("/core/activities/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm(emptyForm);
      setPhoto(null);
      refresh();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not log this activity. Check required fields.");
    }
  }

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h3>Log an activity</h3>
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
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="field">
              <label>Photo (optional)</label>
              <input type="file" onChange={(e) => setPhoto(e.target.files[0])} />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button className="btn" type="submit">
            Submit Report
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Recent Activities</h3>
        {activities.map((a) => (
          <div key={a.id} style={{ marginBottom: 14 }}>
            <strong>{a.title}</strong>{" "}
            <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
              {formatDate(a.date)} · {a.project_name}
            </span>
            <p style={{ color: "var(--text-secondary)", margin: "4px 0" }}>{a.description}</p>
          </div>
        ))}
        {!activities.length && <p style={{ color: "var(--text-muted)" }}>No activities logged yet.</p>}
      </div>
    </div>
  );
}
