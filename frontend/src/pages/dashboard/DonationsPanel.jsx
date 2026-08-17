import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { formatDate, formatINR } from "../../utils/format";

const CAN_CREATE = ["finance_manager", "accountant", "admin"];

const emptyForm = {
  source: "individual",
  donor_name: "",
  donor_email: "",
  display_donor_publicly: false,
  amount: "",
  date: "",
  purpose: "",
  payment_method: "",
};

export default function DonationsPanel() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const canCreate = CAN_CREATE.includes(user?.role) || user?.is_superuser;
  const isAdmin = user?.role === "admin" || user?.is_superuser;

  async function refresh() {
    const { data } = await api.get("/finance/donations/");
    setDonations(data.results || data);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/finance/donations/", { ...form, amount: Number(form.amount) });
      setForm(emptyForm);
      refresh();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not record donation. Check required fields.");
    }
  }

  async function handleVoid(id) {
    const reason = window.prompt("Reason for voiding this donation:");
    if (!reason) return;
    setError("");
    try {
      await api.post(`/finance/donations/${id}/void/`, { reason });
      refresh();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not void donation.");
    }
  }

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}

      {canCreate && (
        <div className="card">
          <h3>Record a new donation</h3>
          <form onSubmit={handleCreate}>
            <div className="form-grid">
              <div className="field">
                <label>Source</label>
                <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                  <option value="individual">Individual</option>
                  <option value="corporate">Corporate / CSR</option>
                  <option value="grant">Government / Grant</option>
                </select>
              </div>
              <div className="field">
                <label>Donor name</label>
                <input value={form.donor_name} onChange={(e) => setForm({ ...form, donor_name: e.target.value })} />
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
                <label>Purpose</label>
                <input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
              </div>
              <div className="field">
                <label>Payment method</label>
                <input
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                />
              </div>
            </div>
            <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, fontSize: "0.88rem" }}>
              <input
                type="checkbox"
                checked={form.display_donor_publicly}
                onChange={(e) => setForm({ ...form, display_donor_publicly: e.target.checked })}
              />
              Display donor name publicly
            </label>
            <button className="btn" type="submit">
              Record donation
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Donations</h3>
        <table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Donor</th>
              <th>Source</th>
              <th className="num">Amount</th>
              <th>Date</th>
              <th>Status</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {donations.map((d) => (
              <tr key={d.id}>
                <td>{d.transaction_id}</td>
                <td>{d.donor_name || "—"}</td>
                <td>{d.source}</td>
                <td className="num">{formatINR(d.amount)}</td>
                <td>{formatDate(d.date)}</td>
                <td>
                  <span className={`badge ${d.status}`}>{d.status}</span>{" "}
                  {d.is_test && (
                    <span className="badge pending_approval" title="Created via the mock/test payment gateway">
                      Test
                    </span>
                  )}
                </td>
                {isAdmin && (
                  <td>
                    {d.status !== "voided" && (
                      <button className="btn secondary" onClick={() => handleVoid(d.id)}>
                        Void
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {!donations.length && (
              <tr>
                <td colSpan={7} style={{ color: "var(--text-muted)" }}>
                  No donations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
