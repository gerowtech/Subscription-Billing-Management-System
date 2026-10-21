import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, ChevronDown, Globe, LogOut, UserRound } from "lucide-react";
type Props = { email?: string; logout: () => void; profileMenuOpen: boolean; setProfileMenuOpen: (value: boolean | ((current: boolean) => boolean)) => void };
type PublicSettings = { appName?: string };

export default function AdminHeader({ logout, profileMenuOpen, setProfileMenuOpen }: Props) {
  const [appName, setAppName] = useState("StrafeMC");
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [setProfileMenuOpen]);

  useEffect(() => {
    let active = true;
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4001/api";
    fetch(`${apiBase}/settings/application`)
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load application settings");
        return response.json();
      })
      .then((data: { settings?: PublicSettings }) => {
        const name = data.settings?.appName?.trim();
        if (active && name) setAppName(name);
      })
      .catch(() => { /* Keep the default name if settings are unavailable. */ });
    return () => { active = false; };
  }, []);

  return <header className="sa-topbar !sticky !top-0 !z-30 !flex !h-16 !items-center !justify-between !border-b !border-slate-200 !bg-white !px-5 !shadow-sm max-[560px]:!px-3"><Link to="/admin" className="sa-topbar-brand" aria-label={`${appName} admin dashboard`} title={appName}><img className="sa-topbar-logo" src="/images/logo-drak.png" alt={`${appName} logo`} /></Link><div className="sa-topbar-right"><button className="sa-icon-button" aria-label="Notifications" type="button"><Bell size={18}/><i/></button><a href="/" target="_blank" rel="noreferrer" className="sa-icon-button" aria-label="Open website" title="Website"><Globe size={18}/></a><div className="sa-profile-menu-wrap" ref={profileMenuRef}><button className="sa-profile-trigger" type="button" aria-haspopup="menu" aria-expanded={profileMenuOpen} onClick={()=>setProfileMenuOpen(v=>!v)}><span className="sa-profile-avatar">A</span><span className="sa-profile-copy"><strong>Administrator</strong></span><ChevronDown size={15} className={profileMenuOpen?"sa-chevron-open":""}/></button>{profileMenuOpen&&<div className="sa-profile-dropdown" role="menu"><Link to="/admin/settings/general-settings" role="menuitem" className="sa-dropdown-item" onClick={()=>setProfileMenuOpen(false)}><UserRound size={15}/> Profile</Link><button type="button" role="menuitem" onClick={()=>{setProfileMenuOpen(false);logout();}} className="sa-dropdown-logout"><LogOut size={15}/> Logout</button></div>}</div><button type="button" className="sa-header-logout" onClick={logout}><LogOut size={15}/> <span>Logout</span></button></div></header>;
}
