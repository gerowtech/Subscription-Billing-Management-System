import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createPortal } from "react-dom";
import { Pencil, Plus, Trash2, X, List, Save, CornerUpLeft, RefreshCw } from "lucide-react";
import countryData from "../countries-data.json";

type Country = { id: string; name: string; code: string; code3: string; phoneCode: string; status: "Enabled" | "Disabled" };
type CountryForm = Omit<Country, "id">;
const STORAGE_KEY = "strafemc_admin_countries_v2";
const defaults: Country[] = countryData as Country[];
const emptyForm: CountryForm = { name: "", code: "", code3: "", phoneCode: "", status: "Enabled" };
const PAGE_SIZE = 10;

export default function CountriesSettings() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Country | null>(null);
  const [form, setForm] = useState<CountryForm>(emptyForm);
  const [notice, setNotice] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) {
          const byCode = new Map<string, Country>(defaults.map(c => [c.code, c]));
          parsed.forEach((c: Partial<Country>) => { if (c.code && c.name) byCode.set(String(c.code).toUpperCase(), { ...defaults.find(d => d.code === String(c.code).toUpperCase()), ...c, id: c.id || String(c.code).toLowerCase(), code3: c.code3 || defaults.find(d => d.code === String(c.code).toUpperCase())?.code3 || "", phoneCode: c.phoneCode || "", status: c.status === "Disabled" ? "Disabled" : "Enabled" } as Country); });
          setCountries([...byCode.values()].sort((a,b) => a.name.localeCompare(b.name)));
          return;
        }
      }
    } catch { /* restore built-in country list */ }
    setCountries(defaults);
  }, []);
  useEffect(() => {
    if (!countries.length) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(countries)); } catch { /* storage may be unavailable; keep the in-memory list usable */ }
  }, [countries]);

  const filtered = useMemo(() => [...countries].sort((a,b) => sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)), [countries, sortAsc]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const allVisibleSelected = visible.length > 0 && visible.every(c => selected.includes(c.id));

  function openForm(country?: Country) {
    setEditing(country || null);
    setForm(country ? { name: country.name, code: country.code, code3: country.code3, phoneCode: country.phoneCode, status: country.status } : emptyForm);
    setNotice(""); setModal(true);
  }
  function saveCountry(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = form.name.trim(); const code = form.code.trim().toUpperCase(); const code3 = form.code3.trim().toUpperCase();
    if (!name || !/^[A-Z]{2}$/.test(code) || !/^[A-Z]{3}$/.test(code3)) { setNotice("Enter a country name, a valid 2-letter ISO code, and a valid 3-letter ISO code."); return; }
    if (countries.some(c => c.code === code && c.id !== editing?.id)) { setNotice(`ISO Code (2) ${code} already exists.`); return; }
    if (countries.some(c => c.code3 === code3 && c.id !== editing?.id)) { setNotice(`ISO Code (3) ${code3} already exists.`); return; }
    if (editing) setCountries(old => old.map(c => c.id === editing.id ? { ...c, name, code, code3, phoneCode: form.phoneCode.trim(), status: form.status } : c));
    else setCountries(old => [...old, { id: code.toLowerCase(), name, code, code3, phoneCode: form.phoneCode.trim(), status: form.status }]);
    setModal(false); setNotice("");
  }
  function deleteSelected() {
    if (!selected.length) { setNotice("Select at least one country to delete."); return; }
    const names = countries.filter(c => selected.includes(c.id)).map(c => c.name);
    if (!window.confirm(`Delete ${names.length} selected ${names.length === 1 ? "country" : "countries"}?`)) return;
    setCountries(old => old.filter(c => !selected.includes(c.id))); setSelected([]); setNotice(`${names.length} ${names.length === 1 ? "country" : "countries"} deleted.`);
  }
  function toggleAll() { setSelected(old => allVisibleSelected ? old.filter(id => !visible.some(c => c.id === id)) : [...new Set([...old, ...visible.map(c => c.id)])]); }
  function refreshCountries() { setCountries(defaults); setSelected([]); setPage(1); setNotice("Country list refreshed."); }

  return <section className="sa-data-panel sa-countries-panel" id="countries">
    <div className="sa-country-list-heading"><h2><List size={16}/> Country List</h2><div className="sa-country-heading-actions"><button type="button" className="sa-country-refresh" title="Refresh countries" aria-label="Refresh countries" onClick={refreshCountries}><RefreshCw size={16}/></button><button type="button" className="sa-country-add" title="Add Country" aria-label="Add Country" onClick={() => openForm()}><Plus size={17}/></button><button type="button" className="sa-country-delete" title="Delete selected countries" aria-label="Delete selected countries" onClick={deleteSelected}><Trash2 size={16}/></button></div></div>
    {notice && <div className="sa-currency-notice" role="status">{notice}</div>}
    <div className="table-scroll"><table className="admin-table sa-table sa-country-table"><thead><tr><th className="sa-country-check"><input type="checkbox" aria-label="Select all countries on this page" checked={allVisibleSelected} onChange={toggleAll}/></th><th><button type="button" className="sa-country-sort" onClick={() => setSortAsc(v => !v)}>Country Name <span>{sortAsc ? "⌃" : "⌄"}</span></button></th><th>ISO Code (2)</th><th>ISO Code (3)</th><th className="sa-country-action-head">Action</th></tr></thead><tbody>
      {visible.map(country => <tr key={country.id}><td className="sa-country-check"><input type="checkbox" aria-label={`Select ${country.name}`} checked={selected.includes(country.id)} onChange={e => setSelected(old => e.target.checked ? [...old, country.id] : old.filter(id => id !== country.id))}/></td><td><span className="sa-country-name">{country.name}</span><small className={country.status === "Enabled" ? "sa-country-enabled" : "sa-country-disabled"}>{country.status}</small></td><td>{country.code}</td><td>{country.code3}</td><td className="sa-country-action"><button type="button" title={`Edit ${country.name}`} aria-label={`Edit ${country.name}`} className="sa-country-edit" onClick={() => openForm(country)}><Pencil size={14}/></button></td></tr>)}
      {!visible.length && <tr><td colSpan={5} className="sa-currency-empty">No countries found.</td></tr>}
    </tbody></table></div>
    <div className="sa-country-pagination"><nav aria-label="Country pages"><button disabled={currentPage === 1} onClick={() => setPage(1)} aria-label="First page">|&lt;</button><button disabled={currentPage === 1} onClick={() => setPage(p => Math.max(1, p - 1))} aria-label="Previous page">&lt;</button>{Array.from({length: pages}, (_,i) => i + 1).filter(n => n === 1 || n === pages || Math.abs(n - currentPage) <= 3).map(n => <button key={n} className={n === currentPage ? "active" : ""} onClick={() => setPage(n)}>{n}</button>)}<button disabled={currentPage === pages} onClick={() => setPage(p => Math.min(pages, p + 1))} aria-label="Next page">&gt;</button><button disabled={currentPage === pages} onClick={() => setPage(pages)} aria-label="Last page">&gt;|</button></nav><span>Showing {filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0} to {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} ({pages} Pages)</span></div>
    {modal && createPortal(<div className="sa-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false); }}><form className="sa-plan-modal sa-country-modal" onSubmit={saveCountry}><div className="sa-modal-head"><h2>{editing ? "Edit Country" : "Add Country"}</h2><button type="button" className="sa-modal-close" onClick={() => setModal(false)} aria-label="Close"><X size={17}/></button></div><div className="sa-plan-form-grid"><label className="sa-form-wide">Country Name <b>*</b><input required maxLength={100} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Pakistan"/></label><label>ISO Code (2) <b>*</b><input required minLength={2} maxLength={2} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. PK"/></label><label>ISO Code (3) <b>*</b><input required minLength={3} maxLength={3} value={form.code3} onChange={e => setForm(f => ({ ...f, code3: e.target.value.toUpperCase() }))} placeholder="e.g. PAK"/></label><label>Phone Code<input value={form.phoneCode} onChange={e => setForm(f => ({ ...f, phoneCode: e.target.value }))} placeholder="e.g. +92"/></label><label className="sa-country-status-toggle"><span>Status</span><span className="sa-country-switch-wrap"><input type="checkbox" role="switch" aria-label="Country status" checked={form.status === "Enabled"} onChange={e => setForm(f => ({ ...f, status: e.target.checked ? "Enabled" : "Disabled" }))}/><span className="sa-country-switch-track" aria-hidden="true"><span className="sa-country-switch-knob"/></span></span></label></div>{notice && <p className="error" role="alert">{notice}</p>}<div className="sa-modal-actions sa-country-form-actions"><button type="button" className="sa-country-cancel-icon" title="Cancel" aria-label="Cancel" onClick={() => setModal(false)}><CornerUpLeft size={16} strokeWidth={2.5}/></button><button type="submit" className="sa-country-save-icon" title={editing ? "Save changes" : "Add country"} aria-label={editing ? "Save changes" : "Add country"}><Save size={16} strokeWidth={2.5}/></button></div></form></div>, document.body)}
  </section>;
}
