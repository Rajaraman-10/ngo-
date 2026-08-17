import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { FOCUS_AREAS } from "../../constants/focusAreas";
import { formatINR } from "../../utils/format";

const CAN_MANAGE = ["project_manager", "admin"];

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  status: "active",
  focus_area: "education",
  location: "",
  target_budget: "",
  start_date: "",
  end_date: "",
};

export default function ProjectsPanel() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [coverImage, setCoverImage] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [error, setError] = useState("");
  const canManage = CAN_MANAGE.includes(user?.role) || user?.is_superuser;

  async function refresh() {
    const { data } = await api.get("/core/projects/");
    setProjects(data.results || data);
  }

  useEffect(() => {
    refresh();
  }, []);

  function slugify(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      const fd = new FormData();
      const payload = {
        ...form,
        slug: form.slug || slugify(form.name),
        target_budget: Number(form.target_budget) || 0,
      };
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) fd.append(k, v);
      });
      if (coverImage) fd.append("cover_image", coverImage);
      await api.post("/core/projects/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm(emptyForm);
      setCoverImage(null);
      setFileKey((k) => k + 1);
      refresh();
    } catch (err) {
      setError(err.response?.data?.slug?.[0] || "Could not create project. Check required fields.");
    }
  }

  async function handleStatusChange(project, status) {
    await api.patch(`/core/projects/${project.slug}/`, { status });
    refresh();
  }

  if (!canManage) {
    return <p style={{ color: "var(--text-muted)" }}>Only project managers can manage projects.</p>;
  }

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h3>Create a project</h3>
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field">
              <label>Mission</label>
              <select value={form.focus_area} onChange={(e) => setForm({ ...form, focus_area: e.target.value })}>
                {FOCUS_AREAS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Location</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="field">
              <label>Target budget (₹)</label>
              <input
                type="number"
                min="0"
                value={form.target_budget}
                onChange={(e) => setForm({ ...form, target_budget: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Start date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div className="field">
              <label>End date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Project photo</label>
              <input
                key={fileKey}
                type="file"
                accept="image/*"
                onChange={(e) => setCoverImage(e.target.files[0])}
              />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button className="btn" type="submit">
            Create Project
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Projects</h3>
        <table>
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Mission</th>
              <th>Status</th>
              <th className="num">Target</th>
              <th className="num">Received</th>
              <th className="num">Spent</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.cover_image ? (
                    <img
                      src={p.cover_image}
                      alt=""
                      style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6 }}
                    />
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                  )}
                </td>
                <td>{p.name}</td>
                <td>{p.focus_area}</td>
                <td>
                  <select value={p.status} onChange={(e) => handleStatusChange(p, e.target.value)}>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </td>
                <td className="num">{formatINR(p.target_budget)}</td>
                <td className="num">{formatINR(p.funds_received)}</td>
                <td className="num">{formatINR(p.funds_spent)}</td>
              </tr>
            ))}
            {!projects.length && (
              <tr>
                <td colSpan={7} style={{ color: "var(--text-muted)" }}>
                  No projects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
