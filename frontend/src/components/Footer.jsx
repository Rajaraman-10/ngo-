import { Link } from "react-router-dom";
import { FOCUS_AREAS } from "../constants/focusAreas";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div>
          <div className="brand" style={{ marginBottom: 8 }}>
            amma Foundation
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", maxWidth: 260 }}>
            A better life should be possible for everyone.
          </p>
        </div>

        <div>
          <h4>Mission</h4>
          <ul>
            {FOCUS_AREAS.map((f) => (
              <li key={f.key}>
                <Link to={`/mission/${f.key}`}>{f.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Quick Links</h4>
          <ul>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/projects">Projects</Link>
            </li>
            <li>
              <Link to="/impact">Impact</Link>
            </li>
            <li>
              <Link to="/transparency">Transparency</Link>
            </li>
            <li>
              <Link to="/news">News</Link>
            </li>
            <li>
              <Link to="/stories">Stories</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Get Involved</h4>
          <ul>
            <li>
              <Link to="/donate">Donate</Link>
            </li>
            <li>
              <Link to="/get-involved">Volunteer</Link>
            </li>
            <li>
              <Link to="/get-involved">Partner</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Transparency</h4>
          <ul>
            <li>
              <Link to="/transparency">Fund Records</Link>
            </li>
            <li>
              <Link to="/transparency">Expenses</Link>
            </li>
            <li>
              <Link to="/verify">Track Your Contribution</Link>
            </li>
            <li>
              <Link to="/my-impact">My Impact</Link>
            </li>
            <li>
              <Link to="/reports">Reports &amp; Documents</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} amma Foundation. All rights reserved.</span>
        <span className="site-footer-legal">Privacy Policy · Terms · Donation Policy</span>
      </div>
    </footer>
  );
}
