const router=require("express").Router(),c=require("../controllers/checkoutController");router.post("/",c.checkout);module.exports=router;
