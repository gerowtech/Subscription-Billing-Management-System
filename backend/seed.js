/**
 * StrafeMC consolidated demo seeder (all collections, payment methods, rank prices, and rank feature matrix)
 * Database: strafemc
 *
 * SAFE DEMO SEED: replaces only documents previously written by this seeder.
 * Existing application/user data is preserved; the database is never dropped.
 * The administrator is seeded into users with a bcrypt passwordHash matching authController.js.
 *
 * Run:
 *   Set MONGODB_URI, ADMIN_EMAIL, and ADMIN_PASSWORD in backend/.env
 *   npm run seed --workspace backend
 */
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
// Prefer backend/.env when present; otherwise use the project-root .env.
const backendEnv = path.resolve(__dirname, ".env");
const rootEnv = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: fs.existsSync(backendEnv) ? backendEnv : rootEnv });
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "admin@strafemc.net").trim().toLowerCase();
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "admin@123");
const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/strafemc";
const DB_NAME = process.env.MONGODB_DB || "strafemc";
const SEED_TAG = "strafemc-demo-v2";
const now = new Date();
const future = (days) => new Date(Date.now() + days * 86400000);
const past = (days) => new Date(Date.now() - days * 86400000);
const oid = () => new ObjectId();

const users = [
  { _id: oid(), username: "indra_pvp", email: "indra.demo@example.com", minecraftUsername: "IndraPvp", status: "active", role: "player", isActive: true, emailVerified: true },
  { _id: oid(), username: "ender_knight", email: "ender.demo@example.com", minecraftUsername: "EnderKnight", status: "active", role: "player", isActive: true, emailVerified: true },
  { _id: oid(), username: "pixel_wizard", email: "pixel.demo@example.com", minecraftUsername: "PixelWizard", status: "active", role: "player", isActive: true, emailVerified: true },
  { _id: oid(), username: "block_rider", email: "block.demo@example.com", minecraftUsername: "BlockRider", status: "pending", role: "player", isActive: true, emailVerified: false },
  { _id: oid(), username: "strafe_admin", email: ADMIN_EMAIL, minecraftUsername: "StrafeAdmin", status: "active", role: "admin", isActive: true, emailVerified: true },
].map((x) => ({ ...x, createdAt: now, updatedAt: now }));

const packages = [
  { _id: oid(), code: "STRIDE", name: "Stride", price: 2.99, monthlyPrice: 2.99, yearlyPrice: 35.88, currency: "USD", billingInterval: "month", description: "Stride rank", active: true, isActive: true },
  { _id: oid(), code: "STRAFE", name: "Strafe", price: 6.99, monthlyPrice: 6.99, yearlyPrice: 83.88, currency: "USD", billingInterval: "month", description: "Strafe rank", active: true, isActive: true },
  { _id: oid(), code: "STRAFE_PLUS", name: "Strafe+", price: 9.99, monthlyPrice: 9.99, yearlyPrice: 119.88, currency: "USD", billingInterval: "month", description: "Monthly premium rank", active: true, isActive: true },
  { _id: oid(), code: "SUPREME", name: "Supreme", price: 12.99, monthlyPrice: 12.99, yearlyPrice: 155.88, currency: "USD", billingInterval: "month", description: "Monthly elite rank", active: true, isActive: true },
  { _id: oid(), code: "STARTER", name: "Starter", price: 0, monthlyPrice: 0, yearlyPrice: 0, currency: "USD", billingInterval: "month", description: "Free starter package", active: true, isActive: true },
].map((x, i) => ({ ...x, sortOrder: i + 1, createdAt: now, updatedAt: now }));

const plans = packages.slice(0, -1).map((p, i) => ({ ...p, category: "rank", features: [p.description], sortOrder: i + 1, isActive: p.isActive !== false })); // Last package (Starter) is excluded from the plans collection.

const customers = users.filter((u) => u.role !== "admin").map((u, i) => ({
  _id: oid(), user: u._id, firstName: ["Indra", "Ender", "Pixel", "Block"][i], lastName: "Demo",
  displayName: u.username, email: u.email, minecraftUsername: u.minecraftUsername,
  country: ["Pakistan", "United Arab Emirates", "United Kingdom", "Germany"][i],
  city: ["Lahore", "Dubai", "London", "Berlin"][i], source: "store",
  status: "active", marketingConsent: false, createdAt: now, updatedAt: now,
}));

const orders = users.map((u, i) => ({
  _id: oid(), orderNumber: `STR-NEW-${21001 + i}`, userId: u._id, planId: plans[i % plans.length]._id,
  currency: "USD", subtotal: plans[i % plans.length].price, discount: i === 1 ? 1 : 0, tax: 0,
  total: Math.max(0, plans[i % plans.length].price - (i === 1 ? 1 : 0)),
  status: ["paid", "paid", "pending", "failed", "paid"][i],
  paymentStatus: ["paid", "paid", "pending", "failed", "paid"][i],
  createdAt: now, updatedAt: now,
}));

