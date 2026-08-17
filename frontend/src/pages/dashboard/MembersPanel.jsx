import { useEffect, useState } from "react";
import { api } from "../../api/client";

const ROLES = ["admin", "finance_manager", "project_manager", "accountant", "volunteer", "auditor", "donor"];

const emptyForm = { username: "", email: "", password: "", role: "volunteer" };

export default function MembersPanel() {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  async function refresh() {
    const { data } = await api.get("/accounts/users/");
    setMembers(data.results || data);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/accounts/users/", form);
      setForm(emptyForm);
      refresh();
    } catch (err) {
      setError(err.response?.data?.username?.[0] || "Could not create member. Check required fields.");
    }
  }

  async function handleRoleChange(member, role) {
    await api.patch(`/accounts/users/${member.id}/`, { role });
    refresh();
  }

  async function toggleActive(member) {
    await api.patch(`/accounts/users/${member.id}/`, { is_active: !member.is_active });
    refresh();
  }

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h3>Add a staff member</h3>
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="field">
              <label>Username</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.filter((r) => r !== "donor").map((r) => (
                  <option key={r} value={r}>
                    {r.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn" type="submit">
            Create Member
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Members</h3>
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.username}</td>
                <td>{m.email}</td>
                <td>
                  <select value={m.role} onChange={(e) => handleRoleChange(m, e.target.value)}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button className="btn secondary" onClick={() => toggleActive(m)}>
                    {m.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
