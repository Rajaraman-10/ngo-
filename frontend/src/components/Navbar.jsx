import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <NavLink to="/" className="brand">
        Asha Foundation
      </NavLink>
      <nav>
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/projects">Projects</NavLink>
        <NavLink to="/transparency">Transparency</NavLink>
        <NavLink to="/verify">Verify Transaction</NavLink>
        {user ? (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <span style={{ color: "var(--text-muted)" }}>{user.username}</span>
            <button onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <NavLink to="/login">Member Login</NavLink>
        )}
      </nav>
    </header>
  );
}
