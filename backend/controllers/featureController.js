const Plan = require("../models/Plan");
const collection = () => Plan.db.collection("plans_features");
const clean = (v) => String(v ?? "").trim();
exports.list = async (req, res, next) => { try {
  const features = await collection().find({}).sort({ featureName: 1, planCode: 1 }).toArray();
  res.json({ features });
} catch (e) { next(e); } };
exports.create = async (req, res, next) => { try {
  const planCode = clean(req.body.planCode).toUpperCase();
  const featureName = clean(req.body.featureName);
  const featureKey = clean(req.body.featureKey || featureName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
  if (!planCode || !featureName) return res.status(400).json({ message: "Plan and feature name are required." });
  const plan = await Plan.findOne({ code: planCode }).select("_id code").lean();
  if (!plan) return res.status(400).json({ message: `Plan code '${planCode}' does not exist.` });
  const raw = req.body.value;
  const value = typeof raw === "boolean" || typeof raw === "number" ? raw : clean(raw);
  const valueType = ["boolean", "number", "text"].includes(req.body.valueType) ? req.body.valueType : (typeof value === "string" ? "text" : typeof value);
  const doc = { planCode, planId: plan._id, featureKey, featureName, value, valueType, enabled: req.body.enabled === undefined ? value !== false && value !== "—" && value !== "" : Boolean(req.body.enabled), createdAt: new Date(), updatedAt: new Date() };
  const result = await collection().insertOne(doc);
  res.status(201).json({ feature: { ...doc, _id: result.insertedId } });
} catch (e) { next(e); } };
exports.update = async (req, res, next) => { try {
  const { ObjectId } = require("mongodb");
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid feature ID." });
  const patch = {};
  if (req.body.planCode !== undefined) {
    const planCode = clean(req.body.planCode).toUpperCase();
    const plan = await Plan.findOne({ code: planCode }).select("_id code").lean();
    if (!plan) return res.status(400).json({ message: `Plan code '${planCode}' does not exist.` });
    patch.planCode = planCode;
    patch.planId = plan._id;
  }
  if (req.body.featureName !== undefined) patch.featureName = clean(req.body.featureName);
  if (req.body.featureKey !== undefined) patch.featureKey = clean(req.body.featureKey);
  if (req.body.valueType !== undefined && ["boolean", "number", "text"].includes(req.body.valueType)) patch.valueType = req.body.valueType;
  if (req.body.enabled !== undefined) patch.enabled = Boolean(req.body.enabled);
  if (req.body.value !== undefined) { patch.value = req.body.value; patch.valueType = patch.valueType || (typeof req.body.value === "string" ? "text" : typeof req.body.value); if (req.body.enabled === undefined) patch.enabled = req.body.value !== false && req.body.value !== "—" && req.body.value !== ""; }
  patch.updatedAt = new Date();
  const result = await collection().findOneAndUpdate({ _id: new ObjectId(req.params.id) }, { $set: patch }, { returnDocument: "after" });
  const feature = result?.value ?? result;
  if (!feature) return res.status(404).json({ message: "Feature not found." });
  res.json({ feature });
} catch (e) { next(e); } };
exports.remove = async (req, res, next) => { try {
  const { ObjectId } = require("mongodb");
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid feature ID." });
  const result = await collection().deleteOne({ _id: new ObjectId(req.params.id) });
  if (!result.deletedCount) return res.status(404).json({ message: "Feature not found." });
  res.json({ success: true });
} catch (e) { next(e); } };
