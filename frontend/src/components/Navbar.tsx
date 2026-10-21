import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

type PublicSettings = { appName?: string };
export default function Navbar() {
  const [appName, setAppName] = useState("StrafeMC");
  useEffect(() => {
    let active = true;
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4001/api"}/settings/application`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Settings unavailable")))
      .then((data: { settings?: PublicSettings }) => { if (active && data.settings?.appName) setAppName(data.settings.appName); })
      .catch(() => { /* Keep the default brand when the API is unavailable. */ });
    return () => { active = false; };
  }, []);
  return <header className="navbar"><div className="nav-inner">
    <Link to="/" className="brand brand-logo" aria-label={`${appName} home`}>
      <img src="/images/strafemc-logo.png" alt={appName} />
    </Link>
    <nav>
      <NavLink to="/">Home</NavLink>
      <NavLink to="/features">Features</NavLink>
      <NavLink to="/ranks">Ranks</NavLink>
      <NavLink to="/faq">FAQ</NavLink>
      <NavLink to="/tiers">Tiers</NavLink>
      <a className="discord-nav" href="https://discord.strafemc.net/" target="_blank" rel="noreferrer">Discord <span aria-hidden="true">»</span></a>
    </nav>
  </div></header>;
}
