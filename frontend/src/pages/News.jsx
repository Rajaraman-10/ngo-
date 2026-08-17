import { useEffect, useState } from "react";
import { api } from "../api/client";
import Media from "../components/Media";
import { formatDate } from "../utils/format";

const CATEGORY_LABELS = {
  announcement: "Announcement",
  event: "Event",
  success_story: "Success Story",
  report: "Report",
};

export default function News() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    api.get("/core/news/").then((res) => setNews(res.data.results || res.data));
  }, []);

  return (
    <div className="container">
      <h1>News &amp; Updates</h1>

      {!news.length && <p style={{ color: "var(--text-muted)" }}>No news posted yet.</p>}
      {news.map((n) => (
        <div className="card" key={n.id}>
          <Media src={n.photo} alt={n.title} />
          <h3>
            {n.title} <span className="badge draft">{CATEGORY_LABELS[n.category] || n.category}</span>
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{formatDate(n.published_at)}</p>
          <p style={{ color: "var(--text-secondary)" }}>{n.body}</p>
        </div>
      ))}
    </div>
  );
}
