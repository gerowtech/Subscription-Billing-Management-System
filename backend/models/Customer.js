const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  firstName: { type: String, trim: true, maxlength: 80, default: "" },
  lastName: { type: String, trim: true, maxlength: 80, default: "" },
  displayName: { type: String, trim: true, maxlength: 120, default: "" },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 40, default: "" },
  minecraftUsername: { type: String, trim: true, maxlength: 16, default: "" },
  minecraftUuid: { type: String, trim: true, default: "" },
  country: { type: String, trim: true, maxlength: 100, default: "" },
  region: { type: String, trim: true, maxlength: 100, default: "" },
  city: { type: String, trim: true, maxlength: 100, default: "" },
  postalCode: { type: String, trim: true, maxlength: 24, default: "" },
  addressLine1: { type: String, trim: true, maxlength: 200, default: "" },
  addressLine2: { type: String, trim: true, maxlength: 200, default: "" },
  source: { type: String, enum: ["store", "website", "discord", "admin", "other"], default: "store" },
  marketingConsent: { type: Boolean, default: false },
  tags: [{ type: String, trim: true, maxlength: 40 }],
  notes: { type: String, maxlength: 2000, default: "" },
  status: { type: String, enum: ["active", "inactive", "blocked"], default: "active", index: true },
  lastOrderAt: { type: Date, default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true }
}, { timestamps: true });

customerSchema.index({ email: 1 }, { unique: true });
customerSchema.index({ minecraftUsername: 1 });
customerSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Customer", customerSchema);