const invoices = orders.map((o, i) => ({
  _id: oid(), invoiceNumber: `INV-NEW-${31001 + i}`, orderId: o._id, userId: o.userId,
  currency: "USD", amount: o.total, status: ["paid", "paid", "open", "void", "paid"][i],
  issuedAt: now, dueAt: future(7), paidAt: ["paid"].includes(["paid", "paid", "pending", "failed", "paid"][i]) ? now : null,
  createdAt: now, updatedAt: now,
}));

const payments = orders.map((o, i) => ({
  _id: oid(), orderId: o._id, userId: o.userId, user: o.userId, plan: plans[i % plans.length]._id,
  provider: ["stripe", "paypal", "stripe", "manual", "stripe"][i],
  providerPaymentId: `demo_new_payment_${i + 1}`, amount: o.total, currency: "USD",
  status: ["succeeded", "succeeded", "pending", "failed", "succeeded"][i],
  paidAt: [0, 1, 4].includes(i) ? now : null, createdAt: now, updatedAt: now,
}));

const paymentMethodSpecs = [
  // Core international payment methods.
  ["paypal", "PayPal", "wallet"], ["stripe", "Stripe", "card"], ["razorpay", "Razorpay", "gateway"],
  ["instamojo", "Instamojo", "gateway"], ["mollie", "Mollie", "gateway"], ["paystack", "Paystack", "gateway"],
  ["sslcommerz", "SSLCommerz", "gateway"], ["flutterwave", "Flutterwave", "gateway"], ["mercadopago", "Mercado Pago", "gateway"],
  ["bank_transfer", "Bank Transfer", "offline"], ["cash_on_delivery", "Cash on Delivery", "offline"], ["coinbase", "Coinbase", "crypto"],
  ["iyzico", "Iyzico", "gateway"], ["bitpay", "BitPay", "crypto"], ["zitopay", "Zitopay", "gateway"],
  ["binance_pay", "Binance Pay", "crypto"], ["paytm", "Paytm", "wallet"], ["payhere", "PayHere", "gateway"],
  ["maxicash", "Maxicash", "gateway"], ["cinetpay", "CinetPay", "gateway"], ["voguepay", "VoguePay", "gateway"],
  ["toyyibpay", "ToyyibPay", "gateway"], ["paymob", "Paymob", "gateway"], ["authorize_net", "Authorize.Net", "card"],
  ["alipay", "Alipay", "wallet"],
  // Required Pakistan payment methods and local bank-transfer options.
  ["jazzcash", "JazzCash", "wallet"],
  ["easypaisa", "Easypaisa", "wallet"],
  ["payfast", "PayFast", "gateway"],
  ["mcb_bank", "MCB Bank", "offline"],
  ["hbl_bank", "HBL Bank", "offline"],
  ["ubl_bank", "UBL Bank", "offline"],
  ["rapid_gateway", "Rapid Gateway", "gateway"]
];
const requiredPaymentProviders = [
  "jazzcash", "easypaisa", "payfast", "mcb_bank", "hbl_bank", "ubl_bank", "rapid_gateway"
];
const configuredPaymentProviders = new Set(paymentMethodSpecs.map(([provider]) => provider));
const missingRequiredProviders = requiredPaymentProviders.filter((provider) => !configuredPaymentProviders.has(provider));
if (missingRequiredProviders.length) {
  throw new Error(`Required payment methods missing from payment_methods seed: ${missingRequiredProviders.join(", ")}`);
}

if (paymentMethodSpecs.length !== 32 || new Set(paymentMethodSpecs.map(([provider]) => provider)).size !== 32) {
  throw new Error(`Expected 32 unique payment methods, found ${paymentMethodSpecs.length}.`);
}
console.log(`Configured ${paymentMethodSpecs.length} payment methods for seeding.`);

const payment_methods = paymentMethodSpecs.map(([provider, label, type], i) => ({
  _id: oid(), provider, code: provider, slug: provider, label, title: label, name: label,
  type, category: type, image: `/images/payment-gateways/${provider}.png`,
  enabled: true, isEnabled: true, status: "active", mode: "Sandbox", environment: "sandbox",
  sortOrder: i + 1, configuration: {}, credentials: {},
  createdAt: now, updatedAt: now
}));

