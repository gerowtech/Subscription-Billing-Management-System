const API = import.meta.env.VITE_API_URL || "http://localhost:4001/api";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = localStorage.getItem("strafe_admin_token") || sessionStorage.getItem("strafe_admin_token");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API}${path}`, { ...init, headers });
  } catch {
    throw new Error("Cannot connect to the StrafeMC API. Make sure the backend is running on port 4001.");
  }

  const contentType = response.headers.get("content-type") || "";
  const data: any = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : { message: await response.text().catch(() => "") };

  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/login") {
      localStorage.removeItem("strafe_admin_token");
      window.dispatchEvent(new Event("strafe-auth-expired"));
    }
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data as T;
}
