import { useEffect, useState } from "react";
import { api } from "../api/client";
import { formatDate, formatINR } from "../utils/format";

const SERIES_COLORS = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)"];

const SOURCE_LABELS = {
  individual: "Individual donations",
  corporate: "Corporate / CSR",
  grant: "Government / Grant",
};

function BarBreakdown({ rows, total }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div>
      {rows.map((row, i) => (
        <div className="bar-row" key={row.label}>
          <span>{row.label}</span>
          <div className="track">
            <div
              className="fill"
              style={{
                width: `${(row.value / max) * 100}%`,
                background: SERIES_COLORS[i % SERIES_COLORS.length],
              }}
            />
          </div>
          <span className="amount">{formatINR(row.value)}</span>
        </div>
      ))}
      {total ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 8 }}>
          Total: {formatINR(total)}
        </p>
      ) : null}
    </div>
  );
}

export default function Transparency() {
  const [summary, setSummary] = useState(null);
  const [donations, setDonations] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    api.get("/finance/summary/").then((res) => setSummary(res.data));
    api.get("/finance/donations/").then((res) => setDonations(res.data.results || res.data));
    api.get("/finance/expenses/").then((res) => setExpenses(res.data.results || res.data));
  }, []);

  const sourceRows = summary
    ? Object.entries(summary.donations_by_source).map(([key, value]) => ({
        label: SOURCE_LABELS[key] || key,
        value: Number(value),
      }))
    : [];

  const categoryRows = summary
    ? summary.expenses_by_category.map((row) => ({ label: row.category, value: Number(row.total) }))
    : [];

  return (
    <div className="container">
      <h1>Transparency Dashboard</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Every donation and every approved expense is listed below with a unique transaction ID.
        Approved expenses link to their supporting invoice.
      </p>

      {summary && (
        <div className="stat-grid">
          <div className="stat-tile">
            <div className="value">{formatINR(summary.total_received)}</div>
            <div className="label">Total Received</div>
          </div>
          <div className="stat-tile">
            <div className="value">{formatINR(summary.total_spent)}</div>
            <div className="label">Total Spent</div>
          </div>
          <div className="stat-tile">
            <div className="value">{formatINR(summary.balance)}</div>
            <div className="label">Current Balance</div>
          </div>
          <div className="stat-tile">
            <div className="value">{summary.utilization_percent}%</div>
            <div className="label">Funds Utilized</div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Donations by source</h3>
        {sourceRows.length ? (
          <BarBreakdown rows={sourceRows} />
        ) : (
          <p style={{ color: "var(--text-muted)" }}>No donations recorded yet.</p>
        )}
      </div>

      <div className="card">
        <h3>Where the money goes</h3>
        {categoryRows.length ? (
          <BarBreakdown rows={categoryRows} />
        ) : (
          <p style={{ color: "var(--text-muted)" }}>No approved expenses yet.</p>
        )}
      </div>

      <div className="card">
        <h3>Donations ledger</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction ID</th>
              <th>Donor</th>
              <th>Purpose</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((d) => (
              <tr key={d.transaction_id}>
                <td>{formatDate(d.date)}</td>
                <td>{d.transaction_id}</td>
                <td>{d.donor_label}</td>
                <td>{d.purpose || d.project_name || "General"}</td>
                <td className="num">{formatINR(d.amount)}</td>
              </tr>
            ))}
            {!donations.length && (
              <tr>
                <td colSpan={5} style={{ color: "var(--text-muted)" }}>
                  No donations to show yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Expense ledger</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction ID</th>
              <th>Expense</th>
              <th>Vendor</th>
              <th>Project</th>
              <th className="num">Amount</th>
              <th>Invoice</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.transaction_id}>
                <td>{formatDate(e.date)}</td>
                <td>{e.transaction_id}</td>
                <td>{e.title}</td>
                <td>{e.vendor}</td>
                <td>{e.project_name || "—"}</td>
                <td className="num">{formatINR(e.amount)}</td>
                <td>{e.has_invoice ? "Available" : "—"}</td>
              </tr>
            ))}
            {!expenses.length && (
              <tr>
                <td colSpan={7} style={{ color: "var(--text-muted)" }}>
                  No approved expenses to show yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
