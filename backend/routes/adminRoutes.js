const router=require("express").Router(),c=require("../controllers/adminController"),plans=require("../controllers/planController"),features=require("../controllers/featureController"),{requireAuth,requireAdmin}=require("../middleware/auth");
router.use(requireAuth,requireAdmin);
// Frontend settings are stored as a single document in frontend_settings.
router.get("/frontend-settings", async (req, res, next) => {
  try {
    const settings = await require("mongoose").connection.db.collection("frontend_settings").findOne({ key: "main" });
    res.json({ settings: settings || {
      activeStatus: true, registrationActive: true, metaKeyword: "", metaAuthor: "",
      metaDescription: "", facebookLink: "", twitterLink: "", linkedinLink: "", skypeLink: ""
    }});
  } catch (err) { next(err); }
});
router.put("/frontend-settings", async (req, res, next) => {
  try {
    const body = req.body || {};
    const clean = {
      key: "main",
      activeStatus: body.activeStatus !== false,
      registrationActive: body.registrationActive !== false,
      metaKeyword: typeof body.metaKeyword === "string" ? body.metaKeyword.trim().slice(0, 500) : "",
      metaAuthor: typeof body.metaAuthor === "string" ? body.metaAuthor.trim().slice(0, 160) : "",
      metaDescription: typeof body.metaDescription === "string" ? body.metaDescription.trim().slice(0, 320) : "",
      facebookLink: typeof body.facebookLink === "string" ? body.facebookLink.trim().slice(0, 500) : "",
      twitterLink: typeof body.twitterLink === "string" ? body.twitterLink.trim().slice(0, 500) : "",
      linkedinLink: typeof body.linkedinLink === "string" ? body.linkedinLink.trim().slice(0, 500) : "",
      skypeLink: typeof body.skypeLink === "string" ? body.skypeLink.trim().slice(0, 500) : "",
      updatedAt: new Date()
    };
    if (!clean.metaKeyword || !clean.metaAuthor || !clean.metaDescription) {
      return res.status(400).json({ message: "Meta Keyword, Meta Author, and Meta Description are required." });
    }
    await require("mongoose").connection.db.collection("frontend_settings").updateOne(
      { key: "main" }, { $set: clean, $setOnInsert: { createdAt: new Date() } }, { upsert: true }
    );
    res.json({ message: "Frontend settings saved successfully.", settings: clean });
  } catch (err) { next(err); }
});

