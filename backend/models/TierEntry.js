const mongoose=require("mongoose");
const schema=new mongoose.Schema({username:{type:String,required:true},points:{type:Number,default:0},rank:{type:String,default:"Unranked"},mode:{type:String,enum:["smp","pvp"],required:true},season:{type:String,default:"1"},queue:{type:String,enum:["solo","team"],required:true},teamName:{type:String,default:null}},{timestamps:true});
schema.index({mode:1,season:1,queue:1,points:-1});module.exports=mongoose.model("TierEntry",schema);
