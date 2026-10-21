import { useEffect, useState } from "react";
import { Download, RefreshCw, BarChart3, Users, CreditCard, Repeat, UserRound } from "lucide-react";
import { api } from "../services/api";
import { Link, useLocation } from "react-router-dom";

type Summary = {
  range: { from: string; to: string };
  metrics: { customers: number; users: number; plans: number; payments: number; subscriptions: number; grossRevenue: number; successfulTransactions: number };
  recentPayments: any[];
  signupsByDay: { _id: string; count: number }[];
};
type Tab = "overview" | "sales" | "subscriptions" | "customers";

function dateString(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
const reportLinks = [
  { title: "Customer Activity Report", path: "/admin/reports/customer-activity", description: "Review customer activity and account engagement." },
  { title: "Customer Orders Report", path: "/admin/reports/customer-orders", description: "Review orders and their current statuses." },
  { title: "Customer Reward Points Report", path: "/admin/reports/customer-reward-points", description: "Review customer reward point balances and activity." },
  { title: "Customer Transaction Report", path: "/admin/reports/customer-transactions", description: "Review customer payment transactions." },
  { title: "Customer Report", path: "/admin/reports/customer-report", description: "Review customer records and registration dates." },
  { title: "Tax Report", path: "/admin/reports/tax", description: "Review tax-related sales information." },
  { title: "Coupons Report", path: "/admin/reports/coupons", description: "Review coupon usage and promotion performance." },
  { title: "Customer Subscription", path: "/admin/reports/customer-subscription", description: "Review customer subscription activity." },
];

export default function Reports() {
  const location = useLocation();
  const selectedReport = reportLinks.find(r => decodeURI(location.pathname).toLowerCase() === decodeURI(r.path).toLowerCase());
  const today = new Date();
  const prior = new Date(); prior.setDate(today.getDate()-29);
  const [from,setFrom]=useState(dateString(prior));
  const [to,setTo]=useState(dateString(today));
  const [tab,setTab]=useState<Tab>("overview");
  const [summary,setSummary]=useState<Summary|null>(null);
  const [detail,setDetail]=useState<any>(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const qs=`?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  async function load(){
    setLoading(true);setError("");
    try {
      const s=await api<Summary>(`/admin/reports/summary${qs}`);setSummary(s);
      if(tab==="sales")setDetail(await api(`/admin/reports/sales${qs}`));
      else if(tab==="subscriptions")setDetail(await api(`/admin/reports/subscriptions${qs}`));
      else if(tab==="customers")setDetail(await api(`/admin/reports/customers${qs}`));
      else setDetail(null);
    } catch(e){setError(e instanceof Error?e.message:"Could not load reports");}
    finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[tab]);
  function exportCsv(kind:"payments"|"customers"){
    const token=localStorage.getItem("strafe_admin_token");
    const url=`${import.meta.env.VITE_API_URL||"http://localhost:4001/api"}/admin/reports/export/${kind}.csv${qs}`;
    fetch(url,{headers:token?{Authorization:`Bearer ${token}`}:{}}).then(async r=>{
      if(!r.ok)throw new Error("Export failed");
      const blob=await r.blob(),href=URL.createObjectURL(blob),a=document.createElement("a");
      a.href=href;a.download=`strafemc-${kind}.csv`;a.click();URL.revokeObjectURL(href);
    }).catch(e=>setError(e instanceof Error?e.message:"Export failed"));
  }
  const money=(v:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(v||0);
  return <main className="reports-page">
    <div className="reports-head"><div><Link className="reports-back-link" to="/admin">← Back to dashboard</Link><p className="eyebrow">STRAFEMC CONTROL PANEL</p><h1>Reports &amp; Analytics</h1><p>Review store performance, subscriptions, customers, and payments.</p></div><button type="button" className="reports-refresh-icon bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={()=>void load()} disabled={loading} aria-label="Refresh reports" title="Refresh reports"><RefreshCw size={17} className={loading?"reports-refresh-spinning":""}/></button></div>
    <div className="reports-workspace">
      <aside className="reports-side-tabs" aria-label="Reports navigation">
        <div className="reports-side-heading"><BarChart3 size={17}/><span>Reports</span></div>
        <Link to="/admin/reports" className={`reports-side-tab ${!selectedReport ? "active" : ""}`}>
          <span className="reports-side-tab-mark"/><span>Overview</span>
        </Link>
        {reportLinks.map(report => <Link key={report.path} to={report.path} className={`reports-side-tab ${selectedReport?.path === report.path ? "active" : ""}`} title={report.description}>
          <span className="reports-side-tab-mark"/><span>{report.title}</span>
        </Link>)}
      </aside>
      <section className="reports-main-panel">
        {selectedReport ? <div className="selected-report-title"><h2>{selectedReport.title}</h2><p>{selectedReport.description}</p></div> : <div className="selected-report-title"><h2>Reports Overview</h2><p>Choose a report from the left menu to review its information.</p></div>}
    <div className="report-filters"><label>From<input type="date" value={from} max={to} onChange={e=>setFrom(e.target.value)}/></label><label>To<input type="date" value={to} min={from} onChange={e=>setTo(e.target.value)}/></label><button className="button button-primary bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={()=>void load()} disabled={loading}>Apply dates</button><button className="button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={()=>exportCsv("payments")}><Download size={14}/> Payments CSV</button><button className="button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={()=>exportCsv("customers")}><Download size={14}/> Customers CSV</button></div>
    {error&&<p className="notice">{error}</p>}
    <div className="report-tabs">{(["overview","sales","subscriptions","customers"] as Tab[]).map(t=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>)}</div>
    <div className="report-metrics">
      <article><span><BarChart3 size={16}/> Gross revenue</span><strong>{summary?money(summary.metrics.grossRevenue):"—"}</strong><small>Successful payments in date range</small></article>
      <article><span><CreditCard size={16}/> Successful transactions</span><strong>{summary?.metrics.successfulTransactions??"—"}</strong><small>Payments marked succeeded</small></article>
      <article><span><UserRound size={16}/> New customers</span><strong>{summary?.metrics.customers??"—"}</strong><small>Customer records created</small></article>
      <article><span><Repeat size={16}/> New subscriptions</span><strong>{summary?.metrics.subscriptions??"—"}</strong><small>Subscriptions created</small></article>
      <article><span><Users size={16}/> New user accounts</span><strong>{summary?.metrics.users??"—"}</strong><small>User accounts created</small></article>
    </div>
    {tab==="overview"&&<section className="report-panel"><div className="panel-title"><h2>Daily new accounts</h2><span>{from} — {to}</span></div>{summary?.signupsByDay.length?<div className="signup-chart">{summary.signupsByDay.map(d=><div className="chart-col" key={d._id} title={`${d._id}: ${d.count} users`}><span className={`chart-bar chart-bar-${Math.max(8,Math.min(100,Math.round(d.count*18/5)*5))}`} /><small>{d._id.slice(5)}</small><b>{d.count}</b></div>)}</div>:<div className="report-empty">No new account registrations in this date range.</div>}</section>}
    {tab==="sales"&&<section className="report-panel"><div className="panel-title"><h2>Payment transactions</h2><span>{detail?.totals?.count??0} records</span></div><div className="table-scroll"><table className="admin-table"><thead><tr><th>Date</th><th>Customer</th><th>Plan</th><th>Amount</th><th>Provider</th><th>Status</th></tr></thead><tbody>{(detail?.payments||[]).map((p:any)=><tr key={p._id}><td>{new Date(p.createdAt).toLocaleDateString()}</td><td>{p.user?.email||"—"}</td><td>{p.plan?.name||"—"}</td><td>{p.currency} {Number(p.amount).toFixed(2)}</td><td>{p.provider}</td><td><span className={`status-pill ${p.status}`}>{p.status}</span></td></tr>)}</tbody></table></div></section>}
    {tab==="subscriptions"&&<section className="report-panel"><div className="panel-title"><h2>Subscription activity</h2><span>{detail?.totals?.count??0} records</span></div><div className="table-scroll"><table className="admin-table"><thead><tr><th>Customer</th><th>Plan</th><th>Status</th><th>Started</th><th>Period end</th></tr></thead><tbody>{(detail?.subscriptions||[]).map((s:any)=><tr key={s._id}><td>{s.user?.email||"—"}</td><td>{s.plan?.name||"—"}</td><td><span className={`status-pill ${s.status}`}>{s.status}</span></td><td>{s.startsAt?new Date(s.startsAt).toLocaleDateString():"—"}</td><td>{s.currentPeriodEnd?new Date(s.currentPeriodEnd).toLocaleDateString():"—"}</td></tr>)}</tbody></table></div></section>}
    {tab==="customers"&&<section className="report-panel"><div className="panel-title"><h2>New customer records</h2><span>{detail?.totals?.count??0} records</span></div><div className="table-scroll"><table className="admin-table"><thead><tr><th>Customer</th><th>Email</th><th>Minecraft</th><th>Source</th><th>Joined</th></tr></thead><tbody>{(detail?.customers||[]).map((c:any)=><tr key={c._id}><td>{[c.firstName,c.lastName].filter(Boolean).join(" ")||c.displayName||"—"}</td><td>{c.email}</td><td>{c.minecraftUsername||"—"}</td><td>{c.source}</td><td>{new Date(c.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></section>}
      </section>
    </div>
  </main>;
}