const coupons = [
  { code: "FRESH10", value: 10, discountType: "percent", usageLimit: 100, active: true },
  { code: "NEW5USD", value: 5, discountType: "fixed", usageLimit: 50, active: true },
  { code: "PLUS15", value: 15, discountType: "percent", usageLimit: 30, active: true },
  { code: "DEMOEXPIRED", value: 20, discountType: "percent", usageLimit: 10, active: false },
  { code: "VIPNEW25", value: 25, discountType: "percent", usageLimit: 5, active: true },
].map((x, i) => ({ _id: oid(), ...x, currency: "USD", usageCount: i, startsAt: past(1), expiresAt: future(i === 3 ? -1 : 90), createdAt: now, updatedAt: now }));

const subscriptions = users.map((u, i) => ({
  _id: oid(), userId: u._id, user: u._id, plan: plans[i % plans.length]._id, startsAt: now, currentPeriodStart: now, currentPeriodEnd: future(30), orderId: orders[i]._id,
  providerSubscriptionId: `demo_new_subscription_${i + 1}`,
  status: ["active", "active", "trialing", "past_due", "canceled"][i],
  cancelAtPeriodEnd: i === 4, createdAt: now, updatedAt: now,
}));

const transactions = payments.map((p, i) => ({
  _id: oid(), userId: p.userId, orderId: p.orderId, paymentId: p._id,
  type: i === 3 ? "payment_failed" : "payment", amount: p.amount, currency: p.currency,
  status: p.status, reference: `TXN-NEW-${41001 + i}`, description: `Fresh demo transaction ${i + 1}`,
  createdAt: now,
}));

const refunds = orders.map((o, i) => ({
  _id: oid(), orderId: o._id, paymentId: payments[i]._id, userId: o.userId,
  amount: i === 1 ? 1 : 0, currency: "USD",
  reason: ["customer_request", "partial_adjustment", "duplicate", "service_issue", "other"][i],
  status: ["none", "succeeded", "requested", "rejected", "none"][i],
  providerRefundId: i === 1 ? "demo_new_refund_2" : null, createdAt: now, updatedAt: now,
}));

const tax_rates = [
  { code: "US-CA", country: "United States", region: "California", rate: 7.25 },
  { code: "GB", country: "United Kingdom", region: null, rate: 20 },
  { code: "PK-PB", country: "Pakistan", region: "Punjab", rate: 0 },
  { code: "DE", country: "Germany", region: null, rate: 19 },
  { code: "AE", country: "United Arab Emirates", region: null, rate: 5 },
].map((x) => ({ _id: oid(), ...x, type: "percentage", inclusive: false, active: true, createdAt: now, updatedAt: now }));

const billing_addresses = users.map((u, i) => ({
  _id: oid(), userId: u._id,
  name: ["Indra Demo", "Ender Demo", "Pixel Demo", "Block Demo", "Admin Demo"][i],
  line1: `${200 + i} Example Road`, line2: null,
  city: ["Lahore", "Dubai", "London", "Berlin", "New York"][i],
  state: ["Punjab", null, null, null, "NY"][i],
  postalCode: ["54000", "00000", "SW1A 1AA", "10115", "10001"][i],
  country: ["PK", "AE", "GB", "DE", "US"][i], isDefault: true, createdAt: now, updatedAt: now,
}));

const notifications = users.map((u, i) => ({
  _id: oid(), userId: u._id,
  type: ["order_paid", "rank_assigned", "payment_pending", "payment_failed", "welcome"][i],
  title: ["Payment received", "Rank activated", "Payment processing", "Payment failed", "Welcome to StrafeMC"][i],
  message: `Fresh demo notification ${i + 1}.`, read: i < 2, readAt: i < 2 ? now : null, createdAt: now,
}));

const activity_logs = users.map((u, i) => ({
  _id: oid(), actorUserId: u._id,
  action: ["user.login", "order.created", "rank.assigned", "payment.failed", "settings.updated"][i],
  entityType: ["user", "order", "subscription", "payment", "setting"][i],
  entityId: [u._id, orders[i]._id, subscriptions[i]._id, payments[i]._id, null][i],
  ipAddress: `192.0.2.${30 + i}`, userAgent: "StrafeMC fresh demo seed",
  metadata: { demo: true, seedVersion: 2, sequence: i + 1 }, createdAt: now,
}));

