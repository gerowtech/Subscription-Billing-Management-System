import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Languages, X, Save, FileText, RefreshCw } from "lucide-react";
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

  return <section className="space-y-4 rounded-2xl bg-white p-4 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-slate-800">Languages</h2><p className="mt-1 text-sm text-slate-500">Manage language metadata and translation strings saved in MongoDB.</p></div><div className="flex gap-2"><button type="button" onClick={() => void loadLanguages()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15}/> Refresh</button><button type="button" className={primaryClass} onClick={openAdd}><Plus size={16}/> Add Language</button></div></div>
    {notice && <div role="status" className="flex items-center justify-between gap-3 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-sm text-violet-800"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X size={15}/></button></div>}
    <div className="flex flex-wrap items-center justify-between gap-3"><label className="relative block w-full max-w-xs"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search language" aria-label="Search languages"/></label><label className="flex items-center gap-2 text-xs text-slate-500">Show <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select> entries</label></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left text-sm"><thead><tr className="bg-slate-50 text-xs font-semibold text-slate-700"><th className="rounded-l-lg px-4 py-3 font-semibold">Flag</th><th className="px-4 py-3 font-semibold">Language</th><th className="px-4 py-3 font-semibold">ISO code</th><th className="px-4 py-3 font-semibold">RTL</th><th className="px-4 py-3 font-semibold">Font</th><th className="rounded-r-lg px-4 py-3 text-center font-semibold">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">Loading languages from MongoDB…</td></tr> : visible.map(language => <tr key={language.id} className="transition hover:bg-slate-50/70"><td className="px-4 py-3">{language.flag ? <img src={language.flag} alt={`${language.name} flag`} className="h-7 w-7 rounded-full border border-slate-200 object-cover" onError={e => { e.currentTarget.style.display = "none"; }}/> : <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-[10px] font-semibold uppercase text-violet-700">{language.code.slice(0, 2)}</span>}</td><td className="px-4 py-3 font-medium text-slate-700">{language.name}</td><td className="px-4 py-3 text-slate-500">{language.code}</td><td className="px-4 py-3 text-slate-500">{language.rtl ? "Yes" : "No"}</td><td className="px-4 py-3 text-slate-500">{language.font ? "Yes" : "No"}</td><td className="px-4 py-3"><div className="flex items-center justify-center gap-2"><button type="button" onClick={() => openEdit(language)} title="Edit language" aria-label={`Edit ${language.name}`} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600"><Pencil size={14}/></button><button type="button" onClick={() => void deleteLanguage(language)} title="Delete language" aria-label={`Delete ${language.name}`} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"><Trash2 size={14}/></button><button type="button" onClick={() => openTranslator(language)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-violet-50 hover:text-violet-700"><Languages size={14}/> Translator</button></div></td></tr>)}{!loading && visible.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">No languages found.</td></tr>}</tbody></table></div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500"><span>Showing {filtered.length ? (Math.min(page, pages) - 1) * pageSize + 1 : 0} to {Math.min(page, pages) * pageSize > filtered.length ? filtered.length : Math.min(page, pages) * pageSize} of {filtered.length} entries</span><div className="flex items-center gap-1"><button type="button" className="h-8 rounded-md border border-slate-200 px-2 hover:bg-slate-50 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>«</button><span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-violet-600 px-2 font-medium text-white">{Math.min(page, pages)}</span><button type="button" className="h-8 rounded-md border border-slate-200 px-2 hover:bg-slate-50 disabled:opacity-40" disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}>»</button></div></div>
    {formOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) { setEditor(null); setFormOpen(false); } }}><form onSubmit={saveLanguage} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h3 className="text-lg font-semibold text-slate-800">{editor ? "Edit Language" : "Add Language"}</h3><button type="button" onClick={() => { setEditor(null); setFormOpen(false); }} aria-label="Close"><X size={18}/></button></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Language name<input className={inputClass} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. French"/></label><label className="text-sm font-medium text-slate-700">ISO code<input className={inputClass} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required maxLength={12} placeholder="e.g. fr"/></label><label className="sm:col-span-2 text-sm font-medium text-slate-700">Flag image URL (optional)<input className={inputClass} type="url" value={form.flag} onChange={e => setForm(f => ({ ...f, flag: e.target.value }))} placeholder="https://example.com/flag.png"/></label></div><div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-700"><label className="flex items-center gap-2"><input type="checkbox" className="accent-violet-600" checked={form.rtl} onChange={e => setForm(f => ({ ...f, rtl: e.target.checked }))}/> Right-to-left (RTL)</label><label className="flex items-center gap-2"><input type="checkbox" className="accent-violet-600" checked={form.font} onChange={e => setForm(f => ({ ...f, font: e.target.checked }))}/> Custom font enabled</label></div><p className="mt-3 text-xs text-slate-500">Language settings are stored in MongoDB and available across browsers and devices.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => { setEditor(null); setFormOpen(false); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" disabled={saving} className={primaryClass}><Save size={15}/>{saving ? "Saving…" : "Save Language"}</button></div></form></div>}
    {translator && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setTranslator(null); }}><form onSubmit={saveTranslations} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-semibold text-slate-800">Translator — {translator.name}</h3><p className="text-xs text-slate-500">Edit translation keys and values saved in MongoDB.</p></div><button type="button" onClick={() => setTranslator(null)} aria-label="Close"><X size={18}/></button></div><div className="max-h-[55vh] space-y-3 overflow-y-auto">{translationRows.map((row, index) => <div key={`${index}-${row.key}`} className="grid gap-2 sm:grid-cols-[1fr_1.5fr]"><input className={inputClass} value={row.key} onChange={e => setTranslationRows(rows => rows.map((r, i) => i === index ? { ...r, key: e.target.value } : r))} placeholder="translation.key" aria-label="Translation key"/><input className={inputClass} value={row.value} onChange={e => setTranslationRows(rows => rows.map((r, i) => i === index ? { ...r, value: e.target.value } : r))} placeholder="Translated text" aria-label="Translated text"/></div>)}</div><div className="mt-3 flex flex-wrap justify-between gap-2"><button type="button" onClick={() => setTranslationRows(rows => [...rows, { key: "", value: "" }])} className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"><Plus size={14} className="mr-1 inline"/>Add translation</button><button type="button" onClick={() => setTranslationRows(rows => rows.filter((_, i) => i !== translationRows.length - 1))} disabled={!translationRows.length} className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-40">Remove last</button></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setTranslator(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" disabled={saving} className={primaryClass}><FileText size={15}/>{saving ? "Saving…" : "Save Translations"}</button></div></form></div>}
  </section>;
}