// Application settings stored as a single settings document, safely editable by admins.
router.get("/application-settings", async (req, res, next) => {
  try {
    const db = require("mongoose").connection.db;
    const doc = await db.collection("settings").findOne({ key: "application.general" });
    const defaults = { appName: "StrafeMC", appEmail: "admin@strafemc.net", contactNumber: "", appLocation: "", appCopyright: "© 2026 StrafeMC. All Rights Reserved.", footerText: "", developedBy: "StrafeMC", timezone: "UTC" };
    res.json({ settings: { ...defaults, ...(doc?.value && typeof doc.value === "object" ? doc.value : {}) } });
  } catch (err) { next(err); }
});
router.put("/application-settings", async (req, res, next) => {
  try {
    const body = req.body || {};
    const limits = { appName: 100, appEmail: 254, contactNumber: 40, appLocation: 240, appCopyright: 240, footerText: 500, developedBy: 120, timezone: 100 };
    const clean = {};
    for (const [field, max] of Object.entries(limits)) clean[field] = typeof body[field] === "string" ? body[field].trim().slice(0, max) : "";
    if (!clean.appName) return res.status(400).json({ message: "App Name is required." });
    if (!clean.appEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.appEmail)) return res.status(400).json({ message: "Enter a valid App Email address." });
    if (!clean.timezone || !/^[A-Za-z_+-]+(?:\/[A-Za-z0-9_+.-]+)*$/.test(clean.timezone)) return res.status(400).json({ message: "Select a valid timezone." });
    const db = require("mongoose").connection.db;
    const now = new Date();
    await db.collection("settings").updateOne(
      { key: "application.general" },
      { $set: { value: clean, valueType: "object", group: "application", description: "Application general settings", isPublic: true, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
    res.json({ message: "Application settings saved successfully.", settings: clean });
  } catch (err) { next(err); }
});


// Language settings are stored in MongoDB (languages collection), not browser storage.
const languageDefaults = [
  { name: "English", code: "en", flag: "", rtl: false, font: false, translations: { dashboard: "Dashboard", ranks: "Ranks", settings: "Settings", logout: "Logout" } },
  { name: "Chinese", code: "zh", flag: "", rtl: false, font: false, translations: { dashboard: "仪表板", ranks: "等级", settings: "设置", logout: "退出登录" } },
  { name: "Spanish", code: "es", flag: "", rtl: false, font: false, translations: { dashboard: "Panel", ranks: "Rangos", settings: "Configuración", logout: "Cerrar sesión" } },
  { name: "Arabic", code: "ar", flag: "", rtl: true, font: false, translations: { dashboard: "لوحة التحكم", ranks: "الرتب", settings: "الإعدادات", logout: "تسجيل الخروج" } },
  { name: "French", code: "fr", flag: "", rtl: false, font: false, translations: { dashboard: "Tableau de bord", ranks: "Grades", settings: "Paramètres", logout: "Déconnexion" } },
  { name: "Portuguese", code: "pt", flag: "", rtl: false, font: false, translations: { dashboard: "Painel", ranks: "Patentes", settings: "Configurações", logout: "Sair" } },
  { name: "Russian", code: "ru", flag: "", rtl: false, font: false, translations: { dashboard: "Панель управления", ranks: "Ранги", settings: "Настройки", logout: "Выйти" } },
  { name: "German", code: "de", flag: "", rtl: false, font: false, translations: { dashboard: "Dashboard", ranks: "Ränge", settings: "Einstellungen", logout: "Abmelden" } }
];
const languageCollection = () => require("mongoose").connection.db.collection("languages");
const publicLanguage = (doc) => ({ id: String(doc._id), name: doc.name, code: doc.code, flag: doc.flag || "", rtl: !!doc.rtl, font: !!doc.font, translations: doc.translations || {}, createdAt: doc.createdAt, updatedAt: doc.updatedAt });
router.get("/languages", async (req, res, next) => {
  try {
    const collection = languageCollection();
    let docs = await collection.find({}).sort({ name: 1 }).toArray();
    if (!docs.length) {
      const now = new Date();
      await collection.insertMany(languageDefaults.map(item => ({ ...item, createdAt: now, updatedAt: now })));
      docs = await collection.find({}).sort({ name: 1 }).toArray();
    }
    res.set("Cache-Control", "no-store");
    res.json({ languages: docs.map(publicLanguage) });
  } catch (err) { next(err); }
});
router.post("/languages", async (req, res, next) => {
  try {
    const body = req.body || {};
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
    const code = typeof body.code === "string" ? body.code.trim().toLowerCase() : "";
    if (!name) return res.status(400).json({ message: "Language name is required." });
    if (!/^[a-z]{2,3}(-[a-z0-9]+)?$/.test(code)) return res.status(400).json({ message: "Enter a valid ISO language code, such as en or pt-br." });
    const collection = languageCollection();
    if (await collection.findOne({ code })) return res.status(409).json({ message: "That language code already exists." });
    const now = new Date();
    const doc = { name, code, flag: typeof body.flag === "string" ? body.flag.trim().slice(0, 1000) : "", rtl: body.rtl === true, font: body.font === true, translations: body.translations && typeof body.translations === "object" && !Array.isArray(body.translations) ? body.translations : {}, createdAt: now, updatedAt: now };
    const result = await collection.insertOne(doc);
    res.status(201).json({ language: publicLanguage({ ...doc, _id: result.insertedId }), message: "Language created successfully." });
  } catch (err) { next(err); }
});
router.put("/languages/:id", async (req, res, next) => {
  try {
    const { ObjectId } = require("mongoose").Types;
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid language ID." });
    const body = req.body || {}, update = { updatedAt: new Date() };
    if (typeof body.name === "string") { update.name = body.name.trim().slice(0, 80); if (!update.name) return res.status(400).json({ message: "Language name is required." }); }
    if (typeof body.code === "string") { update.code = body.code.trim().toLowerCase(); if (!/^[a-z]{2,3}(-[a-z0-9]+)?$/.test(update.code)) return res.status(400).json({ message: "Enter a valid ISO language code." }); }
    if (typeof body.flag === "string") update.flag = body.flag.trim().slice(0, 1000);
    if (typeof body.rtl === "boolean") update.rtl = body.rtl;
    if (typeof body.font === "boolean") update.font = body.font;
    if (body.translations && typeof body.translations === "object" && !Array.isArray(body.translations)) update.translations = body.translations;
    const collection = languageCollection(), id = new ObjectId(req.params.id);
    if (update.code && await collection.findOne({ code: update.code, _id: { $ne: id } })) return res.status(409).json({ message: "That language code already exists." });
    const saved = await collection.findOneAndUpdate({ _id: id }, { $set: update }, { returnDocument: "after" });
    const doc = saved && saved.value !== undefined ? saved.value : saved;
    if (!doc) return res.status(404).json({ message: "Language not found." });
    res.json({ language: publicLanguage(doc), message: "Language updated successfully." });
  } catch (err) { next(err); }
});
router.delete("/languages/:id", async (req, res, next) => {
  try {
    const { ObjectId } = require("mongoose").Types;
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid language ID." });
    const collection = languageCollection(), id = new ObjectId(req.params.id);
    const language = await collection.findOne({ _id: id });
    if (!language) return res.status(404).json({ message: "Language not found." });
    if (language.code === "en") return res.status(400).json({ message: "English is the default language and cannot be deleted." });
    await collection.deleteOne({ _id: id });
    res.json({ message: `${language.name} deleted successfully.` });
  } catch (err) { next(err); }
});
router.put("/languages/:id/translations", async (req, res, next) => {
  try {
    const { ObjectId } = require("mongoose").Types;
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid language ID." });
    const input = req.body?.translations;
    if (!input || typeof input !== "object" || Array.isArray(input)) return res.status(400).json({ message: "Translations must be an object." });
    const translations = {};
    for (const [key, value] of Object.entries(input)) {
      const cleanKey = String(key).trim().slice(0, 120);
      if (cleanKey) translations[cleanKey] = String(value ?? "").slice(0, 2000);
      if (Object.keys(translations).length > 500) return res.status(400).json({ message: "A maximum of 500 translation entries is allowed." });
    }
    const saved = await languageCollection().findOneAndUpdate({ _id: new ObjectId(req.params.id) }, { $set: { translations, updatedAt: new Date() } }, { returnDocument: "after" });
    const doc = saved && saved.value !== undefined ? saved.value : saved;
    if (!doc) return res.status(404).json({ message: "Language not found." });
    res.json({ language: publicLanguage(doc), message: "Translations saved successfully." });
  } catch (err) { next(err); }
});


// Admin two-factor authentication (TOTP compatible with Google Authenticator).
const User = require("../models/User");
const { generateSecret, verifyCode } = require("../utils/totp");
const QRCode = require("qrcode");
router.get("/2fa/status", async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub).select("twoFactorEnabled");
    if (!user) return res.status(404).json({ message: "Administrator account not found." });
    res.set("Cache-Control", "no-store");
    res.json({ enabled: !!user.twoFactorEnabled });
  } catch (err) { next(err); }
});
router.post("/2fa/setup", async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub).select("+twoFactorSecret +twoFactorPendingSecret email username");
    if (!user) return res.status(404).json({ message: "Administrator account not found." });
    if (user.twoFactorEnabled) return res.status(409).json({ message: "Two-factor authentication is already enabled." });
    const secret = generateSecret();
    const account = user.email || user.username || "Administrator";
    const issuer = "StrafeMC";
    const uri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
    user.twoFactorPendingSecret = secret;
    await user.save();
    res.set("Cache-Control", "no-store");
    res.json({ qrCode: await QRCode.toDataURL(uri), secret, accountName: account });
  } catch (err) { next(err); }
});
router.post("/2fa/confirm", async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub).select("+twoFactorSecret +twoFactorPendingSecret");
    if (!user) return res.status(404).json({ message: "Administrator account not found." });
    if (!user.twoFactorPendingSecret) return res.status(400).json({ message: "Start setup first, then scan the QR code." });
    if (!verifyCode(user.twoFactorPendingSecret, req.body.code)) return res.status(400).json({ message: "Invalid authenticator code. Check your device time and try again." });
    user.twoFactorSecret = user.twoFactorPendingSecret;
    user.twoFactorPendingSecret = null;
    user.twoFactorEnabled = true;
    await user.save();
    res.json({ message: "Google Authenticator enabled successfully." });
  } catch (err) { next(err); }
});
router.post("/2fa/disable", async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub).select("+twoFactorSecret +twoFactorPendingSecret");
    if (!user) return res.status(404).json({ message: "Administrator account not found." });
    if (!user.twoFactorEnabled || !user.twoFactorSecret) return res.status(400).json({ message: "Two-factor authentication is not enabled." });
    if (!verifyCode(user.twoFactorSecret, req.body.code)) return res.status(400).json({ message: "Invalid authenticator code." });
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorPendingSecret = null;
    await user.save();
    res.json({ message: "Google Authenticator disabled successfully." });
  } catch (err) { next(err); }
});

