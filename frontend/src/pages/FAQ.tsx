import { useEffect, useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

type FAQItem = { question: string; answer: string; category?: string; sortOrder?: number };
const fallbackFAQs: FAQItem[] = [
  { category: "Getting Started", question: "How do I join StrafeMC?", answer: "Open Minecraft Java or Bedrock Edition and connect to play.strafemc.net. Use a compatible version supported by the server." },
  { category: "Getting Started", question: "What is the StrafeMC server IP?", answer: "The server address is play.strafemc.net. If you have trouble connecting, check your Minecraft version and try again." },
  { category: "Ranks & Store", question: "Where can I compare ranks and prices?", answer: "Visit the Ranks page to compare rank perks and prices before choosing an option." },
  { category: "Ranks & Store", question: "How do I receive a rank after purchasing?", answer: "Follow the checkout instructions and enter your Minecraft username carefully. If a purchase does not appear, contact support@strafemc.net with your order details." },
  { category: "Ranks & Store", question: "Are rank purchases refundable?", answer: "Refund eligibility depends on the StrafeMC Buyer Agreement and applicable law. Review the Buyer Agreement before purchasing or contact support if you have a question." },
  { category: "Tiers & Community", question: "Where can I view player tiers?", answer: "Visit the Tiers page to explore the available SMP and PvP leaderboards and queue categories." },
  { category: "Tiers & Community", question: "How do I contact the community?", answer: "Join the community through the Discord link in the website navigation." },
  { category: "Support", question: "I need help with a payment or purchase. What should I do?", answer: "Email support@strafemc.net and include your order reference, Minecraft username, and a short description of the issue. Never send your full card details." },
];

export default function FAQ() {
  const [items, setItems] = useState<FAQItem[]>(fallbackFAQs);
  const [activeCategory, setActiveCategory] = useState("All");
  useEffect(() => { api<{ faqs: FAQItem[] }>("/faq").then((result) => { if (result.faqs?.length) setItems(result.faqs); }).catch(() => {}); }, []);
  const categories = ["All", ...Array.from(new Set(items.map((item) => item.category || "General")))];
  const filtered = items.filter((item) => (activeCategory === "All" || (item.category || "General") === activeCategory) && true);
  return <main className="faq-page">
    <section className="faq-hero"><span className="eyebrow">STRAFEMC SUPPORT CENTER</span><h1>Frequently Asked <span>Questions</span></h1><p>Quick answers about joining the server, ranks, tiers, purchases, and getting support.</p>
    </section>
    <div className="faq-categories" aria-label="FAQ categories">{categories.map((category) => <button key={category} className={activeCategory === category ? "selected" : ""} onClick={() => setActiveCategory(category)}>{category}</button>)}</div>
    <section className="faq-results" aria-live="polite">{filtered.length ? filtered.map((item, index) => <details className="faq-card" key={`${item.question}-${index}`}><summary><span>{item.question}</span><ChevronDown size={18}/></summary><p>{item.answer}</p><small>{item.category || "General"}</small></details>) : <div className="faq-empty"><h2>No questions in this category</h2><p>Select another category to see more FAQs.</p></div>}</section>
    <section className="faq-contact"><div className="faq-contact-icon"><MessageCircle size={23}/></div><div><h2>Still need help?</h2><p>Our support team can help with account, server, or store questions.</p></div><a className="button" href="mailto:support@strafemc.net">Contact Support</a></section>
    <p className="faq-back"><Link to="/">← Back to home</Link></p>
  </main>;
}
