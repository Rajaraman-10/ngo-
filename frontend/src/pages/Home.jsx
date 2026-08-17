import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import FlowDiagram from "../components/FlowDiagram";
import { FOCUS_AREAS, focusAreaLabel } from "../constants/focusAreas";
import { formatDate, formatINR } from "../utils/format";

const SOURCE_LABELS = {
  individual: "Individual donations",
  corporate: "Corporate / CSR",
  grant: "Government / Grant",
};

function Hero() {
  return (
    <section className="hero" id="hero">
      <h1>A Better Life Should Be Possible for Everyone.</h1>
      <p>
        We believe education, opportunity, food, shelter, and a clean environment are the
        foundations of a dignified life.
      </p>
      <div className="actions-row" style={{ justifyContent: "center" }}>
        <a href="#mission" className="btn">
          Our Mission
        </a>
        <a href="#donate" className="btn secondary">
          Donate Now
        </a>
      </div>
      <ul className="trust-indicators">
        <li>✓ Transparent Funds</li>
        <li>✓ Verified Expenses</li>
        <li>✓ Public Reports</li>
        <li>✓ Every Contribution Accounted For</li>
      </ul>
    </section>
  );
}

function AboutUs() {
  return (
    <section className="container" id="about">
      <div className="card">
        <h2>About Us</h2>
        <p style={{ color: "var(--text-secondary)" }}>
          Asha Foundation runs education, employment, food-security, housing and sanitation
          programs for underserved communities — funded entirely by public donations and grants,
          and published in full on this website.
        </p>
      </div>
    </section>
  );
}

