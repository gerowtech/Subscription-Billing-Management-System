import { useEffect, useState } from "react";
import { Info, RefreshCw } from "lucide-react";
import { api } from "../services/api";
type Player={username:string;points:number;rank:string;teamName?:string;avatar?:string};
type TierColumn={name:string;subtitle:string;players:Player[]};
type TierResponse={mode:string;season:string;queue:string;demo?:boolean;tiers?:TierColumn[];players?:Player[]};
export default function Tiers(){
 const [mode,setMode]=useState<"smp"|"pvp">("smp");
 const [queue,setQueue]=useState<"solo"|"team">("solo");
 const [season,setSeason]=useState("1");
 const [columns,setColumns]=useState<TierColumn[]>([]);
 const [loading,setLoading]=useState(true); const [isDemo,setIsDemo]=useState(false); const [error,setError]=useState("");
 async function load(){setLoading(true);setError("");try{
   const data=await api<TierResponse>(`/tiers?mode=${mode}&season=${season}&queue=${queue}&demo=true`);
   let next=data.tiers;
   if(!next && data.players){const names=["S Tier","A Tier","B Tier","C Tier","F Tier"];next=names.map(name=>({name,subtitle:name==="F Tier"?"Remaining players":"Top 3%",players:(data.players||[]).filter(p=>p.rank===name)}));}
   setColumns(next||[]);setIsDemo(Boolean(data.demo));
 }catch(e){setError(e instanceof Error?e.message:"Unable to load tiers");setColumns([])}finally{setLoading(false)}}
 useEffect(()=>{void load()},[mode,queue,season]);
 return <main className="tiers-page tiers-demo-page">
  <div className="tiers-heading"><h1>Tiers</h1><div className="segmented"><button className={mode==="smp"?"selected":""} onClick={()=>setMode("smp")}>SMP</button><button className={mode==="pvp"?"selected":""} onClick={()=>setMode("pvp")}>PVP</button></div><label className="season-select">SEASON <select value={season} onChange={e=>setSeason(e.target.value)}><option value="1">Season 1 · CURRENT</option><option value="0">Pre-season</option></select></label></div>
  <button className="info-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={()=>alert("Demo standings are sample data. Connect your tier-list API or disable the demo fallback to show live rankings.")}><Info size={15}/> Information</button>
  <div className="queue-tabs"><button className={queue==="solo"?"active":""} onClick={()=>setQueue("solo")}><span>⚔️</span>Solo</button><button className={queue==="team"?"active":""} onClick={()=>setQueue("team")}><span>🛡️</span>Team</button></div>
  <section className="tier-columns-wrap">{loading?<div className="tier-message"><RefreshCw size={20} className="spin"/> Loading tier rankings…</div>:error?<div className="tier-message error">{error}<button className="mini-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={()=>void load()}>Retry</button></div>:<div className="tier-columns">{columns.map((col)=><article className={`tier-column tier-${col.name.charAt(0).toLowerCase()}`} key={col.name}><header><strong>{col.name}</strong><small>{col.subtitle}</small></header><div className="tier-player-list">{col.players.length?col.players.map((p,i)=><div className="tier-player" key={`${p.username}-${i}`}><img src={p.avatar||`https://mc-heads.net/avatar/${encodeURIComponent(p.username)}/32`} alt="" loading="lazy" onError={e=>{e.currentTarget.style.visibility="hidden"}}/><span title={p.teamName||p.username}>{p.teamName||p.username}</span><b>{p.points.toLocaleString()}</b></div>):<div className="tier-no-players">No players yet</div>}</div></article>)}</div>}</section>
  <div className="tier-footnote">{isDemo?"DEMO DATA · Sample rankings shown until live tier data is available":"LIVE DATA · Rankings provided by the StrafeMC API"}</div>
 </main>;
}
