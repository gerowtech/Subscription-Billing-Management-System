const Customer = require("../models/Customer");

const allowedFields = [
  "firstName", "lastName", "displayName", "email", "phone",
  "minecraftUsername", "minecraftUuid", "country", "region", "city",
  "postalCode", "addressLine1", "addressLine2", "source",
  "marketingConsent", "tags", "notes", "status", "user"
];

function cleanPayload(body) {
  const result = {};
  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, key)) result[key] = body[key];
  }
  if (result.email) result.email = String(result.email).trim().toLowerCase();
  if (result.minecraftUsername) result.minecraftUsername = String(result.minecraftUsername).trim();
  return result;
}

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const filter = {};
    if (["active", "inactive", "blocked"].includes(req.query.status)) filter.status = req.query.status;
    if (req.query.q) {
      const q = String(req.query.q).trim().slice(0, 100);
      filter.$or = [
        { email: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
        { firstName: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
        { lastName: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
        { minecraftUsername: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }
      ];
    }
    const [customers, total] = await Promise.all([
      Customer.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Customer.countDocuments(filter)
    ]);
    res.json({ customers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json({ customer });
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const payload = cleanPayload(req.body || {});
    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      return res.status(400).json({ message: "A valid customer email is required." });
    }
    const customer = await Customer.create(payload);
    res.status(201).json({ customer });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const payload = cleanPayload(req.body || {});
    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    const customer = await Customer.findByIdAndUpdate(req.params.id, { $set: payload }, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json({ customer });
  } catch (error) { next(error); }
};

exports.remove = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer deleted" });
  } catch (error) { next(error); }
};
