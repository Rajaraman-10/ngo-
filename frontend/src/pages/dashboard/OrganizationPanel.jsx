import { useEffect, useState } from "react";
import { api } from "../../api/client";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function CountrySection({ countries, refresh }) {
  const [form, setForm] = useState({ name: "", code: "" });
  const [error, setError] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/membership/countries/", { ...form, slug: slugify(form.name) });
      setForm({ name: "", code: "" });
      refresh();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create country.");
    }
  }

  return (
    <div className="card">
      <h3>Countries</h3>
      <form onSubmit={handleCreate} className="form-grid">
        <div className="field">
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="field">
          <label>Code (e.g. IN)</label>
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
        </div>
      </form>
      {error && <div className="error-banner">{error}</div>}
      <button className="btn" onClick={handleCreate}>
        Add Country
      </button>
      <ul style={{ marginTop: 16 }}>
        {countries.map((c) => (
          <li key={c.id}>
            {c.name} ({c.code})
          </li>
        ))}
      </ul>
    </div>
  );
}

function StateSection({ countries, states, refresh }) {
  const [form, setForm] = useState({ country: "", name: "", code: "" });
  const [error, setError] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/membership/states/", { ...form, slug: slugify(form.name) });
      setForm({ ...form, name: "", code: "" });
      refresh();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create state/province.");
    }
  }

  return (
    <div className="card">
      <h3>States / Provinces</h3>
      <form onSubmit={handleCreate} className="form-grid">
        <div className="field">
          <label>Country</label>
          <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required>
            <option value="">Select a country…</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="field">
          <label>Code</label>
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
        </div>
      </form>
      {error && <div className="error-banner">{error}</div>}
      <button className="btn" onClick={handleCreate}>
        Add State/Province
      </button>
      <ul style={{ marginTop: 16 }}>
        {states.map((s) => (
          <li key={s.id}>
            {s.name}, {s.country_name}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RegionSection({ states, regions, refresh }) {
  const [form, setForm] = useState({ state: "", name: "", code: "" });
  const [error, setError] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/membership/regions/", { ...form, slug: slugify(form.name) });
      setForm({ ...form, name: "", code: "" });
      refresh();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create region.");
    }
  }

  return (
    <div className="card">
      <h3>Regions</h3>
      <form onSubmit={handleCreate} className="form-grid">
        <div className="field">
          <label>State/Province</label>
          <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required>
            <option value="">Select a state…</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}, {s.country_name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="field">
          <label>Code</label>
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
        </div>
      </form>
      {error && <div className="error-banner">{error}</div>}
      <button className="btn" onClick={handleCreate}>
        Add Region
      </button>
      <ul style={{ marginTop: 16 }}>
        {regions.map((r) => (
          <li key={r.id}>
            {r.name}, {r.state_name}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoleSection({ roles, refresh }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/membership/roles/", { name });
      setName("");
      refresh();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create role.");
    }
  }

  return (
    <div className="card">
      <h3>Membership Role Types</h3>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
        These are the role types regional needs and assignments are built from —
        add new ones here any time without a code change.
      </p>
      <form onSubmit={handleCreate} className="form-grid">
        <div className="field">
          <label>Role name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fundraiser" required />
        </div>
      </form>
      {error && <div className="error-banner">{error}</div>}
      <button className="btn" onClick={handleCreate}>
        Add Role
      </button>
      <ul style={{ marginTop: 16 }}>
        {roles.map((r) => (
          <li key={r.id}>{r.name}</li>
        ))}
      </ul>
    </div>
  );
}

function AdminScopeSection({ regions, states, countries, scopes, refresh }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ user: "", level: "region", area: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/users/").then((res) => setUsers(res.data.results || res.data));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    if (!form.user || !form.area) {
      setError("Select both a user and an area.");
      return;
    }
    try {
      await api.post("/membership/admin-scopes/", { user: form.user, [form.level]: form.area });
      setForm({ user: "", level: "region", area: "" });
      refresh();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not assign this scope.");
    }
  }

  const areaOptions = { country: countries, state: states, region: regions };

  return (
    <div className="card">
      <h3>Regional Administrators</h3>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
        Assign an admin to a country (every state/region under it), a state (every
        region under it), or a single region. Their <code>Role</code> should already be
        set to the matching admin tier via Members management.
      </p>
      <form onSubmit={handleCreate} className="form-grid">
        <div className="field">
          <label>Admin user</label>
          <select value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} required>
            <option value="">Select a user…</option>
            {users
              .filter((u) => u.role.includes("admin") || u.role === "team_lead")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username} ({u.role})
                </option>
              ))}
          </select>
        </div>
        <div className="field">
          <label>Scope level</label>
          <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value, area: "" })}>
            <option value="country">Country</option>
            <option value="state">State/Province</option>
            <option value="region">Region</option>
          </select>
        </div>
        <div className="field">
          <label>Area</label>
          <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} required>
            <option value="">Select…</option>
            {areaOptions[form.level].map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </form>
      {error && <div className="error-banner">{error}</div>}
      <button className="btn" onClick={handleCreate}>
        Assign Scope
      </button>
      <ul style={{ marginTop: 16 }}>
        {scopes.map((s) => (
          <li key={s.id}>
            {s.user_name || "—"} → {s.region_name || s.state_name || s.country_name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function OrganizationPanel() {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [regions, setRegions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [scopes, setScopes] = useState([]);

  async function refresh() {
    const [c, s, r, ro, sc] = await Promise.all([
      api.get("/membership/countries/"),
      api.get("/membership/states/"),
      api.get("/membership/regions/"),
      api.get("/membership/roles/"),
      api.get("/membership/admin-scopes/"),
    ]);
    setCountries(c.data.results || c.data);
    setStates(s.data.results || s.data);
    setRegions(r.data.results || r.data);
    setRoles(ro.data.results || ro.data);
    setScopes(sc.data.results || sc.data);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div>
      <CountrySection countries={countries} refresh={refresh} />
      <StateSection countries={countries} states={states} refresh={refresh} />
      <RegionSection states={states} regions={regions} refresh={refresh} />
      <RoleSection roles={roles} refresh={refresh} />
      <AdminScopeSection countries={countries} states={states} regions={regions} scopes={scopes} refresh={refresh} />
    </div>
  );
}
