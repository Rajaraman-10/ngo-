import { useState } from "react";
import { api } from "../api/client";
import { formatDate, formatINR } from "../utils/format";

export default function VerifyTransaction() {
  const [txnId, setTxnId] = useState("");
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setResult(null);
    setNotFound(false);
    try {
      const { data } = await api.get(`/finance/verify/${encodeURIComponent(txnId.trim())}/`);
      setResult(data);
    } catch {
      setNotFound(true);
    }
  }

  return (
    <div className="container">
      <h1>Verify a Transaction</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Enter the transaction ID printed on any donation receipt or expense record to confirm it
        is genuine and published on this website.
      </p>
      <form onSubmit={handleSubmit} className="card">
        <div className="form-grid">
          <div className="field">
            <label>Transaction ID</label>
            <input
              value={txnId}
              onChange={(e) => setTxnId(e.target.value)}
              placeholder="e.g. NGO-2026-EXP-000125"
              required
            />
          </div>
        </div>
        <button className="btn" type="submit">
          Verify
        </button>
      </form>

      {notFound && <div className="error-banner">No matching published transaction was found.</div>}

      {result?.found && (
        <div className="card">
          <h3>Transaction Found ✓</h3>
          <table>
            <tbody>
              <tr>
                <th>Type</th>
                <td>{result.type === "expense" ? "Expense" : "Donation"}</td>
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
              {result.type === "expense" ? (
                <>
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
                </>
              ) : (
                <>
                  <tr>
                    <th>Donor</th>
                    <td>{result.donor_label}</td>
                  </tr>
                  <tr>
                    <th>Purpose</th>
                    <td>{result.purpose || result.project_name || "General"}</td>
                  </tr>
                </>
              )}
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
    </div>
  );
}
