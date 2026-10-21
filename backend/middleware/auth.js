const jwt=require("jsonwebtoken");
function requireAuth(req,res,next){const header=req.headers.authorization||"",token=header.startsWith("Bearer ")?header.slice(7):"";if(!token)return res.status(401).json({message:"Authentication required"});try{req.auth=jwt.verify(token,process.env.JWT_SECRET||"development-only-change-me");next()}catch{return res.status(401).json({message:"Session expired"})}}
function requireAdmin(req,res,next){if(req.auth?.role!=="admin")return res.status(403).json({message:"Admin access required"});next()}
module.exports={requireAuth,requireAdmin};
