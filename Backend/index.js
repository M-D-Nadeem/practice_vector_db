const express=require("express")
const practice = require("./practice")
const cors=require("cors")
const router = require("./router")
require("dotenv").config()

const app=express()

app.use(express.json({ limit: "50mb" }))
// app.use(cookieParser()) 
app.use(express.urlencoded({ limit: "50mb", extended: true }))
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))
app.use("/",router)

app.listen(5000, () => {
    console.log(`listening on *:${5000}`);
  });

  

