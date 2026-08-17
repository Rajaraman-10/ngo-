import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { formatINR } from "../utils/format";

export default function Home() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get("/finance/summary/").then((res) => setSummary(res.data));
  }, []);

  return (
    <div>
      <section className="hero">
        <h1>Every rupee received, every rupee spent.</h1>
        <p>
          Asha Foundation publishes its full donation and expense ledger in real time, with an
          invoice attached to every transaction, so anyone can verify where the money goes.
        </p>
        <Link to="/transparency" className="btn">
          View full transparency dashboard
        </Link>
      </section>

      <div className="container">
        <div className="stat-grid">
          <div className="stat-tile">
            <div className="value">{summary ? formatINR(summary.total_received) : "—"}</div>
            <div className="label">Total Funds Received</div>
          </div>
          <div className="stat-tile">
            <div className="value">{summary ? formatINR(summary.total_spent) : "—"}</div>
            <div className="label">Total Funds Spent</div>
          </div>
          <div className="stat-tile">
            <div className="value">{summary ? formatINR(summary.balance) : "—"}</div>
            <div className="label">Available Balance</div>
          </div>
          <div className="stat-tile">
            <div className="value">{summary ? `${summary.utilization_percent}%` : "—"}</div>
            <div className="label">Funds Utilized</div>
          </div>
        </div>

        <div className="card">
          <h2>Our Mission</h2>
          <p>
            We run education, food-security and healthcare programs for underserved communities,
            funded entirely by public donations and grants. Every donation and expense we record is
            published on this website with supporting invoices.
          </p>
          <Link to="/projects">See our active projects →</Link>
        </div>
      </div>
    </div>
  );
}
