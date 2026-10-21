import { ShieldCheck } from "lucide-react";
export type RankPlan = { _id?: string; code: string; name: string; description?: string; price: number; monthlyPrice?: number; yearlyPrice?: number; currency: string; billingInterval: string; features: string[]; isActive?: boolean; chatPrefix?: string; coloredChat?: boolean; joinMessage?: boolean };

export default function PlansCard({ plan, onPurchase, busy = false }: { plan: RankPlan; onPurchase: (plan: RankPlan) => void; busy?: boolean }) {
  return <article className={`rank-card ${plan.code.toLowerCase()}`}>
    <div className="rank-icon" aria-label={`${plan.name} rank icon`}>
      <ShieldCheck className="rank-icon-shield" size={42} strokeWidth={1.8} aria-hidden="true" />
    </div>
    <h3>{plan.name}</h3>
    {plan.description && <p className="rank-description">{plan.description}</p>}
    <div className="price-options"><p className="price"><small>Monthly Price</small><br />{plan.currency === "USD" ? "$" : `${plan.currency} `}{Number(plan.monthlyPrice ?? (plan.billingInterval === "month" ? plan.price : 0)).toFixed(2)} <small>/month</small></p><p className="price"><small>Yearly Price</small><br />{plan.currency === "USD" ? "$" : `${plan.currency} `}{Number(plan.yearlyPrice ?? 0).toFixed(2)} <small>/year</small></p></div>
    <button className="button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" disabled={busy} onClick={() => onPurchase(plan)}>{busy ? "Please wait…" : "Purchase Rank"}</button>
  </article>;
}
