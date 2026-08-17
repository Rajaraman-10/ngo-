import { useEffect, useState } from "react";
import { api } from "../api/client";
import Media from "../components/Media";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/format";

export default function ImpactUpdates() {
  const { user } = useAuth();
  const [updates, setUpdates] = useState([]);
  const [myProjectNames, setMyProjectNames] = useState(null);
  const [onlyMine, setOnlyMine] = useState(false);

  useEffect(() => {
    api.get("/core/impact-updates/").then((res) => setUpdates(res.data.results || res.data));
  }, []);

  useEffect(() => {
    if (user?.role !== "donor") return;
    api.get("/finance/my-donations/").then((res) => {
      setMyProjectNames(new Set(res.data.map((d) => d.project_name).filter(Boolean)));
    });
  }, [user]);

  const visible = onlyMine && myProjectNames ? updates.filter((u) => myProjectNames.has(u.project_name)) : updates;

  return (
    <div className="container">
      <h1>Impact Updates</h1>
      <p style={{ color: "var(--text-secondary)" }}>What our projects have actually done, published as it happens.</p>

      {user?.role === "donor" && (
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, fontSize: "0.88rem" }}>
          <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
          Only show updates for projects I've supported
        </label>
      )}

      {!visible.length && <p style={{ color: "var(--text-muted)" }}>No impact updates published yet.</p>}
      {visible.map((u) => (
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
    </div>
  );
}