const settings = [
  { key: "site.name", value: "StrafeMC", valueType: "string", group: "site", isPublic: true },
  { key: "billing.currency", value: "USD", valueType: "string", group: "billing", isPublic: true },
  { key: "billing.tax_enabled", value: false, valueType: "boolean", group: "billing", isPublic: false },
  { key: "billing.invoice_prefix", value: "INV-NEW-", valueType: "string", group: "billing", isPublic: false },
  { key: "checkout.allow_guest", value: true, valueType: "boolean", group: "checkout", isPublic: true },
  { key: "application.general", value: { appName: "StrafeMC", appEmail: "admin@strafemc.net", contactNumber: "12345678", appLocation: "123 Main St, New York, NY 10001", appCopyright: "© 2026 StrafeMC. All Rights Reserved.", footerText: "Our subscription and billing management software helps streamline business operations.", developedBy: "StrafeMC", timezone: "UTC" }, valueType: "object", group: "application", isPublic: true },
].map((x) => ({ _id: oid(), ...x, description: `Fresh demo setting: ${x.key}`, createdAt: now, updatedAt: now }));

const roles = [
  { name: "super_admin", displayName: "Super Administrator", description: "Full system access" },
  { name: "admin", displayName: "Administrator", description: "Manage site and orders" },
  { name: "billing_manager", displayName: "Billing Manager", description: "Manage billing and refunds" },
  { name: "support", displayName: "Support Agent", description: "View users and assist customers" },
  { name: "customer", displayName: "Customer", description: "Purchase and manage own ranks" },
].map((x) => ({ _id: oid(), ...x, isSystem: true, active: true, createdAt: now, updatedAt: now }));

const permissions = [
  { code: "users.read", name: "Read users", group: "users" },
  { code: "users.manage", name: "Manage users", group: "users" },
  { code: "orders.read", name: "Read orders", group: "orders" },
  { code: "orders.refund", name: "Issue refunds", group: "billing" },
  { code: "settings.manage", name: "Manage settings", group: "settings" },
].map((x, i) => ({ _id: oid(), ...x, description: `Permission: ${x.name}`, roles: i === 0 ? [roles[0]._id, roles[1]._id, roles[3]._id] : [roles[0]._id], createdAt: now, updatedAt: now }));

const webhooks = [
  { provider: "stripe", eventType: "payment.succeeded", status: "succeeded" },
  { provider: "stripe", eventType: "payment.failed", status: "succeeded" },
  { provider: "stripe", eventType: "checkout.session.completed", status: "pending" },
  { provider: "paypal", eventType: "PAYMENT.CAPTURE.COMPLETED", status: "succeeded" },
  { provider: "stripe", eventType: "payment.refunded", status: "failed" },
].map((x, i) => ({ _id: oid(), ...x, eventId: `evt_new_demo_${i + 1}`, attemptCount: x.status === "failed" ? 3 : 1, payload: { demo: true, eventType: x.eventType }, receivedAt: now, processedAt: x.status === "succeeded" ? now : null, lastError: x.status === "failed" ? "Synthetic demo failure; no live webhook was sent." : null }));

const featureMatrix = [
  ["overworld_rtp_radius", "Overworld RTP Radius", ["2,000 blocks", "3,000 blocks", "4,000 blocks", "5,000 blocks"]],
  ["nether_rtp_radius", "Nether RTP Radius", ["1,000 blocks", "1,500 blocks", "2,000 blocks", "2,500 blocks"]],
  ["rank_kit", "Rank Kit", ["Stride Kit", "Strafe Kit", "Strafe+ Kit", "Supreme Kit"]],
  ["portable_crafting", "Portable Crafting", [true, true, true, true]],
  ["portable_anvil", "Portable Anvil", [true, true, true, true]],
  ["diag_command", "Diagonal Command", [true, true, true, true]],
  ["hat_command", "Hat Command", [true, true, true, true]],
  ["portable_ender_chest", "Portable Ender Chest", [false, true, true, true]],
  ["portable_smithing_table", "Portable Smithing Table", [false, false, true, true]],
  ["condense_items", "Condense Items", [false, false, true, true]],
  ["personal_time", "Personal Time", [false, false, false, true]],
  ["personal_weather", "Personal Weather", [false, false, false, true]],
  ["afk_command", "AFK Command", [false, false, false, true]],
  ["colored_username", "Colored Username", [true, true, true, true]],
  ["rank_prefix", "Rank Prefix", ["STRIDE", "STRAFE", "STRAFE+", "SUPREME"]],
  ["rank_theme", "Rank Theme", ["Mint Green", "Electric Cyan", "Champagne Gold", "Dark Crimson"]],
  ["extra_homes", "Extra homes", [2, 4, 6, 8]],
  ["player_vaults", "Player vaults", [false, true, true, true]],
  ["daily_kit", "Daily kit", ["Stride Kit", "Strafe Kit", "Strafe+ Kit", "Supreme Kit"]],
  ["utility_commands", "Utility commands", [false, true, true, true]],
  ["flight", "Flight", [false, false, true, true]],
  ["colored_chat", "Colored chat", [false, true, true, true]],
  ["join_message", "Join message", [false, true, true, true]],
  ["chat_prefix", "Chat prefix", ["[STRIDE]", "[STRAFE]", "[STRAFE+]", "[SUPREME]"]]
];
const rankPlans = plans.filter((plan) => ["STRIDE", "STRAFE", "STRAFE_PLUS", "SUPREME"].includes(plan.code));
const plans_features = rankPlans.flatMap((plan, i) => featureMatrix.map(([featureKey, featureName, values]) => {
  const value = values[i];
  return {
    _id: oid(), planCode: plan.code, planId: plan._id, featureKey, featureName, value,
    valueType: typeof value === "boolean" ? "boolean" : typeof value === "number" ? "number" : "string",
    enabled: value !== false && value !== "—", createdAt: now, updatedAt: now
  };
}));

