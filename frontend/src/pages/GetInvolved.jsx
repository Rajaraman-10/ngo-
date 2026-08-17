import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

const OPTIONS = [
  { kind: "volunteer", icon: "🤝", title: "Volunteer", desc: "Give your time and skills." },
  { kind: "employer", icon: "💼", title: "Provide Employment Opportunities", desc: "Help us connect people with jobs." },
  { kind: "sponsor", icon: "🎯", title: "Sponsor a Project", desc: "Fund a specific project end-to-end." },
  { kind: "fundraise", icon: "📣", title: "Fundraise", desc: "Run a fundraiser for us in your community." },
  { kind: "partner", icon: "🏫", title: "Partner With Us", desc: "Schools, companies and organizations can collaborate." },
  { kind: "awareness", icon: "📢", title: "Spread Awareness", desc: "Share our mission with your network." },
];

function InquiryForm({ kind, onDone }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.post("/core/inquiries/", { kind, ...form });
      setStatus("Thanks — we've received your message and will be in touch.");
      setForm({ name: "", email: "", phone: "", message: "" });
      onDone?.();
    } catch {
      setStatus("Something went wrong. Please try again.");
    }
  }

  if (status) {
    return <p style={{ color: "var(--success-text)", fontSize: "0.88rem" }}>{status}</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="field">
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label>Phone (optional)</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
      </div>
      <div className="field" style={{ marginBottom: 14 }}>
        <label>Message</label>
        <textarea rows={2} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      </div>
      <button className="btn" type="submit">
        Submit
      </button>
    </form>
  );
}

export default function GetInvolved() {
  const [openKind, setOpenKind] = useState(null);

  return (
    <div className="container">
      <h1>You Can Make a Difference</h1>
      <p style={{ color: "var(--text-secondary)" }}>Not everyone wants to donate money — here are other ways to help.</p>

      <div className="card">
        <h3>❤️ Donate</h3>
        <p style={{ color: "var(--text-secondary)" }}>Support our programs directly.</p>
        <Link to="/donate" className="btn">
          Donate Now
        </Link>
      </div>

      {OPTIONS.map((o) => (
        <div className="card" key={o.kind}>
          <h3>
            {o.icon} {o.title}
          </h3>
          <p style={{ color: "var(--text-secondary)" }}>{o.desc}</p>
          {openKind === o.kind ? (
            <InquiryForm kind={o.kind} />
          ) : (
            <button className="btn secondary" onClick={() => setOpenKind(o.kind)}>
              Get Started
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
