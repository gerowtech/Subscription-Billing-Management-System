const router=require("express").Router(),c=require("../controllers/tierController");router.get("/",c.list);module.exports=router;
