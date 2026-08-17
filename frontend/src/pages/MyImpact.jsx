import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { formatINR } from "../utils/format";
import { getSavedTransactionIds, removeTransactionId, saveTransactionId } from "../utils/myImpact";

export default function MyImpact() {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newId, setNewId] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    const ids = getSavedTransactionIds();
    const results = await Promise.all(
      ids.map((id) =>
        api
          .get(`/finance/verify/${encodeURIComponent(id)}/`)
          .then((res) => res.data)
          .catch(() => null)
      )
    );
    setContributions(results.filter((r) => r && r.found && r.type === "donation"));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleAdd(e) {
    e.preventDefault();
    if (!newId.trim()) return;
    setError("");
    api
      .get(`/finance/verify/${encodeURIComponent(newId.trim())}/`)
      .then((res) => {
        if (res.data.type !== "donation") {
          setError("That transaction ID belongs to an expense, not a donation.");
          return;
        }
        saveTransactionId(res.data.transaction_id);
        setNewId("");
        refresh();
      })
      .catch(() => setError("No matching donation was found for that transaction ID."));
  }

  function handleRemove(id) {
    removeTransactionId(id);
    refresh();
  }

  const totalContributed = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
  const projectsSupported = new Set(contributions.map((c) => c.project_name).filter(Boolean)).size;

  return (
    <div className="container">
      <h1>My Impact</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Contributions you've saved from the Track Your Contribution page, kept only in this
        browser — nothing is tied to an account.
      </p>

      <form onSubmit={handleAdd} className="card">
        <div className="form-grid">
          <div className="field">
            <label>Add a donation transaction ID</label>
            <input value={newId} onChange={(e) => setNewId(e.target.value)} placeholder="e.g. NGO-2026-DON-000001" />
          </div>
        </div>
        <button className="btn" type="submit">
          Add to My Impact
        </button>
        {error && <div className="error-banner" style={{ marginTop: 12 }}>{error}</div>}
      </form>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      ) : contributions.length ? (
        <>
          <div className="stat-grid">
            <div className="stat-tile">
              <div className="value">{formatINR(totalContributed)}</div>
              <div className="label">Total Contributed</div>
            </div>
            <div className="stat-tile">
              <div className="value">{projectsSupported}</div>
              <div className="label">Projects Supported</div>
            </div>
            <div className="stat-tile">
              <div className="value">{contributions.length}</div>
              <div className="label">Contributions Tracked</div>
            </div>
          </div>

          <div className="card">
            <h3>Your Contributions</h3>
            {contributions.map((c) => {
              const completed = c.project_impact?.project_status === "completed";
              return (
                <div className="impact-row" key={c.transaction_id}>
                  <div>
                    <strong>{formatINR(c.amount)}</strong> → {c.project_name || c.purpose || "General fund"}
                    <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      {completed ? "✓ Project completed" : "⏳ Project in progress"}
                    </div>
                  </div>
                  <div className="actions-row">
                    <Link to={`/verify?tx=${c.transaction_id}`} className="btn secondary">
                      View Impact
                    </Link>
                    <button className="btn secondary" onClick={() => handleRemove(c.transaction_id)}>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="card">
          <p style={{ color: "var(--text-muted)" }}>
            You haven't tracked any contributions yet. Look up a donation on the{" "}
            <Link to="/verify">Track Your Contribution</Link> page and save it here.
          </p>
        </div>
      )}
    </div>
  );
}
