import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { FOCUS_AREAS } from "../constants/focusAreas";
import { useAuth } from "../context/AuthContext";

const PRESETS = [100, 500, 1000, 5000];

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Donate() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [config, setConfig] = useState(null);
  const [amount, setAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");
  const [mission, setMission] = useState(searchParams.get("mission") || searchParams.get("project") || "where_needed_most");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [displayPublicly, setDisplayPublicly] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/finance/donate/config/").then((res) => setConfig(res.data));
  }, []);

  useEffect(() => {
    if (user) {
      setDonorName(`${user.first_name} ${user.last_name}`.trim() || user.username);
      setDonorEmail(user.email || "");
    }
  }, [user]);

  const isProjectSlug = searchParams.get("project");
  const finalAmount = customAmount ? Number(customAmount) : amount;

  async function handleDonate(e) {
    e.preventDefault();
    setError("");
    if (!finalAmount || finalAmount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: order } = await api.post("/finance/donate/create-order/", {
        amount: finalAmount,
        project_slug: isProjectSlug || undefined,
        mission: isProjectSlug ? undefined : mission,
        donor_name: donorName,
        donor_email: donorEmail,
        display_donor_publicly: displayPublicly,
      });

      if (order.provider === "mock") {
        // No real gateway configured — the backend's MockPaymentService stands in for
        // one. There's no external checkout to open; we just ask it to confirm the
        // order it already created, same as Razorpay's callback would.
        try {
          const { data: donation } = await api.post("/finance/donate/mock-confirm/", { order_id: order.order_id });
          navigate(`/verify?tx=${donation.transaction_id}`);
        } catch {
          setError("Could not complete the test payment. Please try again.");
          setSubmitting(false);
        }
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Could not load the payment widget. Check your connection and try again.");
        setSubmitting(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Swathi Foundation",
        description: "Donation",
        order_id: order.order_id,
        prefill: { name: donorName, email: donorEmail },
        theme: { color: "#2a78d6" },
        handler: async (response) => {
          try {
            const { data: donation } = await api.post("/finance/donate/verify/", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            navigate(`/verify?tx=${donation.transaction_id}`);
          } catch {
            setError("Payment succeeded but verification failed — contact us with your payment ID.");
          }
        },
        modal: { ondismiss: () => setSubmitting(false) },
      });
      razorpay.open();
    } catch (err) {
      if (err.response?.status === 503) {
        setError(err.response.data.detail);
      } else {
        setError("Could not start the donation. Please try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <h1>Donate</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Even ₹1 matters — your contribution is pooled with others toward the mission you
        choose, and you can trace exactly where it went afterward.
      </p>

      {config && config.provider === null && (
        <div className="error-banner">
          Online payments aren't configured on this deployment yet — add Razorpay keys to
          the backend <code>.env</code> to enable checkout. This form is fully wired and will
          work as soon as keys are added.
        </div>
      )}

      {config && config.provider === "mock" && (
        <div className="error-banner">
          Test mode — no Razorpay keys are configured, so this uses a simulated payment
          gateway instead. Donations made here are real database records marked{" "}
          <strong>is_test</strong>, kept out of the public transparency ledger and homepage
          totals. Add Razorpay keys to the backend <code>.env</code> to accept real payments.
        </div>
      )}

      <form onSubmit={handleDonate} className="card">
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Amount (₹)</label>
          <div className="actions-row">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                className={`btn ${amount === p && !customAmount ? "" : "secondary"}`}
                onClick={() => {
                  setAmount(p);
                  setCustomAmount("");
                }}
              >
                ₹{p}
              </button>
            ))}
          </div>
          <input
            type="number"
            min="1"
            placeholder="Custom amount"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>

        {!isProjectSlug && (
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Choose Mission</label>
            <select value={mission} onChange={(e) => setMission(e.target.value)}>
              <option value="where_needed_most">Where Needed Most</option>
              {FOCUS_AREAS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.icon} {f.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Your Name</label>
          <input value={donorName} onChange={(e) => setDonorName(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Email</label>
          <input type="email" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} required />
        </div>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, fontSize: "0.88rem" }}>
          <input type="checkbox" checked={displayPublicly} onChange={(e) => setDisplayPublicly(e.target.checked)} />
          Display my name publicly on the transparency ledger
        </label>

        {error && <div className="error-banner">{error}</div>}

        <button className="btn" type="submit" disabled={submitting || !config}>
          {submitting ? "Processing…" : `Donate ₹${finalAmount || 0}`}
        </button>
      </form>

      <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
        We don't claim your exact rupee bought a specific item — pooled donations fund each
        project together, and you can see the real, combined progress on the project page
        afterward.
      </p>
    </div>
  );
}
