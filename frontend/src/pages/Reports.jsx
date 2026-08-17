import { useEffect, useState } from "react";
import { api } from "../api/client";

const CATEGORY_LABELS = {
  registration: "Registration Documents",
  tax: "PAN / 12A / 80G",
  annual_report: "Annual Reports",
  monthly_report: "Monthly Reports",
  quarterly_report: "Quarterly Reports",
  fund_utilization: "Fund Utilization Reports",
  audit: "Audited Financial Statements",
  budget: "Budgets",
  project_report: "Project Reports",
  policy: "Policies",
  other: "Other Documents",
};

export default function Reports() {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    api.get("/documents/documents/").then((res) => setDocuments(res.data.results || res.data));
  }, []);

  const grouped = documents.reduce((acc, d) => {
    (acc[d.category] ||= []).push(d);
    return acc;
  }, {});

  return (
    <div className="container">
      <h1>Reports &amp; Documents</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Our public document library — registration certificates, financial statements, audits,
        and project reports.
      </p>

      {!documents.length && <p style={{ color: "var(--text-muted)" }}>No public documents uploaded yet.</p>}

      {Object.entries(grouped).map(([category, docs]) => (
        <div className="card" key={category}>
          <h3>{CATEGORY_LABELS[category] || category}</h3>
          <table>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td style={{ color: "var(--text-muted)" }}>{d.financial_year}</td>
                  <td>
                    <a href={d.file} target="_blank" rel="noreferrer">
                      View / Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
