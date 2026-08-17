import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const emptyForm = { username: "", email: "", first_name: "", last_name: "", password: "" };

export default function Register() {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/accounts/register/", form);
      await login(form.username, form.password);
      navigate("/my-impact");
    } catch (err) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join(" ") : "Could not create your account.");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 460 }}>
      <h1>Create a Donor Account</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Track your contributions automatically and see the impact of every donation in one place.
      </p>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleSubmit} className="card">
        <div className="form-grid">
          <div className="field">
            <label>First name</label>
            <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div className="field">
            <label>Last name</label>
            <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Username</label>
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        <button className="btn" type="submit">
          Create Account
        </button>
      </form>
      <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
