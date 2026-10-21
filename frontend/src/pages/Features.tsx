import { Link } from "react-router-dom";
import { Zap, ShieldCheck, Users, Trophy, Swords, Store, ChevronRight } from "lucide-react";

const features = [
  { icon: Swords, title: "Competitive Gameplay", text: "Test your skills, take on other players, and work your way up the competitive ladder." },
  { icon: Trophy, title: "Tier Rankings", text: "Explore SMP and PVP tiers, with solo and team queues to track your competitive journey.", link: "/tiers", label: "Explore tiers" },
  { icon: ShieldCheck, title: "Ranks & Perks", text: "Choose the rank that suits you and compare available perks before upgrading.", link: "/ranks", label: "Compare ranks" },
  { icon: Users, title: "Community & Events", text: "Meet other players, join the community, and keep in touch with server activities.", external: "https://discord.strafemc.net/", label: "Join Discord" },
  { icon: Zap, title: "Quick Server Access", text: "Jump into the action using the StrafeMC server address: play.strafemc.net." },
  { icon: Store, title: "Store & Rank Options", text: "View rank options, pricing, and included benefits on the StrafeMC store.", link: "/ranks", label: "Visit store" }
];

export default function Features() {
  return <main className="features-page">
    <section className="features-hero">
      <span className="home-featured-kicker">THE STRAFEMC EXPERIENCE</span>
      <h1>Server <span>Features</span></h1>
      <p>Everything you need to compete, progress, and connect with the StrafeMC community.</p>
    </section>
    <section className="features-grid" aria-label="StrafeMC features">
      {features.map(({ icon: Icon, title, text, link, external, label }) => <article className="features-card" key={title}>
        <div className="features-icon"><Icon size={23}/></div>
        <h2>{title}</h2><p>{text}</p>
        {link && <Link to={link}>{label} <ChevronRight size={15}/></Link>}
        {external && <a href={external} target="_blank" rel="noreferrer">{label} <ChevronRight size={15}/></a>}
      </article>)}
    </section>
    <section className="features-cta"><h2>Ready to join the action?</h2><p>Connect to <strong>play.strafemc.net</strong> or explore the available ranks.</p><div><Link className="button" to="/ranks">Explore Ranks</Link><Link className="button" to="/tiers">View Tiers</Link></div></section>
  </main>;
}
