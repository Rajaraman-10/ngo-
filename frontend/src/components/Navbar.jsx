import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/");
    setOpen(false);
  }

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="navbar">
      <NavLink to="/" className="brand" onClick={closeMenu}>
        Swathi Foundation
      </NavLink>
      <button
        type="button"
        className="navbar-toggle"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "✕" : "☰"}
      </button>
      <nav className={open ? "open" : ""}>
        <NavLink to="/" end onClick={closeMenu}>
          Home
        </NavLink>
        <NavLink to="/about" onClick={closeMenu}>
          About Us
        </NavLink>
        <NavLink to="/mission" onClick={closeMenu}>
          Our Mission
        </NavLink>
        <NavLink to="/projects" onClick={closeMenu}>
          Our Projects
        </NavLink>
        <NavLink to="/impact" onClick={closeMenu}>
          Our Impact
        </NavLink>
        <NavLink to="/transparency" onClick={closeMenu}>
          Transparency
        </NavLink>
        <NavLink to="/get-involved" onClick={closeMenu}>
          Get Involved
        </NavLink>
        <NavLink to="/join" onClick={closeMenu}>
          Join Swathi
        </NavLink>
        <NavLink to="/contact" onClick={closeMenu}>
          Contact
        </NavLink>
        {user ? (
          <>
            <NavLink
              to={user.role === "donor" ? "/my-impact" : user.role === "member" ? "/member-dashboard" : "/dashboard"}
              onClick={closeMenu}
            >
              {user.role === "donor" ? "My Impact" : user.role === "member" ? "My Swathi" : "Dashboard"}
            </NavLink>
            <span style={{ color: "var(--text-muted)" }}>{user.username}</span>
            <button onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <NavLink to="/login" onClick={closeMenu}>
            Login
          </NavLink>
        )}
        <Link to="/donate" className="btn" onClick={closeMenu}>
          Donate Now
        </Link>
      </nav>
    </header>
  );
}
