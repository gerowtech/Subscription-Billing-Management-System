import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";

const logo = "/images/strafemc-logo.png";
export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", phone: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const update = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setMessage("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setBusy(true);
    try { await api<{message:string}>("/auth/register", { method:"POST", body:JSON.stringify({username:form.username.trim(),phone:form.phone.trim(),email:form.email.trim().toLowerCase(),password:form.password}) }); setMessage("Account created. You can now sign in."); setTimeout(()=>navigate("/admin"),900); }
    catch (e) { setError(e instanceof Error ? e.message : "Registration failed."); } finally { setBusy(false); }
  }
  return <main className="admin-login login-screen"><form className="login-card login-card-reference auth-page-card" onSubmit={submit}>
    <img className="admin-login-logo" src={logo} alt="StrafeMC"/><h1>Sign up</h1><p className="login-account-prompt">Already have an account? <Link to="/admin">Sign In</Link></p>
    <label>Name <span className="auth-required">*</span><input value={form.username} onChange={e=>update("username",e.target.value)} autoComplete="name" required placeholder="Name"/></label>
    <label>Phone<input value={form.phone} onChange={e=>update("phone",e.target.value)} autoComplete="tel" placeholder="Phone (optional)"/></label>
    <label>Email<input type="email" value={form.email} onChange={e=>update("email",e.target.value)} autoComplete="email" required placeholder="Email" autoCapitalize="none"/></label>
    <label>Password<input type="password" value={form.password} onChange={e=>update("password",e.target.value)} autoComplete="new-password" minLength={8} required placeholder="Create password"/></label>
    <label>Confirm Password<input type="password" value={form.confirmPassword} onChange={e=>update("confirmPassword",e.target.value)} autoComplete="new-password" minLength={8} required placeholder="Enter password again"/></label>
    {error&&<p className="error login-error">{error}</p>}{message&&<p className="auth-success">{message}</p>}
    <button className="button button-primary login-submit bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit" disabled={busy}>{busy?"Creating account…":"Sign Up"}</button>
  </form></main>;
}
export function ForgotPasswordPage() {
  const [email,setEmail]=useState(""); const [message,setMessage]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent){e.preventDefault();setError("");setMessage("");setBusy(true);try{const r=await api<{message:string}>("/auth/password-reset-request",{method:"POST",body:JSON.stringify({email:email.trim().toLowerCase()})});setMessage(r.message||"If the account exists, reset instructions will be sent when email delivery is configured.");}catch(e){setError(e instanceof Error?e.message:"Could not submit request.");}finally{setBusy(false)}}
  return <main className="admin-login login-screen"><form className="login-card login-card-reference auth-page-card auth-reset-card" onSubmit={submit}>
    <img className="admin-login-logo" src={logo} alt="StrafeMC"/><h1>Forgot Password?</h1><p className="login-account-prompt">Enter your email address and we’ll help you reset your password.</p>
    <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required placeholder="Your email"/></label>
    {error&&<p className="error login-error">{error}</p>}{message&&<p className="auth-success">{message}</p>}
    <button className="button button-primary login-submit bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit" disabled={busy}>{busy?"Sending…":"Send Reset Link"}</button><p className="login-account-prompt auth-back"><Link to="/admin">← Back to Sign In</Link></p>
  </form></main>;
}
