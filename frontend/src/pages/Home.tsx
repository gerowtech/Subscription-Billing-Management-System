import { useEffect, useState } from "react";
import { Copy, Crown, Trophy, ChevronLeft, ChevronRight, Zap, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import ServerStatus from "../components/ServerStatus";
import RankCard, { type RankPlan } from "../components/RankCard";
import { api } from "../services/api";

const fallbackRanks: RankPlan[] = [
  { code: "STRIDE", name: "STRIDE", price: 2.99, currency: "USD", billingInterval: "one_time", features: ["1 extra home", "Player vaults", "Daily Stride kit", "Utility commands"] },
  { code: "STRAFE", name: "STRAFE", price: 6.99, currency: "USD", billingInterval: "one_time", features: ["1 extra home", "Player vaults", "Daily Stride kit", "Utility commands"] },
  { code: "STRAFE_PLUS", name: "STRAFE+", price: 9.99, currency: "USD", billingInterval: "month", features: ["1 extra home", "Player vaults", "Daily Stride kit", "Utility commands", "Monthly renewal"] },
  { code: "SUPREME", name: "SUPREME", price: 12.99, currency: "USD", billingInterval: "month", features: ["1 extra home", "Player vaults", "Daily Stride kit", "Utility commands", "Supreme perks", "Monthly renewal"] }
];

const IP = "play.strafemc.net";

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [ranks, setRanks] = useState<RankPlan[]>(fallbackRanks);
  const [heroSlide, setHeroSlide] = useState(0);
  const heroRanks = [
    { name: "STRIDE", image: "/images/rank-stride.jpg", color: "#35d399" },
    { name: "STRAFE", image: "/images/rank-strafe.jpg", color: "#4895ff" },
    { name: "STRAFE+", image: "/images/rank-strafe-plus.jpg", color: "#f5c542" },
    { name: "SUPREME", image: "/images/rank-supreme.jpg", color: "#ff5364" }
  ];

  useEffect(() => {
    api<{ plans: RankPlan[] }>("/plans").then((result) => {
      if (result.plans?.length) setRanks(result.plans.filter((plan) => plan.isActive !== false).slice(0, 4));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setHeroSlide((current) => (current + 1) % heroRanks.length), 4500);
    return () => window.clearInterval(timer);
  }, []);


  async function copyIp() {
    try {
      await navigator.clipboard.writeText(IP);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy server IP", IP);
    }
  }

  return <main className="home legacy-home">
    <section className="legacy-hero">
      <div className="legacy-hero-copy">
        <h1>Strafe<span>MC</span></h1>
        <h2>The Only Competitive Server You Need.</h2>
        <p className="legacy-tags">Twists <i>·</i> Events <i>·</i> Tiers</p>
        <button className="server-ip legacy-server-ip bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={copyIp} aria-label="Copy Minecraft server address">
          <strong>{IP}</strong><Copy size={15} />
          <small>1.21+ · Java &amp; Bedrock</small>
          <span className="copy-feedback">{copied ? "Copied!" : ""}</span>
        </button>
        <div className="legacy-status"><ServerStatus /></div>
      </div>
      <div className={`legacy-hero-image hero-rank-image-slider rank-accent-${heroSlide + 1}`} aria-label="Featured StrafeMC ranks" aria-roledescription="carousel">
        {heroRanks.map((rank, index) => <div key={rank.name} className={`hero-rank-image-slide rank-slide-${index + 1} ${heroSlide === index ? "active" : ""}`} aria-hidden={heroSlide !== index}><img src={rank.image} alt="" /></div>)}
        <button className="hero-rank-arrow hero-rank-prev bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button" aria-label="Previous rank" onClick={() => setHeroSlide((heroSlide + heroRanks.length - 1) % heroRanks.length)}><ChevronLeft size={23} /></button>
        <button className="hero-rank-arrow hero-rank-next bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button" aria-label="Next rank" onClick={() => setHeroSlide((heroSlide + 1) % heroRanks.length)}><ChevronRight size={23} /></button>
        <div className="hero-rank-image-caption"><span>FEATURED RANK</span><strong className={`rank-caption-${heroSlide + 1}`}>{heroRanks[heroSlide].name}</strong><small>{heroSlide === 0 ? "Your competitive journey starts here" : heroSlide === 1 ? "Built for serious competitors" : heroSlide === 2 ? "Step up your game" : "The ultimate experience"}</small></div>
        <div className="hero-rank-image-dots" aria-label="Choose rank image">{heroRanks.map((rank, index) => <button type="button" key={rank.name} aria-label={`Show ${rank.name} image`} aria-pressed={heroSlide === index} className={heroSlide === index ? "active" : ""} onClick={() => setHeroSlide(index)} />)}</div>
      </div>
    </section>

    <div className="legacy-actions">
      <Link className="button" to="/ranks"><Crown size={14} /> RANKS</Link>
      <Link className="button" to="/tiers"><Trophy size={14} /> TIERLISTS</Link>
    </div>

    <section className="home-featured-ranks" aria-labelledby="home-featured-ranks-title">
      <div className="home-featured-ranks-heading">
        <div><span className="home-featured-kicker">UPGRADE YOUR GAME</span><h2 id="home-featured-ranks-title">Choose Your Rank</h2><p>Unlock perks and stand out on StrafeMC.</p></div>
        <Link className="home-featured-view-all" to="/ranks">View all ranks <ChevronRight size={16}/></Link>
      </div>
      <div className="home-featured-rank-grid">
        {heroRanks.map((rank, index) => {
          const plan = ranks.find((item) => item.name.toUpperCase() === rank.name || item.code.toUpperCase() === rank.name.replace("+", "_PLUS")) || fallbackRanks[index];
          const price = Number(plan.price).toFixed(2);
          const interval = plan.billingInterval === "month" ? "/ month" : "/ one-time";
          return <Link to="/ranks" className={`home-featured-rank-card rank-${index + 1} rank-accent-${index + 1}`} key={rank.name}>
            <div className={`home-featured-rank-art rank-art-${index + 1}`}><img className="rank-art-image" src={rank.image} alt="" />
              <span className="home-featured-rank-index">{index + 1} / 4</span>
              <span className="home-featured-rank-kicker">✦ STRAFEMC RANK</span>
              <div className="home-featured-rank-title"><small>UNLOCK YOUR POTENTIAL</small><h3>{rank.name}</h3><strong>${price} <small>{interval}</small></strong></div>
            </div>
            <div className="home-featured-rank-details"><span>{plan.features?.slice(0, 2).join(" · ") || "Exclusive server perks"}</span><span className="home-featured-rank-cta">Explore rank <ChevronRight size={15}/></span></div>
          </Link>;
        })}
      </div>
    </section>

    <section id="features" className="home-info-section" aria-labelledby="features-title">
      <div className="home-info-heading">
        <span className="home-featured-kicker">WHY STRAFEMC</span>
        <h2 id="features-title">Built for Competitive Players</h2>
        <p>Jump in, sharpen your skills, and make your mark on the server.</p>
      </div>
      <div className="home-info-grid">
        <article><Zap size={24}/><h3>Competitive Gameplay</h3><p>Test your skills, climb the tiers, and compete with other players.</p></article>
        <article><ShieldCheck size={24}/><h3>Ranks & Perks</h3><p>Choose a rank to unlock perks and personalize your experience.</p><Link to="/ranks">Explore ranks <ChevronRight size={14}/></Link></article>
        <article><Users size={24}/><h3>Community & Events</h3><p>Meet other players, join the community, and stay up to date with events.</p><a href="https://discord.strafemc.net/" target="_blank" rel="noreferrer">Join Discord <ChevronRight size={14}/></a></article>
      </div>
    </section>

    <section id="faq" className="home-faq-section" aria-labelledby="faq-title">
      <div className="home-info-heading">
        <span className="home-featured-kicker">QUICK ANSWERS</span>
        <h2 id="faq-title">Frequently Asked Questions</h2>
      </div>
      <div className="home-faq-list">
        <details><summary>How do I join StrafeMC?</summary><p>Connect to <strong>{IP}</strong> using Minecraft Java or Bedrock version 1.21 or newer.</p></details>
        <details><summary>Where can I see the available ranks?</summary><p>Visit the <Link to="/ranks">Ranks page</Link> to compare available ranks, perks, and prices.</p></details>
        <details><summary>Where can I view player tiers?</summary><p>Open the <Link to="/tiers">Tiers page</Link> to explore SMP and PVP rankings for solo and team queues.</p></details>
      </div>
      <div className="home-faq-more"><Link className="button" to="/faq">View all FAQs <ChevronRight size={15}/></Link></div>
    </section>
  </main>;
}
