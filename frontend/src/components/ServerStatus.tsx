import { useEffect, useState } from "react";
import { api } from "../services/api";
type Status = { online: boolean; players?: { online: number; max: number }; host?: string };
export default function ServerStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  useEffect(() => { api<Status>("/server/status").then(setStatus).catch(() => setStatus({ online: false })); }, []);
  return <p className="server-status"><span className={status?.online ? "dot online" : "dot"} />{status === null ? "Checking server…" : status.online ? `${status.players?.online ?? 0} online` : "Status unavailable"}</p>;
}
