import { Link } from "react-router-dom";
import { FOCUS_AREAS } from "../constants/focusAreas";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div>
          <div className="brand" style={{ marginBottom: 8 }}>
            Asha Foundation
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
                <Link to={`/projects?focus=${f.key}`}>{f.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Quick Links</h4>
          <ul>
            <li>
              <a href="/#about">About</a>
            </li>
            <li>
              <Link to="/projects">Projects</Link>
            </li>
            <li>
              <a href="/#impact">Impact</a>
            </li>
            <li>
              <Link to="/transparency">Transparency</Link>
            </li>
            <li>
              <a href="/#documents">Reports</a>
            </li>
            <li>
              <a href="/#contact">Contact</a>
            </li>
          </ul>
        </div>

        <div>
          <h4>Get Involved</h4>
          <ul>
            <li>
              <a href="/#donate">Donate</a>
            </li>
            <li>
              <a href="/#get-involved">Volunteer</a>
            </li>
            <li>
              <a href="/#get-involved">Partner</a>
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
              <Link to="/verify">Verify a Transaction</Link>
            </li>
            <li>
              <a href="/#documents">Annual Reports</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} Asha Foundation. All rights reserved.</span>
        <span className="site-footer-legal">Privacy Policy · Terms · Donation Policy</span>
      </div>
    </footer>
  );
}
