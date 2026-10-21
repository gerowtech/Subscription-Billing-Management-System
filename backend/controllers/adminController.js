const User=require("../models/User"),Plan=require("../models/Plan"),Subscription=require("../models/Subscription"),Payment=require("../models/Payment"),Customer=require("../models/Customer");
exports.overview=async(req,res,next)=>{try{
  const [users,customers,plans,subscriptions,payments,activeSubscriptions]=await Promise.all([
    User.countDocuments(),Customer.countDocuments(),Plan.countDocuments(),Subscription.countDocuments(),Payment.countDocuments(),
    Subscription.find({status:"active",currentPeriodEnd:{$gte:new Date()}}).populate("plan","price billingInterval currency").lean()
  ]);
  const monthlyRecurringRevenue=activeSubscriptions.reduce((sum,s)=>{
    const p=s.plan;if(!p)return sum;const price=Number(p.price)||0;
    return sum+(p.billingInterval==="year"?price/12:p.billingInterval==="month"?price:0);
  },0);
  res.json({users,customers,plans,subscriptions,payments,monthlyRecurringRevenue:Number(monthlyRecurringRevenue.toFixed(2)),activeSubscriptions:activeSubscriptions.length});
}catch(e){next(e)}};
exports.subscriptions=async(req,res,next)=>{try{res.json({subscriptions:await Subscription.find().sort({createdAt:-1}).limit(200).populate("user","username email").populate("plan","name code price currency billingInterval")})}catch(e){next(e)}};
exports.payments=async(req,res,next)=>{try{res.json({payments:await Payment.find().sort({createdAt:-1}).limit(200).populate("user","username email").populate("plan","name code")})}catch(e){next(e)}};


// Admin user management: never expose password hashes through the API.
const bcrypt = require("bcryptjs");
exports.users = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim().slice(0, 100);
    const filter = q ? { $or: [
      { email: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
      { username: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }
    ] } : {};
    const users = await User.find(filter).select("username email country minecraftUuid role isActive createdAt updatedAt").sort({ createdAt: -1 }).limit(200).lean();
    res.json({ users });
  } catch (e) { next(e); }
};
exports.createUser = async (req, res, next) => {
  try {
    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const role = req.body.role === "admin" ? "admin" : "player";
    if (!username || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) return res.status(400).json({ message: "Username, valid email, and password (at least 8 characters) are required." });
    const country = String(req.body.country || "").trim().slice(0, 100);
    const user = await User.create({ username, email, country, role, isActive: req.body.isActive !== false, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ user: { _id: user._id, username: user.username, email: user.email, country: user.country || "", role: user.role, isActive: user.isActive, createdAt: user.createdAt } });
  } catch (e) { next(e); }
};
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("+passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (req.body.username !== undefined) user.username = String(req.body.username).trim();
    if (req.body.email !== undefined) user.email = String(req.body.email).trim().toLowerCase();
    if (req.body.country !== undefined) user.country = String(req.body.country || "").trim().slice(0, 100);
    if (req.body.role !== undefined) { if (!["admin", "player"].includes(req.body.role)) return res.status(400).json({ message: "Invalid role" }); user.role = req.body.role; }
    if (req.body.isActive !== undefined) {
      if (user._id.toString() === req.auth.sub && req.body.isActive === false) return res.status(400).json({ message: "You cannot deactivate your own account." });
      user.isActive = Boolean(req.body.isActive);
    }
    if (req.body.password) { if (String(req.body.password).length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." }); user.passwordHash = await bcrypt.hash(String(req.body.password), 12); }
    await user.save();
    res.json({ user: { _id: user._id, username: user.username, email: user.email, country: user.country || "", role: user.role, isActive: user.isActive, createdAt: user.createdAt, updatedAt: user.updatedAt } });
  } catch (e) { next(e); }
};
exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.auth.sub) return res.status(400).json({ message: "You cannot delete your own account." });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (e) { next(e); }
};
