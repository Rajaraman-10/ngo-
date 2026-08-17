import { Link, NavLink, useNavigate } from "react-router-dom";
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
        <NavLink to="/about">About Us</NavLink>
        <NavLink to="/mission">Our Mission</NavLink>
        <NavLink to="/projects">Our Projects</NavLink>
        <NavLink to="/impact">Our Impact</NavLink>
        <NavLink to="/transparency">Transparency</NavLink>
        <NavLink to="/get-involved">Get Involved</NavLink>
        <NavLink to="/contact">Contact</NavLink>
        {user ? (
          <>
            <NavLink to={user.role === "donor" ? "/my-impact" : "/dashboard"}>
              {user.role === "donor" ? "My Impact" : "Dashboard"}
            </NavLink>
            <span style={{ color: "var(--text-muted)" }}>{user.username}</span>
            <button onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <NavLink to="/login">Login</NavLink>
        )}
        <Link to="/donate" className="btn">
          Donate Now
        </Link>
      </nav>
    </header>
  );
}