router.get("/overview",c.overview);
router.get("/users",c.users);
router.post("/users",c.createUser);
router.put("/users/:id",c.updateUser);
router.delete("/users/:id",c.deleteUser);
router.get("/plans",plans.adminList);
router.get("/features",features.list);
router.post("/features",features.create);
router.put("/features/:id",features.update);
router.delete("/features/:id",features.remove);
router.post("/plans",plans.create);
router.put("/plans/:id",plans.update);
router.delete("/plans/:id",plans.disable);

// Payment gateway configuration stored in the payment_methods collection.
router.get("/payment-methods", async (req, res, next) => {
  try {
    const items = await require("mongoose").connection.db.collection("payment_methods").find({}).sort({ sortOrder: 1 }).toArray();
    res.json({ paymentMethods: items.map(({ credentials, ...item }) => ({ ...item, credentialsConfigured: !!(credentials && Object.keys(credentials).length) })) });
  } catch (err) { next(err); }
});
router.put("/payment-methods/:id", async (req, res, next) => {
  try {
    const { title, label, status, mode, enabled, credentials } = req.body || {};
    const allowedStatus = ["active", "inactive"];
    const allowedMode = ["Sandbox", "Live"];
    const update = { updatedAt: new Date() };
    if (typeof title === "string" && title.trim()) update.title = title.trim().slice(0, 100);
    if (typeof label === "string" && label.trim()) update.label = label.trim().slice(0, 100);
    if (allowedStatus.includes(status)) update.status = status;
    if (allowedMode.includes(mode)) update.mode = mode;
    if (typeof enabled === "boolean") { update.enabled = enabled; update.isEnabled = enabled; }
    const collection = require("mongoose").connection.db.collection("payment_methods");
    const { ObjectId } = require("mongoose").Types;
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid payment method ID" });
    if (credentials && typeof credentials === "object" && !Array.isArray(credentials)) {
      const existing = await collection.findOne({ _id: new ObjectId(req.params.id) });
      if (!existing) return res.status(404).json({ message: "Payment gateway not found" });
      const safe = { ...(existing.credentials || {}) };
      for (const key of ["publicKey", "secretKey", "clientId", "clientSecret", "merchantId", "webhookSecret", "instructions"]) {
        if (typeof credentials[key] === "string" && credentials[key].trim()) safe[key] = credentials[key].slice(0, 2000);
      }
      update.credentials = safe;
    }
    const result = await collection.findOneAndUpdate({ _id: new ObjectId(req.params.id) }, { $set: update }, { returnDocument: "after" });
    const saved = result && result.value !== undefined ? result.value : result;
    if (!saved) return res.status(404).json({ message: "Payment gateway not found" });
    const { credentials: savedCredentials, ...safeItem } = saved;
    res.json({ paymentMethod: { ...safeItem, credentialsConfigured: !!(savedCredentials && Object.keys(savedCredentials).length) } });
  } catch (err) { next(err); }
});

