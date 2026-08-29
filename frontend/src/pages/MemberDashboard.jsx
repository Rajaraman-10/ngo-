import { useEffect, useState } from "react";
import { api } from "../api/client";
import { formatDate } from "../utils/format";

export default function MemberDashboard() {
  const [member, setMember] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/membership/my-member-profile/")
      .then((res) => setMember(res.data))
      .catch(() => setError("No amma member profile is linked to this account yet."));
  }, []);

  if (error) {
    return (
      <div className="container">
        <h1>Member Dashboard</h1>
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  if (!member) return null;

  return (
    <div className="container">
      <h1>Welcome, {member.full_name}</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        amma {member.region_name} · Member ID <strong>{member.member_id}</strong>
      </p>

      <div className="stat-grid">
        <div className="stat-tile">
          <div className="value" style={{ fontSize: "1.2rem" }}>
            {member.role_name}
          </div>
          <div className="label">Role</div>
        </div>
        <div className="stat-tile">
          <div className="value" style={{ fontSize: "1.2rem" }}>
            {member.department_name || "—"}
          </div>
          <div className="label">Department</div>
        </div>
        <div className="stat-tile">
          <div className="value" style={{ fontSize: "1.2rem" }}>
            {member.team_name || "—"}
          </div>
          <div className="label">Team</div>
        </div>
        <div className="stat-tile">
          <div className="value" style={{ fontSize: "1.2rem" }}>
            {formatDate(member.joined_date)}
          </div>
          <div className="label">Joined</div>
        </div>
      </div>

      <div className="card">
        <h3>Current Tasks</h3>
        <p style={{ color: "var(--text-muted)" }}>
          Task assignment isn't wired up yet — your regional team will reach out directly
          as activities come up.
        </p>
      </div>

      <div className="card">
        <h3>Your Impact</h3>
        <p style={{ color: "var(--text-muted)" }}>
          Activity and hours tracking for members is coming soon — for now, your regional
          team keeps count directly.
        </p>
      </div>
    </div>
  );
}
