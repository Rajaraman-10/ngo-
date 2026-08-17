import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatDate } from "../../utils/format";

const KIND_LABELS = {
  volunteer: "Volunteer",
  partner: "Partner",
  employer: "Employer",
  sponsor: "Sponsor",
  fundraise: "Fundraise",
  awareness: "Awareness",
  contact: "Contact",
};

export default function InquiriesPanel() {
  const [inquiries, setInquiries] = useState([]);

  async function refresh() {
    const { data } = await api.get("/core/inquiries/");
    setInquiries(data.results || data);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function markReviewed(inquiry) {
    await api.patch(`/core/inquiries/${inquiry.id}/`, { status: "reviewed" });
    refresh();
  }

  return (
    <div className="card">
      <h3>Inquiries</h3>
      {inquiries.map((i) => (
        <div className="impact-row" key={i.id}>
          <div>
            <strong>
              {KIND_LABELS[i.kind] || i.kind} — {i.name}
            </strong>{" "}
            <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{formatDate(i.created_at)}</span>
            <p style={{ color: "var(--text-secondary)", margin: "4px 0" }}>
              {i.email} {i.phone && `· ${i.phone}`}
            </p>
            <p style={{ color: "var(--text-secondary)", margin: "4px 0" }}>{i.message}</p>
            <span className={`badge ${i.status === "new" ? "pending_approval" : "approved"}`}>{i.status}</span>
          </div>
          {i.status === "new" && (
            <button className="btn secondary" onClick={() => markReviewed(i)}>
              Mark Reviewed
            </button>
          )}
        </div>
      ))}
      {!inquiries.length && <p style={{ color: "var(--text-muted)" }}>No inquiries yet.</p>}
    </div>
  );
}
