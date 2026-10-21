import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Languages, X, Save, FileText, RefreshCw, CornerUpLeft } from "lucide-react";
import { createPortal } from "react-dom";
import { api } from "../services/api";

type Language = { id: string; name: string; code: string; flag: string; rtl: boolean; font: boolean; translations: Record<string, string> };
type LanguagePayload = Omit<Language, "id">;
const inputClass = "mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100";
const primaryClass = "inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export default function MultiLanguageSettings() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<Language | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [translator, setTranslator] = useState<Language | null>(null);
  const [translationRows, setTranslationRows] = useState<{ key: string; value: string }[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", flag: "", rtl: false, font: false });

  const loadLanguages = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api<{ languages: Language[] }>("/admin/languages");
      setLanguages(result.languages || []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load languages from MongoDB.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadLanguages(); }, [loadLanguages]);

  const filtered = useMemo(() => languages.filter(l => `${l.name} ${l.code}`.toLowerCase().includes(search.toLowerCase())), [languages, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((Math.min(page, pages) - 1) * pageSize, Math.min(page, pages) * pageSize);
  const openAdd = () => { setEditor(null); setFormOpen(true); setForm({ name: "", code: "", flag: "", rtl: false, font: false }); };
  const openEdit = (language: Language) => { setEditor(language); setFormOpen(true); setForm({ name: language.name, code: language.code, flag: language.flag || "", rtl: language.rtl, font: language.font }); };
  const saveLanguage = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = form.code.trim().toLowerCase();
    if (!form.name.trim() || !/^[a-z]{2,3}(-[a-z0-9]+)?$/.test(code)) { setNotice("Enter a language name and a valid ISO language code (for example, en or pt-br)."); return; }
    if (languages.some(l => l.code.toLowerCase() === code && l.id !== editor?.id)) { setNotice("That language code already exists."); return; }
    const payload: LanguagePayload = { name: form.name.trim(), code, flag: form.flag.trim(), rtl: form.rtl, font: form.font, translations: editor?.translations || {} };
    setSaving(true);
    try {
      const result = editor
        ? await api<{ language: Language; message: string }>(`/admin/languages/${encodeURIComponent(editor.id)}`, { method: "PUT", body: JSON.stringify(payload) })
        : await api<{ language: Language; message: string }>("/admin/languages", { method: "POST", body: JSON.stringify(payload) });
      setLanguages(current => editor ? current.map(l => l.id === editor.id ? result.language : l).sort((a,b)=>a.name.localeCompare(b.name)) : [...current, result.language].sort((a,b)=>a.name.localeCompare(b.name)));
      setEditor(null); setFormOpen(false); setNotice(result.message || "Language saved successfully.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save language."); }
    finally { setSaving(false); }
  };
  const deleteLanguage = async (language: Language) => {
    if (language.code === "en") { setNotice("English is the default language and cannot be deleted."); return; }
    if (!window.confirm(`Delete ${language.name}? This also removes its saved translations.`)) return;
    try {
      const result = await api<{ message: string }>(`/admin/languages/${encodeURIComponent(language.id)}`, { method: "DELETE" });
      setLanguages(current => current.filter(l => l.id !== language.id)); setNotice(result.message || `${language.name} deleted.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not delete language."); }
  };
  const openTranslator = (language: Language) => { setTranslator(language); setTranslationRows(Object.entries(language.translations || {}).map(([key, value]) => ({ key, value }))); };
  const saveTranslations = async (event: React.FormEvent) => {
    event.preventDefault(); if (!translator) return;
    const translations = Object.fromEntries(translationRows.filter(r => r.key.trim()).map(r => [r.key.trim(), r.value]));
    setSaving(true);
    try {
      const result = await api<{ language: Language; message: string }>(`/admin/languages/${encodeURIComponent(translator.id)}/translations`, { method: "PUT", body: JSON.stringify({ translations }) });
      setLanguages(current => current.map(l => l.id === translator.id ? result.language : l));
      setTranslator(null); setNotice(result.message || `Translations for ${translator.name} saved to MongoDB.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save translations."); }
    finally { setSaving(false); }
  };

  return <section className="language-settings-page">
    <header className="language-page-heading"><h1 className="language-heading-title">Languages</h1><div className="language-toolbar">
      <button type="button" onClick={openAdd} title="Add New" aria-label="Add New" className="language-action language-add"><Plus size={16}/></button>
      <button type="button" onClick={() => { const removable = languages.filter(l => l.code !== "en"); if (!removable.length) { setNotice("English is the default language and cannot be deleted."); return; } if (!window.confirm(`Delete ${removable.length} non-default language(s)?`)) return; void Promise.all(removable.map(l => api<{message:string}>(`/admin/languages/${encodeURIComponent(l.id)}`, { method: "DELETE" }))).then(() => { setLanguages(current => current.filter(l => l.code === "en")); setNotice("Selected languages deleted."); }).catch(error => setNotice(error instanceof Error ? error.message : "Could not delete languages.")); }} title="Delete" aria-label="Delete" className="language-action language-delete"><Trash2 size={16}/></button>
    </div></header>
    {notice && <div role="status" className="language-notice"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X size={15}/></button></div>}
    <div className="language-list-panel">
      <div className="language-list-title"><div className="language-list-heading"><Languages size={16}/><span>Language List</span></div></div>
      <div className="language-table-wrap"><table className="language-table"><thead><tr><th className="language-check-cell"><input type="checkbox" aria-label="Select all languages" onChange={e => { const boxes = document.querySelectorAll<HTMLInputElement>(".language-row-check"); boxes.forEach(box => { box.checked = e.target.checked; }); }}/></th><th><span className="language-sort-label">Language Name <span>⌃</span></span></th><th>Code</th><th className="language-sort-order">Sort Order</th><th className="language-action-heading">Action</th></tr></thead><tbody>
        {loading ? <tr><td colSpan={5} className="language-empty">Loading languages…</td></tr> : visible.map((language, index) => <tr key={language.id}><td className="language-check-cell"><input className="language-row-check" type="checkbox" aria-label={`Select ${language.name}`}/></td><td><div className="language-name">{language.name}{language.code === "en" && <strong> (Default)</strong>}</div><div className={language.code === "en" ? "language-status language-status-enabled" : "language-status language-status-enabled"}>Enabled</div></td><td>{language.code}</td><td className="language-sort-order">{index + 1}</td><td className="language-action-cell"><button type="button" onClick={() => openEdit(language)} title="Edit" aria-label={`Edit ${language.name}`} className="language-action language-edit"><Pencil size={15}/></button></td></tr>)}
        {!loading && visible.length === 0 && <tr><td colSpan={5} className="language-empty">No languages found.</td></tr>}
      </tbody></table></div>
      <div className="language-table-footer"><span>Showing {filtered.length ? (Math.min(page, pages) - 1) * pageSize + 1 : 0} to {Math.min(page, pages) * pageSize > filtered.length ? filtered.length : Math.min(page, pages) * pageSize} of {filtered.length} ({pages} Pages)</span><nav className="language-pagination" aria-label="Language pages"><button disabled={page <= 1} onClick={() => setPage(1)} aria-label="First page">|&lt;</button><button disabled={page <= 1} onClick={() => setPage(p => Math.max(1,p-1))} aria-label="Previous page">&lt;</button>{Array.from({length: pages}, (_,i) => i+1).filter(n => n === 1 || n === pages || Math.abs(n-page) <= 2).map(n => <button key={n} className={n === page ? "active" : ""} onClick={() => setPage(n)}>{n}</button>)}<button disabled={page >= pages} onClick={() => setPage(p => Math.min(pages,p+1))} aria-label="Next page">&gt;</button><button disabled={page >= pages} onClick={() => setPage(pages)} aria-label="Last page">&gt;|</button></nav></div>
    </div>
    <footer className="language-page-footer">
      <div><a href="https://www.opencart.com/" target="_blank" rel="noreferrer">OpenCart</a> © 2009-2026 All Rights Reserved.</div>
      <div>Version 4.0.2.3</div>
    </footer>
    {formOpen && createPortal(<div className="sa-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !saving) { setEditor(null); setFormOpen(false); } }}><form onSubmit={saveLanguage} className="sa-plan-modal sa-country-modal sa-language-modal"><div className="sa-modal-head"><h2>{editor ? "Edit Language" : "Add Language"}</h2><button type="button" className="sa-modal-close" onClick={() => { setEditor(null); setFormOpen(false); }} aria-label="Close"><X size={17}/></button></div><div className="sa-plan-form-grid"><label>Language name <b>*</b><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={100} placeholder="e.g. French"/></label><label>ISO code <b>*</b><input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required maxLength={12} placeholder="e.g. fr"/></label><label className="sa-form-wide">Flag image URL (optional)<input type="url" value={form.flag} onChange={e => setForm(f => ({ ...f, flag: e.target.value }))} placeholder="https://example.com/flag.png"/></label></div><div className="sa-language-options"><label><input type="checkbox" checked={form.rtl} onChange={e => setForm(f => ({ ...f, rtl: e.target.checked }))}/> Right-to-left (RTL)</label><label><input type="checkbox" checked={form.font} onChange={e => setForm(f => ({ ...f, font: e.target.checked }))}/> Custom font enabled</label></div><p className="sa-language-help">Language settings are stored in MongoDB and available across browsers and devices.</p>{notice && <p className="error" role="alert">{notice}</p>}<div className="sa-modal-actions sa-country-form-actions"><button type="button" className="sa-country-cancel-icon" title="Cancel" aria-label="Cancel" onClick={() => { setEditor(null); setFormOpen(false); }}><CornerUpLeft size={16} strokeWidth={2.5}/></button><button type="submit" disabled={saving} className="sa-country-save-icon" title="Save Language" aria-label="Save Language"><Save size={16} strokeWidth={2.5}/></button></div></form></div>, document.body)}
    {translator && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setTranslator(null); }}><form onSubmit={saveTranslations} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-semibold text-slate-800">Translator — {translator.name}</h3><p className="text-xs text-slate-500">Edit translation keys and values saved in MongoDB.</p></div><button type="button" onClick={() => setTranslator(null)} aria-label="Close"><X size={18}/></button></div><div className="max-h-[55vh] space-y-3 overflow-y-auto">{translationRows.map((row, index) => <div key={`${index}-${row.key}`} className="grid gap-2 sm:grid-cols-[1fr_1.5fr]"><input className={inputClass} value={row.key} onChange={e => setTranslationRows(rows => rows.map((r, i) => i === index ? { ...r, key: e.target.value } : r))} placeholder="translation.key" aria-label="Translation key"/><input className={inputClass} value={row.value} onChange={e => setTranslationRows(rows => rows.map((r, i) => i === index ? { ...r, value: e.target.value } : r))} placeholder="Translated text" aria-label="Translated text"/></div>)}</div><div className="mt-3 flex flex-wrap justify-between gap-2"><button type="button" onClick={() => setTranslationRows(rows => [...rows, { key: "", value: "" }])} className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"><Plus size={14} className="mr-1 inline"/>Add translation</button><button type="button" onClick={() => setTranslationRows(rows => rows.filter((_, i) => i !== translationRows.length - 1))} disabled={!translationRows.length} className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-40">Remove last</button></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setTranslator(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" disabled={saving} className={primaryClass}><FileText size={15}/>{saving ? "Saving…" : "Save Translations"}</button></div></form></div>}
  </section>;
}
