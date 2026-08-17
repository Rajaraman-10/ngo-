import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import DonationsPanel from "./dashboard/DonationsPanel";
import ExpensesPanel from "./dashboard/ExpensesPanel";

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("expenses");

  return (
    <div className="container">
      <h1>Member Dashboard</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Signed in as <strong>{user?.username}</strong> — role: {user?.role?.replace("_", " ")}
      </p>

      <div className="tabs">
        <button className={tab === "expenses" ? "active" : ""} onClick={() => setTab("expenses")}>
          Expenses
        </button>
        <button className={tab === "donations" ? "active" : ""} onClick={() => setTab("donations")}>
          Donations
        </button>
      </div>

      {tab === "expenses" ? <ExpensesPanel /> : <DonationsPanel />}
    </div>
  );
}
