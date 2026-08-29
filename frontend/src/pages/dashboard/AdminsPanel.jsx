import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatDate } from "../../utils/format";

export default function AdminsPanel() {
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/membership/admins-overview/")
      .then((res) => setAdmins(res.data))
      .catch(() => setError("Could not load the admin list."));
  }, []);

  return (
    <div>
      <div className="card">
        <h3>Who can make changes on this site</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Every account with any edit power — donors, volunteers, and regular amma
          members are left out since they have no write access beyond their own data.
          Region-scoped amma admins show the exact area they're limited to.
        </p>
        {error && <div className="error-banner">{error}</div>}
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Access</th>
              <th>Scope</th>
              <th>Status</th>
              <th>Last login</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td>{a.username}</td>
                <td>{a.email || "—"}</td>
                <td>{a.role_display}</td>
                <td>{a.is_superuser ? "Full (superuser)" : "Role-based"}</td>
                <td>{a.scopes.length ? a.scopes.join(", ") : a.is_superuser || a.role === "admin" || a.role === "global_admin" ? "Everywhere" : "—"}</td>
                <td>{a.is_active ? "Active" : "Deactivated"}</td>
                <td>{a.last_login ? formatDate(a.last_login) : "Never"}</td>
              </tr>
            ))}
            {!admins.length && !error && (
              <tr>
                <td colSpan={7} style={{ color: "var(--text-muted)" }}>
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
