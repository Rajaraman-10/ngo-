import { useEffect, useState } from "react";
import { api } from "../../api/client";

function formatTimestamp(value) {
  return new Date(value).toLocaleString("en-IN");
}

export default function AuditLogPanel() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get("/audit/audit-logs/").then((res) => setLogs(res.data.results || res.data));
  }, []);

  return (
    <div className="card">
      <h3>Audit Log</h3>
      <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
        Internal record of every significant action — who did what, and when. Never exposed
        publicly.
      </p>
      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Record</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id}>
              <td>{formatTimestamp(l.created_at)}</td>
              <td>{l.actor_name || "system"}</td>
              <td>{l.action}</td>
              <td>
                {l.model_name} {l.object_id.slice(0, 8)}
              </td>
            </tr>
          ))}
          {!logs.length && (
            <tr>
              <td colSpan={4} style={{ color: "var(--text-muted)" }}>
                No audit entries yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
