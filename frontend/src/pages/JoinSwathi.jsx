import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

const PROCESS_STEPS = [
  { n: "01", label: "Choose your region" },
  { n: "02", label: "Tell us about yourself" },
  { n: "03", label: "Submit your application" },
  { n: "04", label: "Swathi reviews your application" },
  { n: "05", label: "We find where your contribution can create the most impact" },
  { n: "06", label: "Join your regional Swathi team" },
];

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  address: "",
  country: "",
  state: "",
  region: "",
  education_level: "",
  institution: "",
  course: "",
  graduation_year: "",
  occupation: "",
  organization: "",
  years_of_experience: "",
  volunteer_experience: "",
  ngo_experience: "",
  professional_experience: "",
  hours_per_week: "",
  available_weekdays: false,
  available_weekends: false,
  available_mornings: false,
  available_afternoons: false,
  available_evenings: false,
  motivation: "",
  contribution_interest: "",
  portfolio_url: "",
  linkedin_url: "",
};

export default function JoinSwathi() {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [regions, setRegions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [skillsText, setSkillsText] = useState("");
  const [resume, setResume] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get("/membership/countries/").then((res) => setCountries(res.data.results || res.data));
  }, []);

  useEffect(() => {
    setForm((f) => ({ ...f, state: "", region: "" }));
    setStates([]);
    setRegions([]);
    if (form.country) {
      api.get(`/membership/states/?country=${form.country}`).then((res) => setStates(res.data.results || res.data));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.country]);

  useEffect(() => {
    setForm((f) => ({ ...f, region: "" }));
    setRegions([]);
    if (form.state) {
      api.get(`/membership/regions/?state=${form.state}`).then((res) => setRegions(res.data.results || res.data));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.state]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) fd.append(k, v);
      });
      skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((skill) => fd.append("skills", skill));
      if (resume) fd.append("resume", resume);
      if (photo) fd.append("profile_photo", photo);

      const { data } = await api.post("/membership/applications/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
    } catch (err) {
      const data = err.response?.data;
      setError(data ? Object.entries(data).map(([k, v]) => `${k}: ${[].concat(v).join(" ")}`).join(" · ") : "Could not submit your application.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="container" style={{ maxWidth: 560 }}>
        <div className="card" style={{ textAlign: "center" }}>
          <h1>Thank you, {result.full_name}.</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Your application has been received. Your regional team will review it against
            what Swathi currently needs, and we'll follow up with next steps.
          </p>
          <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--brand)", margin: "20px 0" }}>
            {result.application_id}
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Save this ID — you'll need it (with your email) to check your status.
          </p>
          <Link to="/application-status" className="btn" style={{ marginTop: 16 }}>
            Check My Application
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1>Join Swathi</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Swathi is growing through people who believe that meaningful change begins with
        action. This isn't a job application — it's the start of your part in service,
        community, and impact.
      </p>

      <div className="pillar-grid" style={{ marginBottom: 32 }}>
        {PROCESS_STEPS.map((s) => (
          <div className="card" key={s.n} style={{ marginBottom: 0 }}>
            <div style={{ color: "var(--brand)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.3rem" }}>
              {s.n}
            </div>
            <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: "0.88rem" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="card">
        <h3>Where would you like to serve?</h3>
        <div className="form-grid">
          <div className="field">
            <label>Country</label>
            <select value={form.country} onChange={(e) => set("country", e.target.value)} required>
              <option value="">Select a country…</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>State / Province</label>
            <select value={form.state} onChange={(e) => set("state", e.target.value)} required disabled={!form.country}>
              <option value="">Select a state…</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Region / City</label>
            <select value={form.region} onChange={(e) => set("region", e.target.value)} required disabled={!form.state}>
              <option value="">Select a region…</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <h3>Personal Information</h3>
        <div className="form-grid">
          <div className="field">
            <label>Full Name</label>
            <input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
          </div>
          <div className="field">
            <label>Phone Number</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
          </div>
          <div className="field">
            <label>Date of Birth</label>
            <input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
          </div>
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Address (optional)</label>
          <input value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>

        <h3>Education</h3>
        <div className="form-grid">
          <div className="field">
            <label>Education level</label>
            <select value={form.education_level} onChange={(e) => set("education_level", e.target.value)}>
              <option value="">—</option>
              <option value="high_school">High School</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="graduate">Graduate</option>
              <option value="postgraduate">Postgraduate</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="field">
            <label>College / University</label>
            <input value={form.institution} onChange={(e) => set("institution", e.target.value)} />
          </div>
          <div className="field">
            <label>Course</label>
            <input value={form.course} onChange={(e) => set("course", e.target.value)} />
          </div>
          <div className="field">
            <label>Graduation year</label>
            <input type="number" value={form.graduation_year} onChange={(e) => set("graduation_year", e.target.value)} />
          </div>
        </div>

        <h3>Professional</h3>
        <div className="form-grid">
          <div className="field">
            <label>Current occupation</label>
            <input value={form.occupation} onChange={(e) => set("occupation", e.target.value)} />
          </div>
          <div className="field">
            <label>Company / Organization</label>
            <input value={form.organization} onChange={(e) => set("organization", e.target.value)} />
          </div>
          <div className="field">
            <label>Years of experience</label>
            <input
              type="number"
              min="0"
              value={form.years_of_experience}
              onChange={(e) => set("years_of_experience", e.target.value)}
            />
          </div>
        </div>

        <h3>Skills</h3>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>List your skills, separated by commas</label>
          <input
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            placeholder="e.g. Graphic Design, Photography, Fundraising"
          />
        </div>

        <h3>Experience</h3>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Previous volunteer experience</label>
          <textarea rows={2} value={form.volunteer_experience} onChange={(e) => set("volunteer_experience", e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>NGO experience</label>
          <textarea rows={2} value={form.ngo_experience} onChange={(e) => set("ngo_experience", e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Professional experience</label>
          <textarea rows={2} value={form.professional_experience} onChange={(e) => set("professional_experience", e.target.value)} />
        </div>

        <h3>Availability</h3>
        <div className="field" style={{ marginBottom: 14, maxWidth: 220 }}>
          <label>Hours per week</label>
          <input type="number" min="0" value={form.hours_per_week} onChange={(e) => set("hours_per_week", e.target.value)} />
        </div>
        <div className="actions-row" style={{ marginBottom: 20 }}>
          {[
            ["available_weekdays", "Weekdays"],
            ["available_weekends", "Weekends"],
            ["available_mornings", "Mornings"],
            ["available_afternoons", "Afternoons"],
            ["available_evenings", "Evenings"],
          ].map(([key, label]) => (
            <label key={key} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: "0.88rem" }}>
              <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} />
              {label}
            </label>
          ))}
        </div>

        <h3>Why Swathi?</h3>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Why do you want to join Swathi?</label>
          <textarea rows={3} value={form.motivation} onChange={(e) => set("motivation", e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>What kind of work would you be comfortable contributing to?</label>
          <textarea rows={3} value={form.contribution_interest} onChange={(e) => set("contribution_interest", e.target.value)} required />
        </div>

        <h3>Optional</h3>
        <div className="form-grid">
          <div className="field">
            <label>Resume</label>
            <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResume(e.target.files[0])} />
          </div>
          <div className="field">
            <label>Profile photo</label>
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
          </div>
          <div className="field">
            <label>Portfolio URL</label>
            <input value={form.portfolio_url} onChange={(e) => set("portfolio_url", e.target.value)} />
          </div>
          <div className="field">
            <label>LinkedIn URL</label>
            <input value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} />
          </div>
        </div>

        <button className="btn" type="submit" disabled={submitting} style={{ marginTop: 20 }}>
          {submitting ? "Submitting…" : "Submit Application"}
        </button>
      </form>
    </div>
  );
}
