import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import Media from "../components/Media";
import { focusAreaLabel } from "../constants/focusAreas";
import { formatDate, formatINR } from "../utils/format";

export default function ProjectDetail() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [beneficiaryCount, setBeneficiaryCount] = useState(null);

  useEffect(() => {
    api
      .get(`/core/projects/${slug}/`)
      .then((res) => setProject(res.data))
      .catch(() => setNotFound(true));
    api.get(`/finance/expenses/?project=${slug}`).then((res) => setExpenses(res.data.results || res.data));
    api.get("/core/activities/").then((res) => setActivities(res.data.results || res.data));
    api.get("/core/impact-updates/").then((res) => setUpdates(res.data.results || res.data));
  }, [slug]);

  useEffect(() => {
    if (!project) return;
    api.get("/core/beneficiaries/").then((res) => {
      const all = res.data.results || res.data;
      setBeneficiaryCount(all.filter((b) => b.project === project.id).length);
    });
  }, [project]);

  if (notFound) {
    return (
      <div className="container">
        <p>Project not found.</p>
        <Link to="/projects">← Back to Projects</Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container">
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  const pct = project.target_budget > 0 ? Math.min(100, (project.funds_spent / project.target_budget) * 100) : 0;
  const projectActivities = activities.filter((a) => a.project_name === project.name);
  const projectUpdates = updates.filter((u) => u.project_name === project.name);

  return (
    <div className="container">
      <Link to="/projects" style={{ fontSize: "0.85rem" }}>
        ← Back to Projects
      </Link>

      <div className="card" style={{ marginTop: 12 }}>
        <Media src={project.cover_image} alt={project.name} placeholder="Project photo not added yet" />
        <h1>{project.name}</h1>
        <div className="actions-row" style={{ marginBottom: 12 }}>
          <span className="badge approved">{project.status}</span>
          <span className="badge draft">{focusAreaLabel(project.focus_area)}</span>
          {project.location && <span className="badge pending_approval">{project.location}</span>}
        </div>
        <p style={{ color: "var(--text-secondary)" }}>{project.description}</p>
        {beneficiaryCount !== null && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{beneficiaryCount} beneficiaries recorded</p>
        )}
      </div>

      <div className="card">
        <h3>Budget &amp; Progress</h3>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="stat-grid" style={{ marginTop: 12 }}>
          <div className="stat-tile">
            <div className="value">{formatINR(project.target_budget)}</div>
            <div className="label">Target Budget</div>
          </div>
          <div className="stat-tile">
            <div className="value">{formatINR(project.funds_received)}</div>
            <div className="label">Funds Received</div>
          </div>
          <div className="stat-tile">
            <div className="value">{formatINR(project.funds_spent)}</div>
            <div className="label">Funds Spent</div>
          </div>
          <div className="stat-tile">
            <div className="value">{formatINR(project.funds_remaining)}</div>
            <div className="label">Remaining</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Expenses</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Expense</th>
              <th>Vendor</th>
              <th className="num">Amount</th>
              <th>Invoice</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.transaction_id}>
                <td>{formatDate(e.date)}</td>
                <td>{e.title}</td>
                <td>{e.vendor}</td>
                <td className="num">{formatINR(e.amount)}</td>
                <td>
                  {e.invoice_url ? (
                    <a href={e.invoice_url} target="_blank" rel="noreferrer">
                      View
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <span className={`badge ${e.status}`}>{e.status}</span>
                </td>
              </tr>
            ))}
            {!expenses.length && (
              <tr>
                <td colSpan={6} style={{ color: "var(--text-muted)" }}>
                  No approved expenses recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {projectUpdates.length > 0 && (
        <div className="card">
          <h3>Updates</h3>
          {projectUpdates.map((u) => (
            <div key={u.id} style={{ marginBottom: 14 }}>
              {u.photo && <Media src={u.photo} alt={u.title} />}
              <strong>{u.title}</strong>{" "}
              <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{formatDate(u.date)}</span>
              <p style={{ color: "var(--text-secondary)", margin: "4px 0" }}>{u.description}</p>
              {u.people_impacted > 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{u.people_impacted} people impacted</p>
              )}
            </div>
          ))}
        </div>
      )}

      {projectActivities.length > 0 && (
        <div className="card">
          <h3>Activities</h3>
          {projectActivities.map((a) => (
            <div key={a.id} style={{ marginBottom: 14 }}>
              {a.photo && <Media src={a.photo} alt={a.title} />}
              <strong>{a.title}</strong>{" "}
              <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{formatDate(a.date)}</span>
              <p style={{ color: "var(--text-secondary)", margin: "4px 0" }}>{a.description}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card donate-cta">
        <h3>Support This Project</h3>
        <Link to={`/donate?project=${project.slug}`} className="btn">
          Donate to {project.name}
        </Link>
      </div>
    </div>
  );
}
