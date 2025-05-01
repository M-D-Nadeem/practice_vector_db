const express=require("express")
const practice = require("./practice")
require("dotenv").config()

const app=express()

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use("/practice",practice)

app.listen(5000, () => {
    console.log(`listening on *:${5000}`);
  });

  

