import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { RankPlan } from "../components/RankCard";
import { api } from "../services/api";
import { useSearchParams } from "react-router-dom";

type CheckoutState = { plan?: RankPlan };
const packageFallbacks: Record<string, RankPlan> = {
 "610356071831175168": { code: "STRIDE", name: "STRIDE", price: 2.99, currency: "USD", billingInterval: "one_time", features: [] },
 "610356408885452800": { code: "STRAFE", name: "STRAFE", price: 6.99, currency: "USD", billingInterval: "one_time", features: [] },
 "610356602330939392": { code: "STRAFE_PLUS", name: "STRAFE+", price: 9.99, currency: "USD", billingInterval: "month", features: [] },
 "610356742114516992": { code: "SUPREME", name: "SUPREME", price: 12.99, currency: "USD", billingInterval: "month", features: [] },
};
export default function Checkout() {
 const location = useLocation(); const navigate = useNavigate(); const [searchParams] = useSearchParams();
 const packageId = searchParams.get("package") || "";
 const statePlan = (location.state as CheckoutState | null)?.plan;
 const [resolvedPlan, setResolvedPlan] = useState<RankPlan | undefined>(statePlan || packageFallbacks[packageId]);
 useEffect(() => {
  if (statePlan && (!packageId || packageId === statePlan._id)) { setResolvedPlan(statePlan); return; }
  if (!packageId) { setResolvedPlan(statePlan); return; }
  const localFallback = packageFallbacks[packageId];
  api<{plans: RankPlan[]}>("/plans").then(result => {
   const match = result.plans?.find(p => p._id === packageId || p.code === localFallback?.code);
   if (match) setResolvedPlan(match); else if (localFallback) setResolvedPlan(localFallback);
  }).catch(() => { if (localFallback) setResolvedPlan(localFallback); });
 }, [packageId]);
 const plan = resolvedPlan;
 const savedUsername = localStorage.getItem("minecraft_username") || "";
 const [username, setUsername] = useState(savedUsername || "IndraPvp");
 const [email, setEmail] = useState(localStorage.getItem("minecraft_receipt_email") || "");
 const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
 if (!plan) return <main className="checkout-page"><section className="checkout-card"><h1>No rank selected</h1><p>Choose a rank before checking out.</p><Link className="button" to="/ranks">Back to ranks</Link></section></main>;
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault(); setBusy(true); setMessage("");
  try { localStorage.setItem("minecraft_username", username.trim()); localStorage.setItem("minecraft_receipt_email", email.trim()); const result = await api<{url?: string; message?: string}>("/checkout", { method: "POST", body: JSON.stringify({ planCode: plan.code, package: packageId, username: username.trim(), email: email.trim() }) }); if (result.url) window.location.href = result.url; else setMessage(result.message || "Demo checkout created. No payment was charged."); }
  catch (error) { setMessage(error instanceof Error ? error.message : "Checkout failed. Please try again."); } finally { setBusy(false); }
 }
 const price = `${plan.currency === "USD" ? "$" : `${plan.currency} `}${Number(plan.price).toFixed(2)}`;
 return <main className="checkout-page"><header className="checkout-heading"><h1>Checkout</h1><p>Enter your Minecraft username and review your order.</p></header><form className="checkout-card" onSubmit={submit}><input type="hidden" name="package" value={packageId || plan._id || ""}/><label className="checkout-label" htmlFor="minecraft-username">Minecraft username</label><div className="checkout-account-row"><input id="minecraft-username" name="username" autoComplete="username" className="checkout-input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter your in-game name" required minLength={3} maxLength={16} pattern="[A-Za-z0-9_]{3,16}" title="Use 3–16 letters, numbers, or underscores." /></div><label className="checkout-label email-label" htmlFor="receipt-email">Email address</label><input id="receipt-email" className="checkout-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email for receipt" required/><div className="checkout-divider"/><div className="checkout-caption">ORDER SUMMARY</div><div className="checkout-order"><div><strong>{plan.name}</strong><span>{plan.billingInterval === "month" ? "Monthly subscription" : "Permanent rank"}</span></div><strong>{price}</strong></div><div className="checkout-divider total-divider"/><div className="checkout-total"><span>Total</span><strong>{price}</strong></div>{message && <p className="notice checkout-notice" role="status">{message}</p>}<div className="checkout-actions"><button className="button checkout-submit bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit" disabled={busy}>{busy ? "PLEASE WAIT…" : "CHECKOUT"}</button><Link className="button checkout-back-button" to="/ranks">Back to Ranks</Link></div><p className="checkout-safe">Never enter or share your Minecraft account password.</p></form></main>;
}
