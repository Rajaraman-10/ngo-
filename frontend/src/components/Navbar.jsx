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
        <a href="/#about">About Us</a>
        <a href="/#mission">Our Mission</a>
        <NavLink to="/projects">Our Projects</NavLink>
        <NavLink to="/transparency">Transparency</NavLink>
        <a href="/#impact">Our Impact</a>
        <a href="/#get-involved">Get Involved</a>
        <a href="/#contact">Contact</a>
        {user ? (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <span style={{ color: "var(--text-muted)" }}>{user.username}</span>
            <button onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <NavLink to="/login">Member Login</NavLink>
        )}
        <a href="/#donate" className="btn">
          Donate Now
        </a>
      </nav>
    </header>
  );
}