const faqs = [
  { category: "Subscription & Billing", question: "What is subscription and billing management software?", answer: "Subscription and billing management software is a tool designed to help businesses manage their subscription-based services, recurring billing, and payment processes. It automates tasks such as billing, invoicing, payment processing, and customer management.", sortOrder: 1, active: true, isActive: true },
  { category: "Subscription & Billing", question: "Why do I need subscription and billing management software?", answer: "Subscription and billing management software streamlines your subscription business operations, reducing manual tasks and errors. It helps you manage subscriptions, collect payments, and provide a better customer experience.", sortOrder: 2, active: true, isActive: true },
  { category: "Features", question: "What features should I look for in subscription and billing management software?", answer: "Key features to consider include subscription creation and management, automated billing, invoicing, payment processing, dunning management (handling failed payments), revenue recognition, and reporting/analytics.", sortOrder: 3, active: true, isActive: true },
  { category: "Integrations", question: "Can I integrate this software with my existing tools and systems?", answer: "Many subscription and billing management software solutions offer integrations with popular platforms, like CRM systems, accounting software, and payment gateways. Check for compatibility with your current software stack.", sortOrder: 4, active: true, isActive: true },
  { category: "Customization", question: "Can I customize the billing and invoicing process?", answer: "Most subscription management software allows for customization of billing and invoicing templates, enabling you to add your branding and tailor them to your company's needs.", sortOrder: 5, active: true, isActive: true },
  { category: "Payments", question: "How does the software handle recurring billing and payment processing?", answer: "The software automates recurring billing by setting up billing cycles and collecting payments from customers through various payment methods, such as credit cards, ACH, or digital wallets.", sortOrder: 6, active: true, isActive: true },
].map((faq) => ({ _id: oid(), ...faq, createdAt: now, updatedAt: now }));

const frontend_sections = [
  {
    _id: oid(), sectionName: "Hero Banner",
    title: "Business Potential with Subscription & Billing management Laravel Script.",
    description: "Introduce StrafeMC and highlight the main value proposition.",
    image: "/images/sections/hero-banner.svg", sortOrder: 1, isActive: true,
  },
  {
    _id: oid(), sectionName: "Core Features",
    title: "Feature fusion: your all-in-one solution.",
    description: "Present the core features available to customers.",
    image: "/images/sections/core-features.svg", sortOrder: 2, isActive: true,
  },
  {
    _id: oid(), sectionName: "Best Features",
    title: "Features that you will get after getting started.",
    description: "Highlight the most useful platform features.",
    image: "/images/sections/best-features.svg", sortOrder: 3, isActive: true,
  },
  {
    _id: oid(), sectionName: "Pricing Plan",
    title: "Pick the plan that's right for your business.",
    description: "Show subscription tiers and pricing options.",
    image: "/images/sections/pricing-plan.svg", sortOrder: 4, isActive: true,
  },
  {
    _id: oid(), sectionName: "Product Services",
    title: "Collect Payments for Your Products and Services.",
    description: "Describe the products and services offered through the platform.",
    image: "/images/sections/product-services.svg", sortOrder: 5, isActive: true,
  },
  {
    _id: oid(), sectionName: "Integrations Menu",
    title: "Make seamless integration with some of the best apps.",
    description: "Show supported apps and third-party integrations.",
    image: "/images/sections/integrations-menu.svg", sortOrder: 6, isActive: true,
  },
  {
    _id: oid(), sectionName: "Testimonials Area",
    title: "What our clients have saying about us.",
    description: "Display customer feedback and testimonials.",
    image: "/images/sections/testimonials-area.svg", sortOrder: 7, isActive: true,
  },
  {
    _id: oid(), sectionName: "Faq's Area",
    title: "Most common question about SaaS services.",
    description: "Answer frequently asked questions about the service.",
    image: "/images/sections/faqs-area.svg", sortOrder: 8, isActive: true,
  },
].map((section) => ({ ...section, createdAt: now, updatedAt: now }));

