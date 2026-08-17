import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ActivitiesPanel from "./dashboard/ActivitiesPanel";
import AuditLogPanel from "./dashboard/AuditLogPanel";
import DonationsPanel from "./dashboard/DonationsPanel";
import ExpensesPanel from "./dashboard/ExpensesPanel";
import ImpactUpdatesPanel from "./dashboard/ImpactUpdatesPanel";
import InquiriesPanel from "./dashboard/InquiriesPanel";
import MembersPanel from "./dashboard/MembersPanel";
import ProjectsPanel from "./dashboard/ProjectsPanel";
import StoriesPanel from "./dashboard/StoriesPanel";

const FINANCIAL_ROLES = ["finance_manager", "accountant", "project_manager", "auditor", "admin"];
const CONTENT_ROLES = ["project_manager", "admin"];

const TAB_CONFIG = [
  { key: "expenses", label: "Expenses", Component: ExpensesPanel, roles: FINANCIAL_ROLES },
  { key: "donations", label: "Donations", Component: DonationsPanel, roles: FINANCIAL_ROLES },
  { key: "projects", label: "Projects", Component: ProjectsPanel, roles: CONTENT_ROLES },
  { key: "activities", label: "Activities", Component: ActivitiesPanel, roles: ["volunteer", "project_manager", "admin"] },
  { key: "impact-updates", label: "Impact Updates", Component: ImpactUpdatesPanel, roles: CONTENT_ROLES },
  { key: "stories", label: "Stories", Component: StoriesPanel, roles: CONTENT_ROLES },
  { key: "inquiries", label: "Inquiries", Component: InquiriesPanel, roles: ["admin"] },
  { key: "members", label: "Members", Component: MembersPanel, roles: ["admin"] },
  { key: "audit-log", label: "Audit Log", Component: AuditLogPanel, roles: ["admin", "auditor"] },
];

export default function Dashboard() {
  const { user } = useAuth();
  const visibleTabs = TAB_CONFIG.filter((t) => user?.is_superuser || t.roles.includes(user?.role));
  const [tab, setTab] = useState(visibleTabs[0]?.key);

  const active = visibleTabs.find((t) => t.key === tab) || visibleTabs[0];
  const ActiveComponent = active?.Component;

  return (
    <div className="container">
      <h1>Member Dashboard</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Signed in as <strong>{user?.username}</strong> — role: {user?.role?.replace("_", " ")}
      </p>

      <div className="tabs">
        {visibleTabs.map((t) => (
          <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {ActiveComponent ? <ActiveComponent /> : <p style={{ color: "var(--text-muted)" }}>No dashboard sections available for your role.</p>}
    </div>
  );
}
