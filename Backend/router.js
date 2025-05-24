const express=require("express")
const practice = require("./practice")
const { default: upload } = require("./middleware/multerMiddleware")
const router=express.Router()

router.post("/practice",upload.array("files"),practice)

module.exports=router
