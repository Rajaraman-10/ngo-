import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import FlowDiagram from "../components/FlowDiagram";
import Media from "../components/Media";
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
        <Link to="/donate" className="btn secondary">
          Donate Now
        </Link>
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
          <Link to={`/mission/${f.key}`} className="pillar-card" key={f.key}>
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

function DonationJourney() {
  return (
    <section className="container" id="donation-journey">
      <div className="card philosophy-card">
        <h2>Every Rupee. Every Action. Every Impact.</h2>
        <p style={{ color: "var(--text-secondary)", maxWidth: 640, margin: "0 auto" }}>
          <strong>Every contribution deserves an answer.</strong> Whether you give ₹1 or
          ₹1,00,000, you should be able to know where it went, what it provided, and what
          changed because of it.
        </p>
        <FlowDiagram
          steps={[
            "You Donate",
            "Receipt",
            "Project Allocation",
            "Expense + Invoice Recorded",
            "Progress Updated",
            "You See the Impact",
          ]}
        />
        <p style={{ color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto 8px" }}>
          Every approved expense is recorded and supported by documentation wherever applicable —
          look up any transaction ID to trace it yourself.
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", maxWidth: 560, margin: "0 auto 20px" }}>
          ₹1 × 10,000 people = ₹10,000. No contribution is too small to create change.
        </p>
        <Link to="/verify" className="btn">
          Track Your Contribution →
        </Link>
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
            <Link to={`/projects/${p.slug}`}>View Project →</Link>
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
      <Link to="/impact" className="btn secondary">
        View Impact Dashboard
      </Link>
    </section>
  );
}

function RecentImpactUpdates({ updates }) {
  const recent = updates.slice(0, 3);
  return (
    <section className="container">
      <h2>Recent Impact Updates</h2>
      {!recent.length && (
        <div className="card">
          <p style={{ color: "var(--text-muted)" }}>No impact updates published yet.</p>
        </div>
      )}
      {recent.map((u) => (
        <div className="card" key={u.id}>
          <Media src={u.photo} alt={u.title} />
          <h3>{u.title}</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
            {formatDate(u.date)} · {u.project_name}
          </p>
          <p style={{ color: "var(--text-secondary)" }}>{u.description}</p>
          {u.people_impacted > 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{u.people_impacted} people impacted</p>
          )}
        </div>
      ))}
      <Link to="/impact-updates" className="btn secondary">
        View All Updates
      </Link>
    </section>
  );
}

function Stories({ stories }) {
  const recent = stories.slice(0, 2);
  return (
    <section className="container">
      <h2>Stories of Change</h2>
      {!recent.length && (
        <div className="card">
          <p style={{ color: "var(--text-muted)" }}>
            We haven't published any beneficiary stories yet — real stories are shared here only
            with the person's consent. Check back as our programs grow.
          </p>
        </div>
      )}
      {recent.map((s) => (
        <div className="card" key={s.id}>
          <Media src={s.photo} alt={s.title} placeholder="Photo shared with consent, not yet added" />
          <h3>{s.title}</h3>
          <p style={{ color: "var(--text-secondary)" }}>{s.current_situation}</p>
        </div>
      ))}
      {recent.length > 0 && (
        <Link to="/stories" className="btn secondary">
          Read More Stories
        </Link>
      )}
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

function GetInvolvedTeaser() {
  const options = [
    { icon: "❤️", title: "Donate", desc: "Support our programs.", to: "/donate" },
    { icon: "🤝", title: "Volunteer", desc: "Give your time and skills.", to: "/get-involved" },
    { icon: "💼", title: "Create Opportunities", desc: "Help us connect people with jobs.", to: "/get-involved" },
    { icon: "🏫", title: "Partner With Us", desc: "Schools, companies and organizations can collaborate.", to: "/get-involved" },
    { icon: "📢", title: "Spread Awareness", desc: "Share our mission.", to: "/get-involved" },
  ];
  return (
    <section className="container" id="get-involved">
      <h2>You Can Make a Difference</h2>
      <div className="pillar-grid">
        {options.map((o) => (
          <Link to={o.to} className="pillar-card" key={o.title}>
            <div className="pillar-icon" style={{ background: "var(--series-1)" }}>
              {o.icon}
            </div>
            <h3>{o.title}</h3>
            <p className="pillar-description">{o.desc}</p>
          </Link>
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
        <Link to="/donate" className="btn">
          Donate Now
        </Link>
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

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.post("/core/newsletter/", { email });
      setMessage("Thanks — you're subscribed.");
      setEmail("");
    } catch (err) {
      setMessage(err.response?.data?.email?.[0] || "Could not subscribe — try again.");
    }
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

function ContactTeaser() {
  return (
    <section className="container" id="contact">
      <div className="card" style={{ textAlign: "center" }}>
        <h2>Let's Create Change Together</h2>
        <p style={{ color: "var(--text-secondary)" }}>
          Questions, partnership ideas, or press inquiries — we'd love to hear from you.
        </p>
        <Link to="/contact" className="btn">
          Contact Us
        </Link>
      </div>
    </section>
  );
}

export default function Home() {
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [stories, setStories] = useState([]);

  useEffect(() => {
    api.get("/finance/summary/").then((res) => setSummary(res.data));
    api.get("/core/projects/").then((res) => setProjects(res.data.results || res.data));
    api.get("/documents/documents/").then((res) => setDocuments(res.data.results || res.data));
    api.get("/core/impact-updates/").then((res) => setUpdates(res.data.results || res.data));
    api.get("/core/stories/").then((res) => setStories(res.data.results || res.data));

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
      <DonationJourney />
      <ProjectsPreview projects={projects} />
      <ImpactStats summary={summary} projects={projects} />
      <RecentImpactUpdates updates={updates} />
      <Stories stories={stories} />
      <Gallery />
      <Accountability />
      <DocumentsPreview documents={documents} />
      <GetInvolvedTeaser />
      <DonateCTA />
      <Newsletter />
      <ContactTeaser />
    </div>
  );
}
