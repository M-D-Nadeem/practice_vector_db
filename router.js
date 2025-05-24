const express=require("express")
const practice = require("./practice")
const router=express.Router()

router.post("/practice",practice)

module.exports=router
