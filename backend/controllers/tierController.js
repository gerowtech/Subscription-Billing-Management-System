const TierEntry=require("../models/TierEntry");
const {getDemoTiers}=require("./tierDemoData");
exports.list=async(req,res,next)=>{try{
 const mode=["smp","pvp"].includes(req.query.mode)?req.query.mode:"smp";
 const queue=["solo","team"].includes(req.query.queue)?req.query.queue:"solo";
 const season=String(req.query.season||"1");
 if(req.query.demo==="true") return res.json(getDemoTiers({mode,season,queue}));
 const players=await TierEntry.find({mode,queue,season}).sort({points:-1}).limit(100).select("username points rank teamName -_id");
 if(!players.length && process.env.TIERS_DEMO_FALLBACK!=="false") return res.json(getDemoTiers({mode,season,queue}));
 res.json({mode,queue,season,demo:false,players});
 }catch(e){next(e)}};
