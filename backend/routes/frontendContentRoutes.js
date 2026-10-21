const router=require("express").Router();
const mongoose=require("mongoose");
const {requireAuth,requireAdmin}=require("../middleware/auth");
router.use(requireAuth,requireAdmin);
const collections={
 "frontend-settings":"frontend_settings",
 "frontend-sections":"frontend_sections",
 "features":"frontend_features",
 "best-features":"best_features",
 "faq":"faqs",
 "testimonials":"testimonials"
};
function coll(req){const name=collections[req.params.kind];if(!name)return null;return mongoose.connection.collection(name)}
router.get("/:kind",async(req,res,next)=>{try{const c=coll(req);if(!c)return res.status(404).json({message:"Unknown content type"});if(req.params.kind==="frontend-settings"){const doc=await c.findOne({key:"main"});return res.json({item:doc||{key:"main",activeStatus:true,registrationActive:true,metaKeyword:"",metaAuthor:"",metaDescription:"",facebookLink:"",twitterLink:"",linkedinLink:"",skypeLink:""}})}const items=await c.find({}).sort({sortOrder:1,createdAt:1}).toArray();res.json({items})}catch(e){next(e)}});
router.put("/:kind",async(req,res,next)=>{try{const c=coll(req);if(!c)return res.status(404).json({message:"Unknown content type"});if(req.params.kind!=="frontend-settings")return res.status(405).json({message:"Use item endpoint to edit this content"});const fields=["activeStatus","registrationActive","metaKeyword","metaAuthor","metaDescription","facebookLink","twitterLink","linkedinLink","skypeLink"];const doc={key:"main",updatedAt:new Date()};for(const f of fields)if(req.body[f]!==undefined)doc[f]=req.body[f];await c.updateOne({key:"main"},{$set:doc},{upsert:true});res.json({message:"Frontend settings saved",item:await c.findOne({key:"main"})})}catch(e){next(e)}});
router.post("/:kind",async(req,res,next)=>{try{const c=coll(req);if(!c)return res.status(404).json({message:"Unknown content type"});if(req.params.kind==="frontend-settings")return res.status(405).json({message:"Use PUT to save settings"});const body={...req.body};delete body._id;if(!String(body.title||body.name||body.question||body.sectionName||"").trim())return res.status(400).json({message:"A title, name, or question is required"});body.isActive=body.isActive!==false;body.createdAt=new Date();body.updatedAt=new Date();const r=await c.insertOne(body);res.status(201).json({item:{...body,_id:r.insertedId}})}catch(e){next(e)}});
router.put("/:kind/:id",async(req,res,next)=>{try{const c=coll(req);if(!c)return res.status(404).json({message:"Unknown content type"});const {ObjectId}=require("mongodb");if(!ObjectId.isValid(req.params.id))return res.status(400).json({message:"Invalid item id"});const body={...req.body,updatedAt:new Date()};delete body._id;delete body.createdAt;const r=await c.updateOne({_id:new ObjectId(req.params.id)},{$set:body});if(!r.matchedCount)return res.status(404).json({message:"Item not found"});res.json({item:await c.findOne({_id:new ObjectId(req.params.id)})})}catch(e){next(e)}});
router.delete("/:kind/:id",async(req,res,next)=>{try{const c=coll(req);if(!c)return res.status(404).json({message:"Unknown content type"});const {ObjectId}=require("mongodb");if(!ObjectId.isValid(req.params.id))return res.status(400).json({message:"Invalid item id"});const r=await c.deleteOne({_id:new ObjectId(req.params.id)});if(!r.deletedCount)return res.status(404).json({message:"Item not found"});res.json({message:"Item deleted"})}catch(e){next(e)}});
module.exports=router;