router.get("/subscriptions",c.subscriptions);
router.put("/subscriptions/:id", async (req,res,next)=>{
  try {
    const mongoose=require("mongoose"), Subscription=require("../models/Subscription"), Payment=require("../models/Payment"), Plan=require("../models/Plan");
    const {userId,planId,status,startDate,endDate,durationType,gateway}=req.body||{};
    if(!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({message:"Invalid subscription ID"});
    if(!mongoose.isValidObjectId(userId)||!mongoose.isValidObjectId(planId)) return res.status(400).json({message:"Select a valid user and package"});
    const allowed=["active","trialing","past_due","canceled","expired"];
    if(!allowed.includes(status)) return res.status(400).json({message:"Invalid subscription status"});
    const start=new Date(startDate); if(!startDate||Number.isNaN(start.getTime())) return res.status(400).json({message:"Enter a valid start date"});
    let end;
    if(endDate){end=new Date(endDate);if(Number.isNaN(end.getTime()))return res.status(400).json({message:"Enter a valid end date"});}
    else {const plan=await Plan.findById(planId);if(!plan)return res.status(404).json({message:"Package not found"});end=new Date(start);end.setMonth(end.getMonth()+(String(durationType).toLowerCase()==="yearly"?12:1));}
    if(end<start)return res.status(400).json({message:"End date must be on or after the start date"});
    const updated=await Subscription.findByIdAndUpdate(req.params.id,{$set:{user:userId,plan:planId,status,startsAt:start,currentPeriodStart:start,currentPeriodEnd:end}},{new:true,runValidators:true}).populate("user","username email").populate("plan","name code price currency billingInterval");
    if(!updated)return res.status(404).json({message:"Subscription not found"});
    const providers={Cash:"manual",Manual:"manual",Stripe:"stripe",PayPal:"paypal",Demo:"demo"};
    if(gateway&&providers[gateway]) await Payment.updateMany({subscription:updated._id},{$set:{provider:providers[gateway],user:userId,plan:planId}});
    res.json({message:"Subscription updated successfully",subscription:updated});
  } catch(err){next(err);}
});
router.get("/payments",c.payments);
module.exports=router;
