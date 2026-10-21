type Props = { appCopyright?: string; appName?: string };

export default function AdminFooter({ appCopyright, appName }: Props) {
  const copyright = appCopyright?.trim() || `© 2026 ${appName?.trim() || "StrafeMC"}. All Rights Reserved.`;
  return (
    <footer className="sa-footer" role="contentinfo">
      <span>{copyright}</span>
      <span>Not affiliated with Mojang AB or Microsoft.</span>
    </footer>
  );
}
