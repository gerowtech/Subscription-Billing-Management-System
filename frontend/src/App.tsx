import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Ranks from "./pages/Ranks";
import Tiers from "./pages/Tiers";
import Privacy from "./pages/Privacy";
import Admin from "./pages/Admin";
import Legal from "./pages/Legal";
import Checkout from "./pages/Checkout";
import FAQ from "./pages/FAQ";
import Features from "./pages/Features";
import Seo from "./components/Seo";
import { RegisterPage, ForgotPasswordPage } from "./pages/AuthPages";

export default function App() {
  const location = useLocation();
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const isAdmin = path === "/admin" || path.startsWith("/admin/");
  const isAuthPage = ["/signup", "/register", "/password/reset", "/admin/signup", "/admin/password/reset"].includes(path);

  return <>
    <Seo />
    {!isAdmin && !isAuthPage && <Navbar />}
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<RegisterPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/password/reset" element={<ForgotPasswordPage />} />
      <Route path="/admin/signup" element={<RegisterPage />} />
      <Route path="/admin/password/reset" element={<ForgotPasswordPage />} />
      <Route path="/features" element={<Features />} />
      <Route path="/ranks" element={<Ranks />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/tiers" element={<Tiers />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/privacy" element={<Privacy />} />

      {/* Canonical admin routes. Legacy aliases intentionally remain removed. */}
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/plans" element={<Admin key={location.pathname} />} />
      <Route path="/admin/plans/*" element={<Admin key={location.pathname} />} />
      <Route path="/admin/subscriptions" element={<Admin />} />
      <Route path="/admin/subscriptions/*" element={<Admin />} />
      <Route path="/admin/features" element={<Admin />} />
      <Route path="/admin/orders" element={<Admin />} />
      <Route path="/admin/users" element={<Admin />} />
      <Route path="/admin/customers" element={<Admin />} />
      <Route path="/admin/reports" element={<Admin key={location.pathname} />} />
      <Route path="/admin/reports/*" element={<Admin key={location.pathname} />} />
      <Route path="/admin/profile" element={<Admin key={location.pathname} />} />
      <Route path="/admin/settings" element={<Admin />} />
      <Route path="/admin/settings/frontend-settings" element={<Admin />} />
      <Route path="/admin/settings/general-settings" element={<Admin />} />
      <Route path="/admin/settings/app-configuration" element={<Admin />} />
      <Route path="/admin/settings/currencies" element={<Admin />} />
      <Route path="/admin/settings/languages" element={<Admin />} />
      <Route path="/admin/settings/countries" element={<Admin key={location.pathname} />} />
      <Route path="/admin/settings/countries/*" element={<Admin key={location.pathname} />} />
      <Route path="/admin/settings/payment-gateway" element={<Admin />} />
      <Route path="/admin/settings/email-template" element={<Admin />} />
      <Route path="/admin/setting/frontend-setting/*" element={<Admin />} />
      <Route path="/admin/frontend-setting/*" element={<Admin />} />
      <Route path="/admin/frontend-settings" element={<Admin />} />
      <Route path="/admin/general-settings" element={<Admin />} />
      <Route path="/admin/app-configuration" element={<Admin />} />
      <Route path="/admin/payment-gateway" element={<Admin />} />
      <Route path="/admin/email-template" element={<Admin />} />
      {/* Canonical admin paths and nested admin pages. */}
      <Route path="/admin/*" element={<Admin />} />
      <Route path="/terms" element={<Legal title="Terms of Use" />} />
      <Route path="/buyer-agreement" element={<Legal title="Buyer Agreement" />} />
      <Route path="*" element={<main className="legal-page"><h1>Page not found</h1><a href="/">Back home</a></main>} />
    </Routes>
    {!isAdmin && !isAuthPage && <Footer />}
  </>;
}
