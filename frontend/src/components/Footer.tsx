import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
type PublicSettings = { appName?: string; appEmail?: string; contactNumber?: string; appLocation?: string; appCopyright?: string; footerText?: string; developedBy?: string };
export default function Footer() {
  const [settings, setSettings] = useState<PublicSettings>({ appName: "StrafeMC", appEmail: "support@strafemc.net", appCopyright: "© 2026 StrafeMC. All Rights Reserved.", developedBy: "StrafeMC" });
  useEffect(() => {
    let active = true;
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4001/api"}/settings/application`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Settings unavailable")))
      .then((data: { settings?: PublicSettings }) => { if (active && data.settings) setSettings((current) => ({ ...current, ...data.settings })); })
      .catch(() => { /* Keep safe defaults if the backend is offline. */ });
    return () => { active = false; };
  }, []);
  const email = settings.appEmail || "support@strafemc.net";
  return <footer className="footer">
    {settings.footerText && <p className="footer-description">{settings.footerText}</p>}
    <p className="text-center text-gray-500 text-xs">{settings.appCopyright || `© 2026 ${settings.appName || "StrafeMC"}. All Rights Reserved.`}</p>
    {settings.developedBy && <p>Developed by {settings.developedBy}</p>}
    <p>Not affiliated with Mojang AB or Microsoft.</p>
    <p><a href={`mailto:${email}`}>Contact: {email}</a>{settings.contactNumber ? <> · <a href={`tel:${settings.contactNumber}`}>{settings.contactNumber}</a></> : null}</p>
    {settings.appLocation && <p>{settings.appLocation}</p>}
    <div><Link to="/terms">Terms of Use</Link><Link to="/buyer-agreement">Buyer Agreement</Link><Link to="/privacy">Privacy Policy</Link><Link to="/faq">FAQ</Link></div>
  </footer>;
}
