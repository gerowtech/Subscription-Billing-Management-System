const Plan = require("../models/Plan");
const normalizeCode = (value) => String(value ?? "").trim().toUpperCase();

exports.list = async (req, res, next) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    if (!plans.length) return res.json({ plans: [], features: [] });

    const codes = plans.map((plan) => normalizeCode(plan.code));
    const ids = plans.map((plan) => plan._id);
    // Support canonical planCode/planId fields and older packageId data while records are migrated.
    const featureDocs = await Plan.db.collection("plans_features").find({
      $or: [
        { planCode: { $in: codes } },
        { planId: { $in: ids } },
        { packageId: { $in: [...codes, ...ids] } },
      ],
    }).toArray();

    const byPlan = new Map();
    for (const plan of plans) byPlan.set(String(plan._id), []);
    for (const feature of featureDocs) {
      const directId = feature.planId == null ? "" : String(feature.planId);
      const code = normalizeCode(feature.planCode || feature.packageId);
      const target = plans.find((plan) => String(plan._id) === directId || normalizeCode(plan.code) === code);
      if (!target) continue;
      const value = feature.value;
      let label = null;
      if (value === true) label = feature.featureName;
      else if (typeof value === "number" || (typeof value === "string" && value.trim() && value !== "—")) {
        label = `${feature.featureName}: ${value}`;
      }
      if (label) byPlan.get(String(target._id)).push(label);
    }

    const enriched = plans.map((plan) => ({
      ...plan,
      features: byPlan.get(String(plan._id))?.length ? byPlan.get(String(plan._id)) : (plan.features || []),
    }));
    res.json({ plans: enriched, features: featureDocs });
  } catch (error) { next(error); }
};

exports.adminList = async (req, res, next) => {
  try { res.json({ plans: await Plan.find().sort({ sortOrder: 1 }) }); }
  catch (error) { next(error); }
};
exports.create = async (req, res, next) => {
  try { const plan = await Plan.create(req.body); res.status(201).json({ plan }); }
  catch (error) { next(error); }
};
exports.update = async (req, res, next) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.json({ plan });
  } catch (error) { next(error); }
};
exports.disable = async (req, res, next) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.json({ plan });
  } catch (error) { next(error); }
};
