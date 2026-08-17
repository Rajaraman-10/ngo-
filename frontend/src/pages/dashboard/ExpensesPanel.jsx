import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { formatDate, formatINR } from "../../utils/format";

const CAN_CREATE = ["finance_manager", "accountant", "project_manager", "admin"];
const CAN_APPROVE = ["finance_manager", "admin"];

const emptyForm = { title: "", category: "", amount: "", date: "", vendor: "", description: "", project: "" };

export default function ExpensesPanel() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [error, setError] = useState("");

  const canCreate = CAN_CREATE.includes(user?.role) || user?.is_superuser;
  const canApprove = CAN_APPROVE.includes(user?.role) || user?.is_superuser;
  const isAdmin = user?.role === "admin" || user?.is_superuser;

  async function refresh() {
    const { data } = await api.get("/finance/expenses/");
    setExpenses(data.results || data);
  }

  useEffect(() => {
    refresh();
    api.get("/core/projects/").then((res) => setProjects(res.data.results || res.data));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      const { data: expense } = await api.post("/finance/expenses/", {
        ...form,
        project: form.project || null,
        amount: Number(form.amount),
      });
      if (invoiceFile) {
        const fd = new FormData();
        fd.append("expense", expense.id);
        fd.append("file", invoiceFile);
        fd.append("invoice_number", invoiceNumber);
        await api.post("/finance/invoices/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      setForm(emptyForm);
      setInvoiceFile(null);
      setInvoiceNumber("");
      refresh();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create expense. Check required fields.");
    }
  }

  async function callAction(id, action, extra = {}) {
    setError("");
    try {
      await api.post(`/finance/expenses/${id}/${action}/`, extra);
      refresh();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.[0] || `Could not ${action} expense.`);
    }
  }

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}

      {canCreate && (
        <div className="card">
          <h3>Record a new expense</h3>
          <form onSubmit={handleCreate}>
            <div className="form-grid">
              <div className="field">
                <label>Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Project</label>
                <select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>
                  <option value="">— None —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Vendor</label>
                <input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
              </div>
              <div className="field">
                <label>Invoice number</label>
                <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </div>
              <div className="field">
                <label>Invoice file</label>
                <input type="file" onChange={(e) => setInvoiceFile(e.target.files[0])} />
              </div>
            </div>
            <div className="field" style={{ marginBottom: 14 }}>
              <label>Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <button className="btn" type="submit">
              Save as draft
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Expenses</h3>
        <table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Title</th>
              <th className="num">Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Invoice</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id}>
                <td>{exp.transaction_id}</td>
                <td>{exp.title}</td>
                <td className="num">{formatINR(exp.amount)}</td>
                <td>{formatDate(exp.date)}</td>
                <td>
                  <span className={`badge ${exp.status}`}>{exp.status.replace("_", " ")}</span>
                </td>
                <td>{exp.invoice ? "Attached" : "Missing"}</td>
                <td>
                  <div className="actions-row">
                    {exp.status === "draft" && canCreate && (
                      <button className="btn secondary" onClick={() => callAction(exp.id, "submit")}>
                        Submit for approval
                      </button>
                    )}
                    {exp.status === "pending_approval" && canApprove && (
                      <>
                        <button className="btn" onClick={() => callAction(exp.id, "approve")}>
                          Approve
                        </button>
                        <button className="btn danger" onClick={() => callAction(exp.id, "reject")}>
                          Reject
                        </button>
                      </>
                    )}
                    {isAdmin && exp.status !== "voided" && (
                      <button
                        className="btn secondary"
                        onClick={() => {
                          const reason = window.prompt("Reason for voiding this expense:");
                          if (reason) callAction(exp.id, "void", { reason });
                        }}
                      >
                        Void
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!expenses.length && (
              <tr>
                <td colSpan={7} style={{ color: "var(--text-muted)" }}>
                  No expenses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
