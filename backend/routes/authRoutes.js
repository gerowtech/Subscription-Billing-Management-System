const router=require("express").Router(),c=require("../controllers/authController"),rateLimit=require("express-rate-limit");
router.post("/login",rateLimit({windowMs:900000,limit:10}),c.login);
router.post("/verify-2fa-login",rateLimit({windowMs:900000,limit:10}),c.verifyTwoFactorLogin);
router.post("/register",rateLimit({windowMs:900000,limit:5}),c.register);
router.post("/password-reset-request",rateLimit({windowMs:900000,limit:5}),c.passwordResetRequest);
module.exports=router;