function MissionPillars() {
  return (
    <section className="container" id="mission">
      <h2>Five Foundations for a Better Life</h2>
      <div className="pillar-grid">
        {FOCUS_AREAS.map((f) => (
          <Link to={`/projects?focus=${f.key}`} className="pillar-card" key={f.key}>
            <div className="pillar-icon" style={{ background: f.color }}>
              {f.icon}
            </div>
            <h3>{f.label}</h3>
            <p className="pillar-tagline">{f.tagline}</p>
            <p className="pillar-description">{f.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Philosophy() {
  return (
    <section className="container">
      <div className="card philosophy-card">
        <h2>We Don't Just Give. We Help People Grow.</h2>
        <FlowDiagram steps={["Opportunity", "Education", "Skills", "Employment", "Independence", "Better Future"]} />
        <p style={{ color: "var(--text-secondary)", maxWidth: 640 }}>
          We believe meaningful change is not about creating dependence. It is about giving
          people the foundation, opportunity, and support they need to build their own future.
        </p>
      </div>
    </section>
  );
}

function FinancialTransparency({ summary }) {
  const totalSpent = summary ? Number(summary.total_spent) : 0;
  const byFocusArea = summary?.expenses_by_focus_area || {};
  const rows = Object.entries(byFocusArea)
    .filter(([key]) => key !== "other" || Number(byFocusArea.other) > 0)
    .map(([key, value]) => ({
      label: focusAreaLabel(key),
      value: Number(value),
      percent: totalSpent ? Math.round((Number(value) / totalSpent) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <section className="container" id="transparency">
      <h2>Every Rupee. Accounted For.</h2>
      {summary && (
        <div className="stat-grid">
          <div className="stat-tile">
            <div className="value">{formatINR(summary.total_received)}</div>
            <div className="label">Total Funds Received</div>
          </div>
          <div className="stat-tile">
            <div className="value">{formatINR(summary.total_spent)}</div>
            <div className="label">Total Funds Spent</div>
          </div>
          <div className="stat-tile">
            <div className="value">{formatINR(summary.balance)}</div>
            <div className="label">Available Balance</div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Where the money goes</h3>
        {rows.length ? (
          rows.map((row) => (
            <div className="bar-row" key={row.label}>
              <span>{row.label}</span>
              <div className="track">
                <div className="fill" style={{ width: `${row.percent}%` }} />
              </div>
              <span className="amount">{row.percent}%</span>
            </div>
          ))
        ) : (
          <p style={{ color: "var(--text-muted)" }}>No approved expenses recorded yet.</p>
        )}
      </div>

      <Link to="/transparency" className="btn">
        View Complete Financial Transparency →
      </Link>
    </section>
  );
}

function RecentTransactions({ transactions }) {
  return (
    <section className="container">
      <h2>Recent Financial Activity</h2>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction</th>
              <th>Project</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.transaction_id}>
                <td>{formatDate(t.date)}</td>
                <td>{t.kind === "donation" ? "Donation" : t.title}</td>
                <td>{t.project_name || t.purpose || "General"}</td>
                <td className={`num ${t.kind === "donation" ? "amount-positive" : "amount-negative"}`}>
                  {t.kind === "donation" ? "+" : "-"}
                  {formatINR(t.amount)}
                </td>
              </tr>
            ))}
            {!transactions.length && (
              <tr>
                <td colSpan={4} style={{ color: "var(--text-muted)" }}>
                  No transactions recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Link to="/transparency" className="btn secondary">
        View All Transactions
      </Link>
    </section>
  );
}

function MoneyFlow() {
  return (
    <section className="container">
      <div className="card philosophy-card">
        <h2>From Your Contribution to Real Impact</h2>
        <FlowDiagram
          steps={[
            "Donation",
            "Funds Received",
            "Project Allocation",
            "Expense",
            "Invoice Uploaded",
            "Expense Approved",
            "Publicly Recorded",
            "Impact",
          ]}
        />
        <p style={{ color: "var(--text-secondary)", maxWidth: 640 }}>
          Every approved expense is recorded and supported by documentation wherever applicable.
        </p>
      </div>
    </section>
  );
}

function ProjectsPreview({ projects }) {
  const featured = projects.slice(0, 3);
  return (
    <section className="container">
      <h2>Creating Change Where It Matters</h2>
      {!featured.length && <p style={{ color: "var(--text-muted)" }}>No projects published yet.</p>}
      {featured.map((p) => {
        const pct = p.target_budget > 0 ? Math.min(100, (p.funds_spent / p.target_budget) * 100) : 0;
        return (
          <div className="card" key={p.id}>
            <h3>
              {focusAreaLabel(p.focus_area)}: {p.name}
            </h3>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Target {formatINR(p.target_budget)} · Received {formatINR(p.funds_received)} · Spent{" "}
              {formatINR(p.funds_spent)} · {pct.toFixed(0)}%
            </p>
          </div>
        );
      })}
      <Link to="/projects" className="btn">
        View All Projects
      </Link>
    </section>
  );
}

function ImpactStats({ summary, projects }) {
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const byFocusArea = summary?.beneficiaries_by_focus_area || {};

  const tiles = [
    { value: summary?.total_beneficiaries ?? 0, label: "People Supported" },
    { value: activeProjects, label: "Active Projects" },
    ...FOCUS_AREAS.filter((f) => byFocusArea[f.key]).map((f) => ({
      value: byFocusArea[f.key],
      label: `${f.label} Beneficiaries`,
    })),
  ];

  return (
    <section className="container" id="impact">
      <h2>Our Impact</h2>
      <p style={{ color: "var(--text-secondary)" }}>
        These figures are computed live from our records, not estimated — they grow as projects
        record real beneficiaries.
      </p>
      <div className="stat-grid">
        {tiles.map((t) => (
          <div className="stat-tile" key={t.label}>
            <div className="value">{t.value}</div>
            <div className="label">{t.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stories() {
  return (
    <section className="container">
      <h2>Stories of Change</h2>
      <div className="card">
        <p style={{ color: "var(--text-muted)" }}>
          We haven't published any beneficiary stories yet — real stories are shared here only
          with the person's consent. Check back as our programs grow.
        </p>
      </div>
    </section>
  );
}

function Gallery() {
  return (
    <section className="container">
      <h2>What We're Doing</h2>
      <div className="gallery-grid">
        {FOCUS_AREAS.map((f) => (
          <div className="gallery-tile" key={f.key} style={{ background: f.color }}>
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </div>
        ))}
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
        Placeholder tiles — replace with real activity photos as they're uploaded.
      </p>
    </section>
  );
}

function Accountability() {
  const items = [
    "Public Fund Records",
    "Public Expense Records",
    "Invoice Documents",
    "Financial Reports",
    "Audited Financial Statements",
    "Project Reports",
    "Role-Based Member Accountability",
    "Approval Workflow on Every Expense",
  ];
  return (
    <section className="container">
      <div className="card">
        <h2>Built on Trust</h2>
        <ul className="checklist">
          {items.map((item) => (
            <li key={item}>✓ {item}</li>
          ))}
        </ul>
        <Link to="/transparency" className="btn">
          Explore Transparency Center
        </Link>
      </div>
    </section>
  );
}

function DocumentsPreview({ documents }) {
  return (
    <section className="container" id="documents">
      <h2>Open Documents</h2>
      <div className="card">
        {documents.length ? (
          <table>
            <tbody>
              {documents.slice(0, 6).map((d) => (
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td style={{ color: "var(--text-muted)" }}>{d.financial_year}</td>
                  <td>
                    <a href={d.file} target="_blank" rel="noreferrer">
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: "var(--text-muted)" }}>No public documents uploaded yet.</p>
        )}
      </div>
    </section>
  );
}

function GetInvolved() {
  const options = [
    { icon: "❤️", title: "Donate", desc: "Support our programs.", href: "#donate" },
    { icon: "🤝", title: "Volunteer", desc: "Give your time and skills.", href: "#contact" },
    { icon: "💼", title: "Create Opportunities", desc: "Help us connect people with jobs.", href: "#contact" },
    { icon: "🏫", title: "Partner With Us", desc: "Schools, companies and organizations can collaborate.", href: "#contact" },
    { icon: "📢", title: "Spread Awareness", desc: "Share our mission.", href: "#contact" },
  ];
  return (
    <section className="container" id="get-involved">
      <h2>You Can Make a Difference</h2>
      <div className="pillar-grid">
        {options.map((o) => (
          <a href={o.href} className="pillar-card" key={o.title}>
            <div className="pillar-icon" style={{ background: "var(--series-1)" }}>
              {o.icon}
            </div>
            <h3>{o.title}</h3>
            <p className="pillar-description">{o.desc}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function DonateCTA() {
  return (
    <section className="container" id="donate">
      <div className="card donate-cta">
        <h2>Be Part of Someone's New Beginning</h2>
        <p style={{ color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto 16px" }}>
          Your contribution can become a child's education, a family's meal, a person's
          opportunity, or a family's safe home.
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: 16 }}>
          Online donations aren't wired up on this scaffold yet — reach us at the contact details
          below to donate today.
        </p>
        <a href="#contact" className="btn">
          Donate Now
        </a>
        <p style={{ marginTop: 12, color: "var(--success-text)", fontWeight: 600, fontSize: "0.85rem" }}>
          100% Transparent Financial Records
        </p>
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setMessage("Thanks for your interest — email signup isn't wired up on this scaffold yet.");
    setEmail("");
  }

  return (
    <section className="container">
      <div className="card" style={{ textAlign: "center" }}>
        <h2>Stay Connected</h2>
        <form onSubmit={handleSubmit} className="newsletter-form">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="btn" type="submit">
            Subscribe
          </button>
        </form>
        {message && <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 10 }}>{message}</p>}
      </div>
    </section>
  );
}

function Contact() {
  const [message, setMessage] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setMessage("Thanks for reaching out — this form isn't wired up on this scaffold yet.");
  }

  return (
    <section className="container" id="contact">
      <h2>Let's Create Change Together</h2>
      <div className="contact-grid">
        <div className="card">
          <p>
            <strong>Address</strong>
            <br />
            123 Example Street, Chennai, Tamil Nadu, India
          </p>
          <p>
            <strong>Phone</strong>
            <br />
            +91 00000 00000
          </p>
          <p>
            <strong>Email</strong>
            <br />
            contact@ashafoundation.org
          </p>
          <div className="social-row">
            <span>Instagram</span>
            <span>Facebook</span>
            <span>LinkedIn</span>
            <span>YouTube</span>
          </div>
        </div>
        <form className="card" onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Name</label>
            <input required />
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Email</label>
            <input type="email" required />
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Message</label>
            <textarea rows={3} required />
          </div>
          <button className="btn" type="submit">
            Send Message
          </button>
          {message && <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 10 }}>{message}</p>}
        </form>
      </div>
    </section>
  );
}

export default function Home() {
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    api.get("/finance/summary/").then((res) => setSummary(res.data));
    api.get("/core/projects/").then((res) => setProjects(res.data.results || res.data));
    api.get("/documents/documents/").then((res) => setDocuments(res.data.results || res.data));

    Promise.all([api.get("/finance/donations/"), api.get("/finance/expenses/")]).then(
      ([donationsRes, expensesRes]) => {
        const donations = (donationsRes.data.results || donationsRes.data).map((d) => ({
          kind: "donation",
          transaction_id: d.transaction_id,
          date: d.date,
          amount: d.amount,
          project_name: d.project_name,
          purpose: d.purpose,
        }));
        const expenses = (expensesRes.data.results || expensesRes.data).map((e) => ({
          kind: "expense",
          transaction_id: e.transaction_id,
          date: e.date,
          amount: e.amount,
          title: e.title,
          project_name: e.project_name,
        }));
        const merged = [...donations, ...expenses]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 6);
        setTransactions(merged);
      }
    );
  }, []);

  return (
    <div>
      <Hero />
      <AboutUs />
      <MissionPillars />
      <Philosophy />
      <FinancialTransparency summary={summary} />
      <RecentTransactions transactions={transactions} />
      <MoneyFlow />
      <ProjectsPreview projects={projects} />
      <ImpactStats summary={summary} projects={projects} />
      <Stories />
      <Gallery />
      <Accountability />
      <DocumentsPreview documents={documents} />
      <GetInvolved />
      <DonateCTA />
      <Newsletter />
      <Contact />
    </div>
  );
}