const frontend_features = [
  {
    _id: oid(), image: "/images/features/billing-solution.svg", icon: "CreditCard",
    title: "One-Time and Recurring Billing Solution.",
    description: "Configure one-time payments and recurring subscription billing.",
    sortOrder: 1, isActive: true,
  },
  {
    _id: oid(), image: "/images/features/product-management.svg", icon: "Plan",
    title: "Dynamic product, management, plan and license.",
    description: "Manage products, plans, subscriptions, and licenses in one place.",
    sortOrder: 2, isActive: true,
  },
  {
    _id: oid(), image: "/images/features/payment-gateway.svg", icon: "WalletCards",
    title: "Dynamic payment gateway integration.",
    description: "Connect payment providers to support flexible checkout options.",
    sortOrder: 3, isActive: true,
  },
  {
    _id: oid(), image: "/images/features/custom-checkout.svg", icon: "PanelsTopLeft",
    title: "Customisable Checkout",
    description: "Offer a clear checkout experience for customers.",
    sortOrder: 4, isActive: true,
  },
  {
    _id: oid(), image: "/images/features/custom-invoicing.svg", icon: "ReceiptText",
    title: "Customisable Invoicing",
    description: "Create and manage invoices for your customers and subscriptions.",
    sortOrder: 5, isActive: true,
  },
].map((feature) => ({ ...feature, createdAt: now, updatedAt: now }));

const best_features = [
  {
    _id: oid(), name: "Webhook events", title: "Webhook events",
    description: "Receive real-time event notifications and connect external services.",
    image: "/images/best-features/webhook-events.svg", sortOrder: 1, isActive: true,
  },
  {
    _id: oid(), name: "Reporting & Analytics", title: "Reporting & Analytics",
    description: "Review subscription, revenue, and customer performance from one dashboard.",
    image: "/images/best-features/reporting-analytics.svg", sortOrder: 2, isActive: true,
  },
  {
    _id: oid(), name: "Customer Management:", title: "Customer Management:",
    description: "Keep customer profiles and subscription information organized.",
    image: "/images/best-features/customer-management.svg", sortOrder: 3, isActive: true,
  },
  {
    _id: oid(), name: "Notifications & Alerts", title: "Notifications & Alerts",
    description: "Notify your team about important billing and account events.",
    image: "/images/best-features/notifications-alerts.svg", sortOrder: 4, isActive: true,
  },
  {
    _id: oid(), name: "Subscription Management", title: "Subscription Management",
    description: "Manage subscription lifecycles, renewals, and plan changes.",
    image: "/images/best-features/subscription-management.svg", sortOrder: 5, isActive: true,
  },
].map((feature) => ({ ...feature, createdAt: now, updatedAt: now }));

const testimonials = [
  {
    _id: oid(), name: "John Smith", image: "/images/testimonials/john-smith.svg",
    designation: "Tech Solutions Inc.",
    description: "StrafeMC made it much easier for our team to manage subscriptions and recurring billing. The workflow is clear and saves us time.",
    sortOrder: 1, isActive: true,
  },
  {
    _id: oid(), name: "Sarah Johnson", image: "/images/testimonials/sarah-johnson.svg",
    designation: "E-Commerce Innovations",
    description: "The platform brings our billing and customer subscription processes together. Setup was straightforward and the admin tools are easy to use.",
    sortOrder: 2, isActive: true,
  },
  {
    _id: oid(), name: "Alex Rodriguez", image: "/images/testimonials/alex-rodriguez.svg",
    designation: "Innovative SaaS Solutions",
    description: "Reliable subscription management and useful reporting in one place. It has helped us keep our recurring payments organized.",
    sortOrder: 3, isActive: true,
  },
].map((testimonial) => ({ ...testimonial, createdAt: now, updatedAt: now }));

// Language records for System > Languages. English is the default language.
const languages = [
  { name: "English", code: "en", locale: "en-US", nativeName: "English", direction: "ltr", status: "enabled", enabled: true, isDefault: true },
  { name: "Urdu", code: "ur", locale: "ur-PK", nativeName: "اردو", direction: "rtl", status: "enabled", enabled: true, isDefault: false },
  { name: "Arabic", code: "ar", locale: "ar-SA", nativeName: "العربية", direction: "rtl", status: "enabled", enabled: true, isDefault: false },
  { name: "Spanish", code: "es", locale: "es-ES", nativeName: "Español", direction: "ltr", status: "disabled", enabled: false, isDefault: false },
  { name: "French", code: "fr", locale: "fr-FR", nativeName: "Français", direction: "ltr", status: "disabled", enabled: false, isDefault: false },
  { name: "German", code: "de", locale: "de-DE", nativeName: "Deutsch", direction: "ltr", status: "disabled", enabled: false, isDefault: false },
  { name: "Chinese (Simplified)", code: "zh-CN", locale: "zh-CN", nativeName: "简体中文", direction: "ltr", status: "disabled", enabled: false, isDefault: false },
  { name: "Portuguese", code: "pt", locale: "pt-PT", nativeName: "Português", direction: "ltr", status: "disabled", enabled: false, isDefault: false },
].map((language, index) => ({
  _id: oid(), ...language, isActive: language.enabled, sortOrder: index + 1, createdAt: now, updatedAt: now,
}));

