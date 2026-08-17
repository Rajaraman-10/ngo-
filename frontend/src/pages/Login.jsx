import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const user = await login(username, password);
      if (user?.role === "donor") navigate("/my-impact");
      else if (user?.role === "member") navigate("/member-dashboard");
      else navigate("/dashboard");
    } catch {
      setError("Invalid username or password.");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h1>Log In</h1>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleSubmit} className="card">
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn" type="submit">
          Log in
        </button>
      </form>
      <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
        New donor? <Link to="/register">Create an account</Link> to track your impact automatically.
      </p>
    </div>
  );
}
