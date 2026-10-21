import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const config: Record<string, { title: string; description: string; path: string }> = {
  "/": { title: "StrafeMC — Competitive Minecraft Server | PvP, SMP & Tiers", description: "Join StrafeMC for competitive Minecraft PvP, SMP, seasonal tiers, community events, and rank perks.", path: "/" },
  "/ranks": { title: "Minecraft Ranks & Perks | StrafeMC Store", description: "Compare StrafeMC Minecraft ranks, prices, and perks. Choose a rank for your competitive Minecraft experience.", path: "/ranks" },
  "/tiers": { title: "Minecraft PvP & SMP Tier Rankings | StrafeMC", description: "Explore StrafeMC seasonal solo and team tier rankings for SMP and PvP.", path: "/tiers" },
  "/faq": { title: "Frequently Asked Questions | StrafeMC", description: "Find answers about joining StrafeMC, Minecraft ranks, tiers, purchases, and support.", path: "/faq" },
  "/privacy": { title: "Privacy Policy | StrafeMC", description: "Read the StrafeMC privacy policy and learn how account and purchase information is handled.", path: "/privacy" },
  "/terms": { title: "Terms of Use | StrafeMC", description: "Review the terms that apply when using the StrafeMC website and Minecraft network.", path: "/terms" },
  "/buyer-agreement": { title: "Buyer Agreement | StrafeMC Store", description: "Review purchase and subscription terms for the StrafeMC store.", path: "/buyer-agreement" },
  "/admin": { title: "StrafeMC Admin Dashboard | Control Center", description: "Manage StrafeMC ranks, customers, subscriptions, payments, and reports.", path: "/admin" },
      "/admin/reports": { title: "Reports & Analytics | StrafeMC Admin", description: "View StrafeMC revenue, sales, subscriptions, and customer reports.", path: "/admin/reports" }
};

export default function Seo() {
  const location = useLocation();
  useEffect(() => {
    const page = config[location.pathname] || { title: "StrafeMC — Competitive Minecraft Server", description: "Play, compete, and climb with StrafeMC.", path: location.pathname };
    let active = true;
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4001/api";
    fetch(`${apiBase}/settings/application`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Settings unavailable")))
      .then((data: { settings?: { appName?: string } }) => {
        if (!active) return;
        const appName = data.settings?.appName?.trim();
        document.title = appName ? page.title.replace(/StrafeMC/g, appName) : page.title;
      })
      .catch(() => { if (active) document.title = page.title; });
    const setMeta = (selector: string, attribute: string, value: string) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
      if (!el) {
        el = document.createElement(selector.startsWith("link") ? "link" : "meta") as HTMLMetaElement | HTMLLinkElement;
        document.head.appendChild(el);
      }
      if (selector.startsWith("link")) (el as HTMLLinkElement).href = value;
      else (el as HTMLMetaElement).setAttribute(attribute, value);
    };
    setMeta('meta[name="description"]', "content", page.description);
    setMeta('link[rel="canonical"]', "href", `https://strafemc.net${page.path}`);
    setMeta('meta[property="og:title"]', "content", page.title);
    setMeta('meta[property="og:description"]', "content", page.description);
    setMeta('meta[property="og:url"]', "content", `https://strafemc.net${page.path}`);
    setMeta('meta[name="twitter:title"]', "content", page.title);
    setMeta('meta[name="twitter:description"]', "content", page.description);
    return () => { active = false; };
  }, [location.pathname]);
  return null;
}