// Currency records for System > Currencies. USD is the default currency.
const currencies = [
  { title: "Australian Dollar", code: "AUD", symbol: "A$", value: 1.37243543, status: "disabled", enabled: false, isDefault: false, lastUpdated: new Date("2024-07-22T00:00:00.000Z") },
  { title: "Chinese Yuan Renminbi", code: "CNY", symbol: "¥", value: 6.67540249, status: "disabled", enabled: false, isDefault: false, lastUpdated: new Date("2024-07-22T00:00:00.000Z") },
  { title: "Euro", code: "EUR", symbol: "€", value: 0.85513939, status: "enabled", enabled: true, isDefault: false, lastUpdated: now },
  { title: "Hong Kong Dollar", code: "HKD", symbol: "HK$", value: 7.17155696, status: "disabled", enabled: false, isDefault: false, lastUpdated: new Date("2024-07-22T00:00:00.000Z") },
  { title: "Indian Rupee", code: "INR", symbol: "₹", value: 76.83226792, status: "disabled", enabled: false, isDefault: false, lastUpdated: new Date("2024-07-22T00:00:00.000Z") },
  { title: "Pound Sterling", code: "GBP", symbol: "£", value: 0.74033692, status: "enabled", enabled: true, isDefault: false, lastUpdated: now },
  { title: "Russian Ruble", code: "RUB", symbol: "₽", value: 56.40360000, status: "disabled", enabled: false, isDefault: false, lastUpdated: new Date("2018-02-16T00:00:00.000Z") },
  { title: "US Dollar", code: "USD", symbol: "$", value: 1, status: "enabled", enabled: true, isDefault: true, lastUpdated: now },
].map((currency, index) => ({
  _id: oid(), ...currency, name: currency.title, isActive: currency.enabled,
  sortOrder: index + 1, createdAt: now, updatedAt: now,
}));

const collections = {
  users, plans, orders, invoices, payments, payment_methods, currencies, languages,
  customers, coupons, subscriptions, transactions, refunds, tax_rates, billing_addresses,
  notifications, activity_logs, settings, roles, permissions, webhooks, plans_features, faqs,
  frontend_sections, frontend_features, best_features, testimonials,
};

