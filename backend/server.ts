const fs = require("fs");
const path = require("path");
const envPath = process.env.ENV_FILE || (fs.existsSync(path.resolve(process.cwd(), ".env")) ? path.resolve(process.cwd(), ".env") : path.resolve(__dirname, "../.env"));
require("dotenv").config({ path: envPath });
const express=require("express"),mongoose=require("mongoose"),cors=require("cors"),helmet=require("helmet"),rateLimit=require("express-rate-limit");
const {status:minecraftStatus}=require("minecraft-server-util");
const planRoutes=require("./routes/planRoutes"),tierRoutes=require("./routes/tierRoutes"),authRoutes=require("./routes/authRoutes"),adminRoutes=require("./routes/adminRoutes"),checkoutRoutes=require("./routes/checkoutRoutes"),customerRoutes=require("./routes/customerRoutes"),reportRoutes=require("./routes/reportRoutes"),frontendContentRoutes=require("./routes/frontendContentRoutes");
const app=express(),PORT=Number(process.env.PORT||4001);
app.use(helmet());
app.use(cors({origin:(process.env.FRONTEND_URL||"http://localhost:5173").split(",").map(s=>s.trim())}));
app.use(express.json({limit:"1mb"}));
app.use(rateLimit({windowMs:900000,limit:300,standardHeaders:true,legacyHeaders:false}));

app.get("/api/health",(req,res)=>res.status(200).json({
  ok:true,
  database:mongoose.connection.readyState===1?"connected":"disconnected"
}));

// Public, read-only application settings used by the website shell (navbar, footer, SEO).
app.get("/api/settings/application",async(req,res,next)=>{
  try{
    if(mongoose.connection.readyState!==1) return res.json({settings:{appName:"StrafeMC",appEmail:"admin@strafemc.net",contactNumber:"",appLocation:"",appCopyright:"© 2026 StrafeMC. All Rights Reserved.",footerText:"",developedBy:"StrafeMC",timezone:"UTC"}});
    const doc=await mongoose.connection.db.collection("settings").findOne({key:"application.general"});
    const defaults={appName:"StrafeMC",appEmail:"admin@strafemc.net",contactNumber:"",appLocation:"",appCopyright:"© 2026 StrafeMC. All Rights Reserved.",footerText:"",developedBy:"StrafeMC",timezone:"UTC"};
    res.set("Cache-Control","no-store");
    res.json({settings:{...defaults,...(doc?.value&&typeof doc.value==="object"?doc.value:{})}});
  }catch(err){next(err)}
});
app.get("/api/faq",async(req,res,next)=>{try{
  if(mongoose.connection.readyState!==1) return res.status(503).json({message:"Database is not connected yet"});
  const faqs=await mongoose.connection.db.collection("faqs").find({active:{$ne:false}}).sort({sortOrder:1}).project({_id:0,question:1,answer:1,category:1,sortOrder:1}).toArray();
  res.json({faqs});
}catch(err){next(err)}});
app.get("/api/server/status",async(req,res)=>{const host=process.env.MINECRAFT_HOST||"play.strafemc.net",port=Number(process.env.MINECRAFT_PORT||25565);try{const s=await minecraftStatus(host,port,{timeout:2500});res.json({online:true,host,version:s.version?.name,players:{online:s.players?.online||0,max:s.players?.max||0}})}catch{res.json({online:false,host,players:{online:0,max:0}})}});

// Register API routes once, before starting the HTTP server.
app.use("/api/plans",planRoutes);
app.use("/api/tiers",tierRoutes);
app.use("/api/auth",authRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/admin/content",frontendContentRoutes);
app.use("/api/checkout",checkoutRoutes);
app.use("/api/admin/customers",customerRoutes);
app.use("/api/admin/reports",reportRoutes);
app.use((err,req,res,next)=>{console.error(err);res.status(err.status|| (err.name==="ValidationError"?400:err.code===11000?409:500)).json({message:err.status?err.message:err.code===11000?"A record with this value already exists":err.name==="ValidationError"?err.message:"Unexpected server error"})});

// Start HTTP even if MongoDB is temporarily unavailable. Retry the connection
// in the background so nodemon does not repeatedly crash on a missing MongoDB.
const server = app.listen(PORT,()=>console.log(`StrafeMC API listening on http://localhost:${PORT}`));
server.on("error",(err)=>{
  if(err && err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the other process or set PORT in your environment to an available port.`);
    process.exitCode = 1;
    return;
  }
  console.error("Failed to start StrafeMC API:", err);
  process.exitCode = 1;
});
const mongoUri=process.env.MONGODB_URI||"mongodb://127.0.0.1:27017/strafemc";
const mongoDbName=process.env.MONGODB_DB||"strafemc";
let connecting=false;
async function connectMongo(){
  if(connecting || mongoose.connection.readyState===1) return;
  connecting=true;
  try{
    await mongoose.connect(mongoUri,{dbName:mongoDbName,serverSelectionTimeoutMS:5000});
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  }catch(e){
    console.error(`MongoDB connection failed: ${e.message}`);
    console.error("The API is still running, but database-backed endpoints will not work until MongoDB is available. Check MONGODB_URI and make sure MongoDB is running.");
  }finally{connecting=false;}
}
void connectMongo();
setInterval(()=>{if(mongoose.connection.readyState!==1) void connectMongo();},10000).unref();
mongoose.connection.on("disconnected",()=>console.warn("MongoDB disconnected; will retry automatically."));
