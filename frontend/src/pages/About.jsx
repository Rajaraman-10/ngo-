export default function About() {
  return (
    <div className="container">
      <h1>About Us</h1>

      <div className="card">
        <h2>Our Story</h2>
        <p style={{ color: "var(--text-secondary)" }}>
          Swathi Foundation started with a simple observation: the people who most need help
          often have the least visibility into where donated money actually goes. We set out
          to build an NGO that treats transparency as infrastructure, not a promise.
        </p>
      </div>

      <div className="card">
        <h2>Why We Exist</h2>
        <p style={{ color: "var(--text-secondary)" }}>
          Poverty rarely has a single cause, so we don't chase a single fix. We work across
          five foundations — education, employment, food, home, and a clean environment —
          because a family that's fed but uneducated, or housed but unemployed, hasn't found
          stability yet.
        </p>
      </div>

      <div className="card">
        <h2>Our Vision</h2>
        <p style={{ color: "var(--text-secondary)" }}>A world where a dignified life is possible for everyone.</p>
      </div>

      <div className="card">
        <h2>Our Mission</h2>
        <p style={{ color: "var(--text-secondary)" }}>
          To give people the education, skills, food security, housing, and clean environment
          they need to build their own future — and to account publicly for every rupee we
          spend doing it.
        </p>
      </div>

      <div className="card">
        <h2>Our Philosophy</h2>
        <p style={{ color: "var(--text-secondary)" }}>
          <strong>We don't just give. We help people grow.</strong> We believe meaningful
          change is not about creating dependence — it's about giving people the foundation,
          opportunity, and support they need to build their own future.
        </p>
      </div>

      <div className="card">
        <h2>Our Values</h2>
        <ul className="checklist" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <li>✓ Transparency by default</li>
          <li>✓ Dignity over charity</li>
          <li>✓ Opportunity over dependence</li>
          <li>✓ Accountability to donors and beneficiaries alike</li>
        </ul>
      </div>

      <div className="card">
        <h2>Our Team</h2>
        <p style={{ color: "var(--text-muted)" }}>
          Team profiles haven't been published yet — add staff/trustee bios here as the
          organization grows.
        </p>
      </div>

      <div className="card">
        <h2>Registration Details</h2>
        <p style={{ color: "var(--text-muted)" }}>
          Registration number, 12A/80G status, and trustee details go here once finalized —
          see the Reports &amp; Documents page for the underlying certificates.
        </p>
      </div>

      <div className="card">
        <h2>Transparency Commitment</h2>
        <p style={{ color: "var(--text-secondary)" }}>
          Every donation and every approved expense on this website is real, database-driven
          data — nothing here is a hardcoded statistic. See our{" "}
          <a href="/transparency">Transparency Center</a> for the full ledger.
        </p>
      </div>
    </div>
  );
}
