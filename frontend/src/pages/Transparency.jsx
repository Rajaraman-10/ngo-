import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { formatDate, formatINR } from "../utils/format";

const SERIES_COLORS = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)"];

const SOURCE_LABELS = {
  individual: "Individual donations",
  corporate: "Corporate / CSR",
  grant: "Government / Grant",
};

const TABS = [
  { key: "received", label: "Funds Received" },
  { key: "expenses", label: "Expenses" },
  { key: "invoices", label: "Invoices" },
  { key: "reports", label: "Reports" },
  { key: "audit", label: "Audit" },
];

function BarBreakdown({ rows }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div>
      {rows.map((row, i) => (
        <div className="bar-row" key={row.label}>
          <span>{row.label}</span>
          <div className="track">
            <div
              className="fill"
              style={{ width: `${(row.value / max) * 100}%`, background: SERIES_COLORS[i % SERIES_COLORS.length] }}
            />
          </div>
          <span className="amount">{formatINR(row.value)}</span>
        </div>
      ))}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="field" style={{ marginBottom: 14, maxWidth: 320 }}>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export default function Transparency() {
  const [tab, setTab] = useState("received");
  const [summary, setSummary] = useState(null);
  const [donations, setDonations] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/finance/summary/").then((res) => setSummary(res.data));
    api.get("/finance/donations/").then((res) => setDonations(res.data.results || res.data));
    api.get("/finance/expenses/").then((res) => setExpenses(res.data.results || res.data));
    api.get("/finance/invoices/").then((res) => setInvoices(res.data.results || res.data));
    api.get("/documents/documents/").then((res) => setDocuments(res.data.results || res.data));
  }, []);

  useEffect(() => setSearch(""), [tab]);

  const sourceRows = summary
    ? Object.entries(summary.donations_by_source).map(([key, value]) => ({
        label: SOURCE_LABELS[key] || key,
        value: Number(value),
      }))
    : [];

  const categoryRows = summary
    ? summary.expenses_by_category.map((row) => ({ label: row.category, value: Number(row.total) }))
    : [];

  const filteredDonations = useMemo(() => {
    const q = search.toLowerCase();
    return donations.filter(
      (d) =>
        !q ||
        d.transaction_id.toLowerCase().includes(q) ||
        d.donor_label?.toLowerCase().includes(q) ||
        d.project_name?.toLowerCase().includes(q)
    );
  }, [donations, search]);

  const filteredExpenses = useMemo(() => {
    const q = search.toLowerCase();
    return expenses.filter(
      (e) =>
        !q ||
        e.transaction_id.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.vendor?.toLowerCase().includes(q) ||
        e.project_name?.toLowerCase().includes(q)
    );
  }, [expenses, search]);

  const filteredInvoices = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter(
      (i) =>
        !q ||
        i.invoice_number?.toLowerCase().includes(q) ||
        i.expense_vendor?.toLowerCase().includes(q) ||
        i.expense_transaction_id?.toLowerCase().includes(q)
    );
  }, [invoices, search]);

  const auditDocuments = documents.filter((d) => d.category === "audit");
  const reportDocuments = documents.filter((d) => d.category !== "audit");

  return (
    <div className="container">
      <h1>Every Rupee. Accounted For.</h1>
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
        {sourceRows.length ? <BarBreakdown rows={sourceRows} /> : <p style={{ color: "var(--text-muted)" }}>No donations recorded yet.</p>}
      </div>

      <div className="card">
        <h3>Where the money goes</h3>
        {categoryRows.length ? <BarBreakdown rows={categoryRows} /> : <p style={{ color: "var(--text-muted)" }}>No approved expenses yet.</p>}
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "received" && (
        <div className="card">
          <SearchBox value={search} onChange={setSearch} placeholder="Search by transaction ID, donor, or project…" />
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction ID</th>
                <th>Source</th>
                <th>Donor</th>
                <th>Purpose / Project</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.map((d) => (
                <tr key={d.transaction_id}>
                  <td>{formatDate(d.date)}</td>
                  <td>{d.transaction_id}</td>
                  <td>{SOURCE_LABELS[d.source] || d.source}</td>
                  <td>{d.donor_label}</td>
                  <td>{d.purpose || d.project_name || "General"}</td>
                  <td className="num">{formatINR(d.amount)}</td>
                </tr>
              ))}
              {!filteredDonations.length && (
                <tr>
                  <td colSpan={6} style={{ color: "var(--text-muted)" }}>
                    No matching donations.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "expenses" && (
        <div className="card">
          <SearchBox value={search} onChange={setSearch} placeholder="Search by transaction ID, title, vendor, or project…" />
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Expense ID</th>
                <th>Description</th>
                <th>Vendor</th>
                <th>Project</th>
                <th className="num">Amount</th>
                <th>Status</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((e) => (
                <tr key={e.transaction_id}>
                  <td>{formatDate(e.date)}</td>
                  <td>{e.transaction_id}</td>
                  <td>{e.title}</td>
                  <td>{e.vendor}</td>
                  <td>{e.project_name || "—"}</td>
                  <td className="num">{formatINR(e.amount)}</td>
                  <td>
                    <span className={`badge ${e.status}`}>{e.status}</span>
                  </td>
                  <td>
                    {e.invoice_url ? (
                      <a href={e.invoice_url} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {!filteredExpenses.length && (
                <tr>
                  <td colSpan={8} style={{ color: "var(--text-muted)" }}>
                    No matching expenses.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "invoices" && (
        <div className="card">
          <SearchBox value={search} onChange={setSearch} placeholder="Search by invoice number, vendor, or expense ID…" />
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Vendor</th>
                <th>Date</th>
                <th className="num">Amount</th>
                <th>Related Expense</th>
                <th>File</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((i) => (
                <tr key={i.id}>
                  <td>{i.invoice_number || "—"}</td>
                  <td>{i.expense_vendor}</td>
                  <td>{formatDate(i.expense_date)}</td>
                  <td className="num">{formatINR(i.expense_amount)}</td>
                  <td>{i.expense_transaction_id}</td>
                  <td>
                    <a href={i.file} target="_blank" rel="noreferrer">
                      View
                    </a>
                  </td>
                </tr>
              ))}
              {!filteredInvoices.length && (
                <tr>
                  <td colSpan={6} style={{ color: "var(--text-muted)" }}>
                    No matching invoices.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "reports" && (
        <div className="card">
          {!reportDocuments.length && <p style={{ color: "var(--text-muted)" }}>No reports uploaded yet.</p>}
          <table>
            <tbody>
              {reportDocuments.map((d) => (
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td style={{ color: "var(--text-muted)" }}>{d.financial_year}</td>
                  <td>
                    <a href={d.file} target="_blank" rel="noreferrer">
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link to="/reports" className="btn secondary" style={{ marginTop: 12 }}>
            Full Document Library →
          </Link>
        </div>
      )}

      {tab === "audit" && (
        <div className="card">
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Published audited financial statements. Our internal staff audit trail (who
            changed what, and when) is kept for organizational accountability and isn't made
            public.
          </p>
          {!auditDocuments.length && <p style={{ color: "var(--text-muted)" }}>No audit reports uploaded yet.</p>}
          <table>
            <tbody>
              {auditDocuments.map((d) => (
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td style={{ color: "var(--text-muted)" }}>{d.financial_year}</td>
                  <td>
                    <a href={d.file} target="_blank" rel="noreferrer">
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
