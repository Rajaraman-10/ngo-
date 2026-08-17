import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { FOCUS_AREAS, focusAreaLabel } from "../constants/focusAreas";
import { formatDate, formatINR } from "../utils/format";
import { getSavedTransactionIds, saveTransactionId } from "../utils/myImpact";

export default function VerifyTransaction() {
  const [searchParams] = useSearchParams();
  const [txnId, setTxnId] = useState(searchParams.get("tx") || "");
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(false);

  async function lookup(id) {
    setResult(null);
    setNotFound(false);
    setSaved(false);
    try {
      const { data } = await api.get(`/finance/verify/${encodeURIComponent(id.trim())}/`);
      setResult(data);
      setSaved(getSavedTransactionIds().includes(data.transaction_id));
    } catch {
      setNotFound(true);
    }
  }

  useEffect(() => {
    const tx = searchParams.get("tx");
    if (tx) lookup(tx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    lookup(txnId);
  }

  function handleSaveToImpact() {
    saveTransactionId(result.transaction_id);
    setSaved(true);
  }

  const impact = result?.project_impact;
  const focus = impact && FOCUS_AREAS.find((f) => f.key === impact.focus_area);

  return (
    <div className="container">
      <h1>Track Your Contribution</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Every contribution deserves an answer. Enter the transaction ID from your donation
        receipt or an expense record to see exactly where it went.
      </p>
      <form onSubmit={handleSubmit} className="card">
        <div className="form-grid">
          <div className="field">
            <label>Transaction ID</label>
            <input
              value={txnId}
              onChange={(e) => setTxnId(e.target.value)}
              placeholder="e.g. NGO-2026-DON-000001"
              required
            />
          </div>
        </div>
        <button className="btn" type="submit">
          Verify
        </button>
      </form>

      {notFound && <div className="error-banner">No matching published transaction was found.</div>}

      {result?.found && result.type === "expense" && (
        <div className="card">
          <h3>Transaction Found ✓</h3>
          <table>
            <tbody>
              <tr>
                <th>Type</th>
                <td>Expense</td>
              </tr>
              <tr>
                <th>Transaction ID</th>
                <td>{result.transaction_id}</td>
              </tr>
              <tr>
                <th>Amount</th>
                <td>{formatINR(result.amount)}</td>
              </tr>
              <tr>
                <th>Date</th>
                <td>{formatDate(result.date)}</td>
              </tr>
              <tr>
                <th>Category</th>
                <td>{result.category}</td>
              </tr>
              <tr>
                <th>Project</th>
                <td>{result.project_name || "—"}</td>
              </tr>
              <tr>
                <th>Invoice</th>
                <td>{result.has_invoice ? "Available" : "—"}</td>
              </tr>
              <tr>
                <th>Status</th>
                <td>
                  <span className={`badge ${result.status}`}>{result.status}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {result?.found && result.type === "donation" && (
        <div className="card impact-card">
          {result.is_test && (
            <div className="error-banner">
              Test donation — made through the development mock payment gateway. No real
              money was involved, and this record is excluded from public totals.
            </div>
          )}
          <h3>
            {focus ? `${focus.icon} ` : ""}Your {formatINR(result.amount)} at Work
          </h3>
          <p style={{ color: "var(--text-secondary)" }}>
            Donated {formatDate(result.date)} by <strong>{result.donor_label}</strong> toward{" "}
            <strong>{result.project_name || result.purpose || "our general fund"}</strong>.
          </p>

          {impact ? (
            <>
              <p style={{ color: "var(--text-secondary)", marginTop: 16 }}>
                Your contribution was combined with other donations toward{" "}
                <strong>{impact.project_name}</strong>
                {impact.progress_percent !== null && `, currently ${impact.progress_percent}% funded against its target budget`}.
              </p>
              {impact.target_budget > 0 && (
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${Math.min(100, impact.progress_percent || 0)}%` }} />
                </div>
              )}
              <div className="stat-grid" style={{ margin: "16px 0" }}>
                <div className="stat-tile">
                  <div className="value">{formatINR(impact.target_budget)}</div>
                  <div className="label">Target Budget</div>
                </div>
                <div className="stat-tile">
                  <div className="value">{formatINR(impact.funds_received)}</div>
                  <div className="label">Funds Received</div>
                </div>
                <div className="stat-tile">
                  <div className="value">{formatINR(impact.funds_spent)}</div>
                  <div className="label">Funds Spent</div>
                </div>
              </div>

              {impact.recent_expenses.length > 0 && (
                <>
                  <h4>What this project has spent on</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Expense</th>
                        <th>Vendor</th>
                        <th className="num">Amount</th>
                        <th>Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {impact.recent_expenses.map((e) => (
                        <tr key={e.transaction_id}>
                          <td>{formatDate(e.date)}</td>
                          <td>{e.title}</td>
                          <td>{e.vendor}</td>
                          <td className="num">{formatINR(e.amount)}</td>
                          <td>{e.has_invoice ? "Available" : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              <Link to={`/projects?focus=${impact.focus_area}`} className="btn secondary" style={{ marginTop: 16 }}>
                View Project
              </Link>
            </>
          ) : (
            <p style={{ color: "var(--text-muted)" }}>
              This donation supported our general fund rather than a specific project.
            </p>
          )}

          <div style={{ marginTop: 20 }}>
            <button className="btn" onClick={handleSaveToImpact} disabled={saved}>
              {saved ? "✓ Saved to My Impact" : "Save to My Impact"}
            </button>{" "}
            <Link to="/my-impact" className="btn secondary">
              View My Impact
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
