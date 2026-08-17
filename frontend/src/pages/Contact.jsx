import { useState } from "react";
import { api } from "../api/client";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.post("/core/inquiries/", { kind: "contact", ...form });
      setStatus("Thanks for reaching out — we'll get back to you soon.");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("Something went wrong sending your message. Please try again.");
    }
  }

  return (
    <div className="container">
      <h1>Let's Create Change Together</h1>
      <div className="contact-grid">
        <div className="card">
          <p>
            <strong>Address</strong>
            <br />
            123 Example Street, Chennai, Tamil Nadu, India
          </p>
          <p>
            <strong>Phone</strong>
            <br />
            +91 00000 00000
          </p>
          <p>
            <strong>Email</strong>
            <br />
            contact@ashafoundation.org
          </p>
          <div className="social-row">
            <span>Instagram</span>
            <span>Facebook</span>
            <span>LinkedIn</span>
            <span>YouTube</span>
          </div>
        </div>
        <form className="card" onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Message</label>
            <textarea
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
          </div>
          <button className="btn" type="submit">
            Send Message
          </button>
          {status && <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 10 }}>{status}</p>}
        </form>
      </div>
    </div>
  );
}
