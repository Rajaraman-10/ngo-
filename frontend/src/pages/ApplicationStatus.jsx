import { useState } from "react";
import { api } from "../api/client";
import { formatDate } from "../utils/format";

const TIMELINE = [
  { key: "submitted", label: "Application Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "role_assignment", label: "Role Assignment" },
  { key: "approved", label: "Approved" },
];

export default function ApplicationStatus() {
  const [applicationId, setApplicationId] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotFound(false);
    setResult(null);
    try {
      const { data } = await api.post("/membership/applications/status/", {
        application_id: applicationId.trim(),
        email: email.trim(),
      });
      setResult(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError("Could not look up your application. Please try again.");
      }
    }
  }

  const isRejectedOrWithdrawn = result && ["rejected", "withdrawn"].includes(result.status);
  const currentIndex = result ? TIMELINE.findIndex((t) => t.key === result.status) : -1;

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <h1>Check My Application</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Enter your Application ID and the email you applied with to see your current status.
      </p>

      <form onSubmit={handleSubmit} className="card">
        <div className="form-grid">
          <div className="field">
            <label>Application ID</label>
            <input
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              placeholder="e.g. amma-2026-000001"
              required
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        {error && <div className="error-banner">{error}</div>}
        <button className="btn" type="submit">
          Check Status
        </button>
      </form>

      {notFound && (
        <div className="error-banner">
          No matching application was found — check your Application ID and email.
        </div>
      )}

      {result && (
        <div className="card">
          <h3>{result.application_id}</h3>
          <p style={{ color: "var(--text-secondary)" }}>
            Region: <strong>{result.region_name}</strong> · Submitted {formatDate(result.submitted_date)} · Last
            updated {formatDate(result.last_updated)}
          </p>
          {result.assigned_role && (
            <p style={{ color: "var(--text-secondary)" }}>
              Assigned role: <strong>{result.assigned_role}</strong>
            </p>
          )}

          {isRejectedOrWithdrawn ? (
            <p className="badge rejected" style={{ fontSize: "0.85rem" }}>
              {result.status === "rejected" ? "Application not approved" : "Withdrawn"}
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
              {TIMELINE.map((step, i) => (
                <li key={step.key} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0" }}>
                  <span style={{ color: i <= currentIndex ? "var(--brand)" : "var(--text-muted)" }}>
                    {i < currentIndex ? "✓" : i === currentIndex ? "●" : "○"}
                  </span>
                  <span style={{ color: i <= currentIndex ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {step.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
