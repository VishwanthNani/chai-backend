import express from "express"
import dotenv from "dotenv"
import connectDB from "./db/connect.js"

dotenv.config()


connectDB()



const app=express()


app.on("error",(error)=>{
    console.log("ERROR:",error);
    throw error
})

app.listen(process.env.PORT,()=>{
    console.log(`App is listening on port ${process.env.PORT}`);
})

