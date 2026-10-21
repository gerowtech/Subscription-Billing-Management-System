const bcrypt=require("bcryptjs"),jwt=require("jsonwebtoken"),User=require("../models/User");
exports.login=async(req,res,next)=>{try{const email=String(req.body.email||"").toLowerCase().trim(),password=String(req.body.password||"");const user=await User.findOne({email,role:"admin",isActive:true}).select("+passwordHash +twoFactorSecret");if(!user||!user.passwordHash||!(await bcrypt.compare(password,user.passwordHash)))return res.status(401).json({message:"Invalid admin credentials"});if(user.twoFactorEnabled&&user.twoFactorSecret){const challengeToken=jwt.sign({sub:user._id.toString(),purpose:"2fa-login"},process.env.JWT_SECRET||"development-only-change-me",{expiresIn:"5m"});return res.json({requiresTwoFactor:true,challengeToken});}const token=jwt.sign({sub:user._id.toString(),role:user.role,email:user.email},process.env.JWT_SECRET||"development-only-change-me",{expiresIn:"8h"});res.json({token,user:{email:user.email,username:user.username,role:user.role}})}catch(e){next(e)}};
exports.verifyTwoFactorLogin=async(req,res,next)=>{try{const jwtSecret=process.env.JWT_SECRET||"development-only-change-me";let challenge;try{challenge=jwt.verify(String(req.body.challengeToken||""),jwtSecret);}catch{return res.status(401).json({message:"Login challenge expired. Sign in again."});}if(challenge.purpose!=="2fa-login"||!challenge.sub)return res.status(401).json({message:"Invalid login challenge."});const user=await User.findById(challenge.sub).select("+twoFactorSecret");if(!user||user.role!=="admin"||!user.isActive||!user.twoFactorEnabled||!user.twoFactorSecret)return res.status(401).json({message:"Two-factor login is not available for this account."});const {verifyCode}=require("../utils/totp");if(!verifyCode(user.twoFactorSecret,req.body.code))return res.status(401).json({message:"Invalid authenticator code."});const token=jwt.sign({sub:user._id.toString(),role:user.role,email:user.email},jwtSecret,{expiresIn:"8h"});res.json({token,user:{email:user.email,username:user.username,role:user.role}})}catch(e){next(e)}};


// Public player registration. Admin privileges are never accepted from the client.
exports.register=async(req,res,next)=>{try{
 const username=String(req.body.username||"").trim(),email=String(req.body.email||"").trim().toLowerCase(),password=String(req.body.password||"");
 if(username.length<2) return res.status(400).json({message:"Name must contain at least 2 characters."});
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({message:"Enter a valid email address."});
 if(password.length<8) return res.status(400).json({message:"Password must be at least 8 characters."});
 const existing=await User.findOne({$or:[{email},{username}]}); if(existing) return res.status(409).json({message:"An account with that email or username already exists."});
 const passwordHash=await bcrypt.hash(password,12);
 await User.create({username,email,passwordHash,role:"player",isActive:true});
 res.status(201).json({message:"Account created successfully."});
 }catch(e){next(e)}};

// Safe generic response. Sending actual reset links requires SMTP/provider configuration.
exports.passwordResetRequest=async(req,res,next)=>{try{
 const email=String(req.body.email||"").trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({message:"Enter a valid email address."});
 res.json({message:"If an account exists for this email, reset instructions can be sent once email delivery is configured."});
 }catch(e){next(e)}};
