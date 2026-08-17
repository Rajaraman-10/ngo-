import { useEffect, useState } from "react";
import { api } from "../../api/client";

export default function RegionalNeedsPanel() {
  const [needs, setNeeds] = useState([]);
  const [regions, setRegions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ region: "", role: "", required_count: 1 });
  const [error, setError] = useState("");

  async function refresh() {
    const { data } = await api.get("/membership/regional-needs/?include_inactive=1");
    setNeeds(data.results || data);
  }

  useEffect(() => {
    refresh();
    api.get("/membership/regions/").then((res) => setRegions(res.data.results || res.data));
    api.get("/membership/roles/").then((res) => setRoles(res.data.results || res.data));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/membership/regional-needs/", form);
      setForm({ region: form.region, role: "", required_count: 1 });
      refresh();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create this need — check the region and role.");
    }
  }

  async function toggleActive(need) {
    await api.patch(`/membership/regional-needs/${need.id}/`, { is_active: !need.is_active });
    refresh();
  }

  return (
    <div>
      <div className="card">
        <h3>Create a regional need</h3>
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="field">
              <label>Region</label>
              <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} required>
                <option value="">Select a region…</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}, {r.state_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required>
                <option value="">Select a role…</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Required count</label>
              <input
                type="number"
                min="0"
                value={form.required_count}
                onChange={(e) => setForm({ ...form, required_count: Number(e.target.value) })}
                required
              />
            </div>
          </div>
          {error && <div className="error-banner">{error}</div>}
          <button className="btn" type="submit">
            Create Need
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Regional Needs</h3>
        <table>
          <thead>
            <tr>
              <th>Region</th>
              <th>Role</th>
              <th className="num">Required</th>
              <th className="num">Assigned</th>
              <th className="num">Remaining</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {needs.map((n) => (
              <tr key={n.id}>
                <td>{n.region_name}</td>
                <td>{n.role_name}</td>
                <td className="num">{n.required_count}</td>
                <td className="num">{n.assigned}</td>
                <td className="num">{n.remaining}</td>
                <td>
                  <span className={`badge ${n.is_active ? "approved" : "voided"}`}>
                    {n.is_active ? "active" : "closed"}
                  </span>
                </td>
                <td>
                  <button className="btn secondary" onClick={() => toggleActive(n)}>
                    {n.is_active ? "Close" : "Reopen"}
                  </button>
                </td>
              </tr>
            ))}
            {!needs.length && (
              <tr>
                <td colSpan={7} style={{ color: "var(--text-muted)" }}>
                  No regional needs created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
