const mongoose = require("mongoose");
const User = require("../models/User");
const Customer = require("../models/Customer");
const Plan = require("../models/Plan");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");

function dateRange(query) {
  const end = query.to ? new Date(query.to) : new Date();
  const start = query.from ? new Date(query.from) : new Date(end.getTime() - 29 * 86400000);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    const err = new Error("Invalid report date range"); err.status = 400; throw err;
  }
  start.setHours(0,0,0,0);
  end.setHours(23,59,59,999);
  if (start > end) { const err = new Error("The 'from' date must be before the 'to' date"); err.status = 400; throw err; }
  return { start, end };
}

function csvEscape(value) {
  const s = value == null ? "" : value instanceof Date ? value.toISOString() : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}
function sendCsv(res, filename, headers, rows) {
  const body = [headers, ...rows].map(row => row.map(csvEscape).join(",")).join("\r\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send("\uFEFF" + body);
}

exports.summary = async (req, res, next) => {
  try {
    const { start, end } = dateRange(req.query);
    const range = { createdAt: { $gte: start, $lte: end } };
    const [customers, users, plans, payments, subscriptions, sales, recentPayments, signupsByDay] = await Promise.all([
      Customer.countDocuments(range),
      User.countDocuments(range),
      Plan.countDocuments(),
      Payment.countDocuments(range),
      Subscription.countDocuments(range),
      Payment.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: "succeeded" } },
        { $group: { _id: null, grossRevenue: { $sum: "$amount" }, transactions: { $sum: 1 } } }
      ]),
      Payment.find(range).sort({ createdAt: -1 }).limit(8).populate("user", "username email").populate("plan", "name code").lean(),
      User.aggregate([
        { $match: range },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);
    const revenue = sales[0]?.grossRevenue || 0;
    const transactions = sales[0]?.transactions || 0;
    res.json({
      range: { from: start, to: end },
      metrics: { customers, users, plans, payments, subscriptions, grossRevenue: Number(revenue.toFixed(2)), successfulTransactions: transactions },
      recentPayments,
      signupsByDay
    });
  } catch (e) { next(e); }
};

exports.sales = async (req, res, next) => {
  try {
    const { start, end } = dateRange(req.query);
    const payments = await Payment.find({ createdAt: { $gte: start, $lte: end } })
      .sort({ createdAt: -1 }).populate("user", "username email").populate("plan", "name code").lean();
    const totals = payments.reduce((acc, p) => {
      acc.count += 1;
      acc[p.status] = (acc[p.status] || 0) + 1;
      if (p.status === "succeeded") acc.revenue += p.amount;
      return acc;
    }, { count: 0, pending: 0, succeeded: 0, failed: 0, refunded: 0, revenue: 0 });
    res.json({ range: { from: start, to: end }, totals: { ...totals, revenue: Number(totals.revenue.toFixed(2)) }, payments });
  } catch (e) { next(e); }
};

exports.subscriptions = async (req, res, next) => {
  try {
    const { start, end } = dateRange(req.query);
    const subscriptions = await Subscription.find({ createdAt: { $gte: start, $lte: end } })
      .sort({ createdAt: -1 }).populate("user", "username email").populate("plan", "name code price currency billingInterval").lean();
    const byStatus = await Subscription.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ range: { from: start, to: end }, totals: { count: subscriptions.length, byStatus }, subscriptions });
  } catch (e) { next(e); }
};

exports.customers = async (req, res, next) => {
  try {
    const { start, end } = dateRange(req.query);
    const customers = await Customer.find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).lean();
    const bySource = await Customer.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ range: { from: start, to: end }, totals: { count: customers.length, bySource }, customers });
  } catch (e) { next(e); }
};

exports.exportPayments = async (req, res, next) => {
  try {
    const { start, end } = dateRange(req.query);
    const payments = await Payment.find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 })
      .populate("user", "username email").populate("plan", "name code").lean();
    sendCsv(res, "strafemc-payments.csv",
      ["Payment ID", "Date", "Customer Email", "Minecraft Username", "Plan", "Amount", "Currency", "Status", "Provider", "Provider Reference"],
      payments.map(p => [p._id, p.createdAt, p.user?.email, p.user?.username, p.plan?.name, p.amount, p.currency, p.status, p.provider, p.providerPaymentId]));
  } catch (e) { next(e); }
};

exports.exportCustomers = async (req, res, next) => {
  try {
    const { start, end } = dateRange(req.query);
    const customers = await Customer.find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).lean();
    sendCsv(res, "strafemc-customers.csv",
      ["Customer ID", "Created At", "First Name", "Last Name", "Email", "Phone", "Minecraft Username", "Country", "City", "Source", "Marketing Consent", "Status"],
      customers.map(c => [c._id, c.createdAt, c.firstName, c.lastName, c.email, c.phone, c.minecraftUsername, c.country, c.city, c.source, c.marketingConsent, c.status]));
  } catch (e) { next(e); }
};