async function seedPaymentMethodsOnly() {
  const client = new MongoClient(URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection("payment_methods");
    let inserted = 0;
    let updated = 0;
    for (const [provider, label, type] of paymentMethodSpecs) {
      const index = paymentMethodSpecs.findIndex(([id]) => id === provider);
      const timestamp = new Date();
      const fields = {
        provider,
        code: provider,
        slug: provider,
        label,
        title: label,
        name: label,
        type,
        category: type,
        image: `/images/payment-gateways/${provider}.png`,
        enabled: true,
        isEnabled: true,
        status: "active",
        mode: "Sandbox",
        environment: "sandbox",
        sortOrder: index + 1,
        configuration: {},
        credentials: {},
        updatedAt: timestamp,
      };
      const result = await collection.updateOne(
        { provider },
        { $set: fields, $setOnInsert: { _id: oid(), createdAt: timestamp } },
        { upsert: true }
      );
      if (result.upsertedCount) inserted++;
      else if (result.matchedCount) updated++;
    }
    await collection.createIndex({ provider: 1 }, { unique: true });
    const total = await collection.countDocuments({ provider: { $in: paymentMethodSpecs.map(([id]) => id) } });
    console.log(`Payment methods seed complete in database "${DB_NAME}".`);
    console.log(`Expected: ${paymentMethodSpecs.length}; inserted: ${inserted}; updated: ${updated}; total matching provider IDs: ${total}.`);
  } catch (err) {
    console.error("Payment methods seeding failed:", err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

async function main() {
  const client = new MongoClient(URI);
  try {
    await client.connect();
    // MongoDB creates the database when its first collection/data is written.
    // Keep the intended database name explicit and report it before seeding.
    if (DB_NAME !== "strafemc") {
      console.warn(`Notice: MONGODB_DB is set to "${DB_NAME}" instead of "strafemc".`);
    }
    const db = client.db(DB_NAME);

    // The login controller authenticates admins using bcrypt passwordHash.
    const adminUser = users.find((user) => user.role === "admin");
    adminUser.passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    adminUser.isActive = true;

    console.log(`Target MongoDB database: ${DB_NAME}`);
    console.log(`Admin account to seed: ${ADMIN_EMAIL}`);
    console.log("Safe seed mode: removing only prior demo documents tagged by this seeder.");
    console.log(`\nPreparing ${Object.keys(collections).length} collections and inserting demo records...`);
    for (const name of Object.keys(collections)) {
      if (!(await db.listCollections({ name }, { nameOnly: true }).hasNext())) {
        await db.createCollection(name);
        console.log(`${name}: collection created`);
      }
      await db.collection(name).deleteMany({ seedTag: SEED_TAG });
    }

    let total = 0;
    for (const [name, docs] of Object.entries(collections)) {
      await db.collection(name).insertMany(docs.map((doc) => ({ ...doc, seedTag: SEED_TAG })));
      console.log(`${name}: inserted ${docs.length} fresh demo documents`);
      total += docs.length;
    }

    await Promise.all([
      db.collection("users").createIndex({ email: 1 }, { unique: true }),
      db.collection("customers").createIndex({ email: 1 }, { unique: true }),
      db.collection("plans").createIndex({ code: 1 }, { unique: true }),
      db.collection("orders").createIndex({ orderNumber: 1 }, { unique: true }),
      db.collection("invoices").createIndex({ invoiceNumber: 1 }, { unique: true }),
      db.collection("coupons").createIndex({ code: 1 }, { unique: true }),
      db.collection("settings").createIndex({ key: 1 }, { unique: true }),
      db.collection("payment_methods").createIndex({ provider: 1 }, { unique: true }),
      db.collection("currencies").createIndex({ code: 1 }, { unique: true }),
      db.collection("languages").createIndex({ code: 1 }, { unique: true }),
      db.collection("faqs").createIndex({ question: 1 }, { unique: true }),
      db.collection("frontend_sections").createIndex({ sectionName: 1 }, { unique: true }),
      db.collection("frontend_sections").createIndex({ sortOrder: 1 }),
      db.collection("frontend_features").createIndex({ title: 1 }, { unique: true }),
      db.collection("frontend_features").createIndex({ sortOrder: 1 }),
      db.collection("best_features").createIndex({ name: 1 }, { unique: true }),
      db.collection("best_features").createIndex({ sortOrder: 1 }),
      db.collection("testimonials").createIndex({ sortOrder: 1 }),
      db.collection("permissions").createIndex({ code: 1 }, { unique: true }),
      db.collection("subscriptions").createIndex({ user: 1, status: 1 }),
      db.collection("notifications").createIndex({ userId: 1, read: 1 }),
    ]);
    console.log(`\\nComplete: ${Object.keys(collections).length} collections, ${total} fresh demo documents.`);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

async function updateAdminOnly() {
  // Safe admin account maintenance: does not drop or reset any collection.
  const mongoose = require("mongoose");
  const User = require("./models/User");
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env.");
  }
  if (ADMIN_PASSWORD.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters long.");
  }
  await mongoose.connect(URI, { dbName: DB_NAME, serverSelectionTimeoutMS: 10000 });
  try {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const result = await User.updateOne(
      { email: ADMIN_EMAIL },
      {
        $set: { role: "admin", isActive: true, passwordHash },
        $setOnInsert: { email: ADMIN_EMAIL, username: "strafe_admin", minecraftUuid: null },
      },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    const user = await User.findOne({ email: ADMIN_EMAIL, role: "admin", isActive: true }).select("+passwordHash");
    if (!user || !user.passwordHash || !(await bcrypt.compare(ADMIN_PASSWORD, user.passwordHash))) {
      throw new Error("Admin record was written, but password verification failed. Check the User model and MongoDB collection.");
    }
    console.log(`Connected database: ${mongoose.connection.name}`);
    console.log(`Admin user verified: ${ADMIN_EMAIL}`);
    console.log(`Matched: ${result.matchedCount}; modified: ${result.modifiedCount}; created: ${result.upsertedCount || 0}`);
    console.log("Password hash verified successfully. No collections were dropped.");
  } finally {
    await mongoose.disconnect();
  }
}

async function run() {
  try {
    if (process.argv.includes("--payment-methods-only")) {
      await seedPaymentMethodsOnly();
    } else if (process.argv.includes("--admin-only")) {
      await updateAdminOnly();
    } else {
      await main();
    }
  } catch (error) {
    console.error("Seed command failed:", error.message || error);
    process.exitCode = 1;
  }
}

run();
