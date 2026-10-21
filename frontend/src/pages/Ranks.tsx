import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { RankPlan } from "../components/RankCard";
import { api } from "../services/api";

const fallback: RankPlan[] = [
 {code:"STRIDE",name:"STRIDE",price:2.99,currency:"USD",billingInterval:"one_time",features:["1 extra home","Player vaults","Daily Stride kit","Utility commands"]},
 {code:"STRAFE",name:"STRAFE",price:6.99,currency:"USD",billingInterval:"one_time",features:["1 extra home","Player vaults","Daily Stride kit","Utility commands"]},
 {code:"STRAFE_PLUS",name:"STRAFE+",price:9.99,monthlyPrice:9.99,yearlyPrice:119.88,currency:"USD",billingInterval:"month",features:["1 extra home","Player vaults","Daily Stride kit","Utility commands","Monthly renewal"]},
 {code:"SUPREME",name:"SUPREME",price:12.99,monthlyPrice:12.99,yearlyPrice:155.88,currency:"USD",billingInterval:"month",features:["1 extra home","Player vaults","Daily Stride kit","Utility commands","Supreme perks","Monthly renewal"]}
];
type FeatureRow = {name:string; has:(p:RankPlan)=>boolean; value?:(p:RankPlan)=>string};

export default function Ranks() {
 const navigate = useNavigate();
 const [plans,setPlans]=useState<RankPlan[]>(fallback);
 const [billing,setBilling]=useState<"monthly"|"yearly">("monthly");
 const [message,setMessage]=useState("");
 useEffect(()=>{api<{plans:RankPlan[]}>("/plans").then(r=>{if(r.plans?.length)setPlans(r.plans)}).catch(()=>{});},[]);
 const packageIds: Record<string, string> = {
  STRIDE: "610356071831175168", STRAFE: "610356408885452800",
  STRAFE_PLUS: "610356602330939392", SUPREME: "610356742114516992",
 };
 function purchase(plan:RankPlan){
  const packageId = plan._id || packageIds[plan.code] || packageIds[plan.name.toUpperCase().replace("+", "_PLUS")];
  navigate(`/checkout?package=${encodeURIComponent(packageId)}&billing=${billing}`, { state: { plan, billing } });
 }
 const active=plans.filter(p=>p.isActive!==false);
 const priceFor=(p:RankPlan)=> {
  const amount=billing==="monthly"
   ? (p.monthlyPrice ?? (p.billingInterval==="month" ? p.price : p.price))
   : (p.yearlyPrice ?? (p.monthlyPrice ?? p.price)*12);
  return `${p.currency==="USD"?"$":`${p.currency} `}${Number(amount||0).toFixed(2)}`;
 };
 const has=(p:RankPlan,...terms:string[])=>p.features.some(f=>terms.some(t=>f.toLowerCase().includes(t)));
 const rows:FeatureRow[]=[
  {name:"Overworld RTP Radius",has:p=>has(p,"overworld rtp"),value:p=>p.features.find(x=>x.toLowerCase().includes("overworld rtp"))?.split(":").slice(1).join(":").trim()||"—"},
  {name:"Nether RTP Radius",has:p=>has(p,"nether rtp"),value:p=>p.features.find(x=>x.toLowerCase().includes("nether rtp"))?.split(":").slice(1).join(":").trim()||"—"},
  {name:"Rank Kit",has:p=>has(p,"kit"),value:p=>p.features.find(x=>x.toLowerCase().includes("kit"))?.replace(/daily\\s*/i,"")||"—"},
  {name:"Portable Crafting",has:p=>has(p,"portable crafting")},
  {name:"Portable Anvil",has:p=>has(p,"portable anvil")},
  {name:"Diagonal Command",has:p=>has(p,"diagonal command","diag command")},
  {name:"Hat Command",has:p=>has(p,"hat command")},
  {name:"Portable Ender Chest",has:p=>has(p,"portable ender chest")},
  {name:"Portable Smithing Table",has:p=>has(p,"portable smithing table")},
  {name:"Condense Items",has:p=>has(p,"condense items","condense item")},
  {name:"Personal Time",has:p=>has(p,"personal time")},
  {name:"Personal Weather",has:p=>has(p,"personal weather")},
  {name:"AFK Command",has:p=>has(p,"afk command")},
  {name:"Colored Username",has:p=>has(p,"colored username")},
  {name:"Rank Prefix",has:p=>has(p,"rank prefix"),value:p=>(p as RankPlan & {chatPrefix?:string}).chatPrefix||p.name.toUpperCase()},
  {name:"Rank Theme",has:p=>has(p,"rank theme"),value:p=>p.features.find(x=>x.toLowerCase().includes("rank theme"))?.split(":").slice(1).join(":").trim()||"—"},
  {name:"Extra homes",has:p=>has(p,"home"),value:p=>{const f=p.features.find(x=>x.toLowerCase().includes("home"));return f?.match(/^\\d+/)?.[0]|| (f?"✓":"×")}},
  {name:"Player vaults",has:p=>has(p,"vault")},
  {name:"Daily kit",has:p=>has(p,"kit"),value:p=>p.features.find(x=>x.toLowerCase().includes("kit"))?.replace(/daily\\s*/i,"")||"✓"},
  {name:"Utility commands",has:p=>has(p,"command","util")},
  {name:"Flight",has:p=>has(p,"flight")},
  {name:"Colored chat",has:p=>has(p,"colored chat","colour chat") || Boolean((p as RankPlan & {coloredChat?:boolean}).coloredChat)},
  {name:"Join message",has:p=>has(p,"join message") || Boolean((p as RankPlan & {joinMessage?:boolean}).joinMessage)},
  {name:"Chat prefix",has:p=>Boolean((p as RankPlan & {chatPrefix?:string}).chatPrefix),value:p=>(p as RankPlan & {chatPrefix?:string}).chatPrefix||"×"}
 ];
 return <main className="ranks-page pricing-page">
  <header className="pricing-heading">
   <h1>Choose Your Rank</h1>
   <p>Unlock more perks and make your StrafeMC experience your own.</p>
   <div className="pricing-billing-switch" role="group" aria-label="Billing period">
    <button className={billing==="monthly"?"selected":""} onClick={()=>setBilling("monthly")} aria-pressed={billing==="monthly"}>Monthly</button>
    <button className={`billing-switch ${billing==="yearly"?"annual-selected":""} bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`} onClick={()=>setBilling("yearly")} aria-label="Toggle annual billing" aria-pressed={billing==="yearly"}><span /></button>
    <button className={billing==="yearly"?"selected":""} onClick={()=>setBilling("yearly")} aria-pressed={billing==="yearly"}>Annual</button>
   </div>
  </header>
  {message&&<p className="notice">{message}</p>}
  <section className="rank-pricing-cards" aria-label="Rank pricing plans">
   {active.map((p,i)=><article className={`rank-pricing-card rank-price-color-${i%4}`} key={p.code}>
    <div className="rank-price-top">
     <div className="rank-price-amount">{priceFor(p)}</div>
     <div className="rank-price-period">Per {billing==="monthly"?"Month":"Year"}</div>
    </div>
    <div className="rank-price-name">{p.name}</div>
    <ul className="rank-price-features">
     {rows.map(row=>{
      const included=row.has(p);
      const value=row.value?row.value(p):"";
      return <li key={row.name}>
       <span className={included?"rank-feature-check":"rank-feature-cross"} aria-label={included?"Included":"Not included"}>{included?"✓":"×"}</span>
       <span className="rank-price-feature-text">{row.name}{included&&value&&value!=="✓"&&value!=="×"&&value!==row.name?`: ${value}`:""}</span>
      </li>;
     })}
    </ul>
    <button className="rank-price-buy bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={()=>purchase(p)}>Purchase Rank</button>
   </article>)}
  </section>
  <p className="pricing-disclaimer">Rank benefits and prices are shown from the current store configuration. Never share your Minecraft password.</p>
 </main>;
}
