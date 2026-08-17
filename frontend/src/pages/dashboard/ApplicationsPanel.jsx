import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatDate } from "../../utils/format";

const STATUS_OPTIONS = [
  "submitted",
  "under_review",
  "shortlisted",
  "interview_required",
  "role_assignment",
  "rejected",
  "withdrawn",
];

export default function ApplicationsPanel() {
  const [applications, setApplications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [roles, setRoles] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [statusChoice, setStatusChoice] = useState("");
  const [note, setNote] = useState("");
  const [roleChoice, setRoleChoice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { data } = await api.get("/membership/applications/");
    setApplications(data.results || data);
  }

  useEffect(() => {
    refresh();
    api.get("/membership/roles/").then((res) => setRoles(res.data.results || res.data));
  }, []);

  async function openApplication(id) {
    setError("");
    setRecommendation(null);
    const { data } = await api.get(`/membership/applications/${id}/`);
    setSelected(data);
    setStatusChoice(data.status);
    setRoleChoice(data.role_assignment?.role || "");
  }

  async function loadRecommendation() {
    const { data } = await api.get(`/membership/applications/${selected.id}/recommendation/`);
    setRecommendation(data);
  }

  async function runAction(path, body) {
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post(`/membership/applications/${selected.id}/${path}/`, body);
      setSelected(data);
      setNote("");
      refresh();
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="card">
        <h3>Applications</h3>
        <table>
          <thead>
            <tr>
              <th>Application ID</th>
              <th>Name</th>
              <th>Region</th>
              <th>Skills</th>
              <th>Status</th>
              <th>Recommended</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => (
              <tr key={a.id} style={{ cursor: "pointer" }} onClick={() => openApplication(a.id)}>
                <td>{a.application_id}</td>
                <td>{a.full_name}</td>
                <td>{a.region_name}</td>
                <td>{a.skills?.map((s) => s.name).join(", ") || "—"}</td>
                <td>
                  <span className={`badge ${a.status === "rejected" ? "rejected" : a.status === "approved" ? "approved" : "pending_approval"}`}>
                    {a.status}
                  </span>
                </td>
                <td>{a.recommended_role_name || "—"}</td>
                <td>{formatDate(a.created_at)}</td>
              </tr>
            ))}
            {!applications.length && (
              <tr>
                <td colSpan={7} style={{ color: "var(--text-muted)" }}>
                  No applications for your region yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="card">
          <h3>
            {selected.full_name} — {selected.application_id}
          </h3>
          <p style={{ color: "var(--text-secondary)" }}>
            {selected.email} · {selected.phone} · {selected.region_name}, {selected.state_name}, {selected.country_name}
          </p>
          <p style={{ color: "var(--text-secondary)" }}>
            Skills: {selected.skills?.map((s) => s.name).join(", ") || "—"} · {selected.years_of_experience} yrs
            experience · {selected.hours_per_week || "—"} hrs/week
          </p>
          {selected.motivation && (
            <p style={{ color: "var(--text-secondary)" }}>
              <strong>Motivation:</strong> {selected.motivation}
            </p>
          )}
          {selected.contribution_interest && (
            <p style={{ color: "var(--text-secondary)" }}>
              <strong>Wants to contribute:</strong> {selected.contribution_interest}
            </p>
          )}
          {selected.has_resume && (
            <p>
              <a href={`${api.defaults.baseURL}/membership/applications/${selected.id}/resume/`} target="_blank" rel="noreferrer">
                View Resume
              </a>
            </p>
          )}

          <div className="actions-row" style={{ margin: "16px 0" }}>
            <button className="btn secondary" onClick={loadRecommendation}>
              Get Role Recommendation
            </button>
          </div>

          {recommendation && (
            <div className="card" style={{ background: "var(--surface-1)" }}>
              <h4 style={{ marginTop: 0 }}>Recommended Roles</h4>
              {recommendation.length ? (
                recommendation.map((r) => (
                  <div key={r.role_id} style={{ marginBottom: 12 }}>
                    <strong>
                      {r.role_name} (score {r.score})
                    </strong>{" "}
                    — {r.remaining} of {r.required} still needed
                    <ul style={{ margin: "4px 0", color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                      {r.reasons.map((reason) => (
                        <li key={reason}>✓ {reason}</li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p style={{ color: "var(--text-muted)" }}>No open regional needs match this application right now.</p>
              )}
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}

          <div className="form-grid" style={{ marginTop: 16 }}>
            <div className="field">
              <label>Change status</label>
              <select value={statusChoice} onChange={(e) => setStatusChoice(e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Note (optional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          <button
            className="btn secondary"
            disabled={busy}
            onClick={() => runAction("change-status", { status: statusChoice, note })}
          >
            Save Status
          </button>

          <div className="form-grid" style={{ marginTop: 20 }}>
            <div className="field">
              <label>Assign role</label>
              <select value={roleChoice} onChange={(e) => setRoleChoice(e.target.value)}>
                <option value="">Select a role…</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            className="btn secondary"
            disabled={busy || !roleChoice}
            onClick={() => runAction("assign-role", { role: roleChoice })}
          >
            Assign Role
          </button>

          <div className="actions-row" style={{ marginTop: 20 }}>
            <button className="btn" disabled={busy} onClick={() => runAction("approve", {})}>
              Approve
            </button>
            <button className="btn danger" disabled={busy} onClick={() => runAction("reject", { note })}>
              Reject
            </button>
          </div>

          {selected.status_history?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4>Status History</h4>
              {selected.status_history.map((h) => (
                <div key={h.id} style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 6 }}>
                  {formatDate(h.created_at)} — {h.previous_status || "—"} → <strong>{h.new_status}</strong>
                  {h.changed_by_name && ` by ${h.changed_by_name}`}
                  {h.note && ` (${h.note})`}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
