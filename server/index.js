import express from "express"
import mongoose from "mongoose"
import bodyParser from "body-parser"
import dotenv from "dotenv"

const app = express();
app.use(bodyParser.json());
dotenv.config();

const PORT = process.env.PORT||7000;
const MONGOURL = process.env.MONGO_URL;

mongoose
        .connect(MONGOURL)
        .then(()=>{
            console.log("Database Connected Sucessfully")
            app.listen(PORT,()=>{
                console.log(`server is running on port :${PORT}`)
            });
        })
        .catch((error)=>console.log('error') );