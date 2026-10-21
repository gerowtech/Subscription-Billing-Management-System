import { useEffect, useState } from "react";
import { api } from "../services/api";

type FrontendSettings = {
  activeStatus: boolean;
  registrationActive: boolean;
  metaKeyword: string;
  metaAuthor: string;
  metaDescription: string;
  facebookLink: string;
  twitterLink: string;
  linkedinLink: string;
  skypeLink: string;
};

const defaults: FrontendSettings = {
  activeStatus: true,
  registrationActive: true,
  metaKeyword: "",
  metaAuthor: "",
  metaDescription: "",
  facebookLink: "",
  twitterLink: "",
  linkedinLink: "",
  skypeLink: "",
};

export default function FrontendSettingsPanel() {
  const [form, setForm] = useState<FrontendSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api<{ settings?: Partial<FrontendSettings> }>("/admin/frontend-settings")
      .then((data) => {
        if (!cancelled) setForm({ ...defaults, ...(data.settings || {}) });
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message || "Unable to load frontend settings.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const update = (key: keyof FrontendSettings, value: string | boolean) => {
    setForm((old) => ({ ...old, [key]: value }));
    setMessage("");
  };

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await api<{ message?: string; settings?: FrontendSettings }>("/admin/frontend-settings", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      if (result.settings) setForm({ ...defaults, ...result.settings });
      setMessage(result.message || "Frontend settings saved successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save frontend settings.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="sa-data-panel sa-frontend-settings-panel">
    <div className="sa-section-heading">
      <div><h2>Frontend Setting</h2></div>
      
    </div>
    {loading ? <p className="sa-settings-feedback">Loading frontend settings…</p> : <form onSubmit={save} className="sa-frontend-settings-form">
      <div className="sa-frontend-toggle-grid">
        <label className="sa-frontend-field"><span>Active Status</span><select value={form.activeStatus ? "enabled" : "disabled"} onChange={e=>update("activeStatus",e.target.value==="enabled")}><option value="enabled">Enable</option><option value="disabled">Disable</option></select></label>
        <label className="sa-frontend-field"><span>Registration Active</span><select value={form.registrationActive ? "enabled" : "disabled"} onChange={e=>update("registrationActive",e.target.value==="enabled")}><option value="enabled">Enable</option><option value="disabled">Disable</option></select></label>
      </div>
      <div className="sa-frontend-toggle-grid">
        <label className="sa-frontend-field"><span>Meta Keyword <b>*</b></span><input required value={form.metaKeyword} onChange={e=>update("metaKeyword",e.target.value)} placeholder="subscription, billing, Minecraft"/></label>
        <label className="sa-frontend-field"><span>Meta Author <b>*</b></span><input required value={form.metaAuthor} onChange={e=>update("metaAuthor",e.target.value)} placeholder="Website author"/></label>
      </div>
      <label className="sa-frontend-field"><span>Meta Description <b>*</b></span><input required maxLength={320} value={form.metaDescription} onChange={e=>update("metaDescription",e.target.value)} placeholder="Describe your website for search engines"/></label>
      <div className="sa-frontend-toggle-grid">
        <label className="sa-frontend-field"><span>Facebook Link</span><input type="url" value={form.facebookLink} onChange={e=>update("facebookLink",e.target.value)} placeholder="https://facebook.com/…"/></label>
        <label className="sa-frontend-field"><span>Twitter Link</span><input type="url" value={form.twitterLink} onChange={e=>update("twitterLink",e.target.value)} placeholder="https://x.com/…"/></label>
      </div>
      <div className="sa-frontend-toggle-grid">
        <label className="sa-frontend-field"><span>LinkedIn Link</span><input type="url" value={form.linkedinLink} onChange={e=>update("linkedinLink",e.target.value)} placeholder="https://linkedin.com/…"/></label>
        <label className="sa-frontend-field"><span>Skype Link</span><input value={form.skypeLink} onChange={e=>update("skypeLink",e.target.value)} placeholder="skype:username?chat"/></label>
      </div>
      {error && <p className="sa-settings-error" role="alert">{error}</p>}
      {message && <p className="sa-settings-success" role="status">{message}</p>}
      <div className="sa-frontend-submit"><button className="sa-action-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit" disabled={saving}>{saving ? "Saving…" : "Update"}</button></div>
    </form>}
  </section>;
}
