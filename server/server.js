import express from'express';
import connectDB from './config/dbConfig.js';
import { PORT } from './config/serverConfig.js'; // Importing PORT from serverConfig.js



const app=express();// create express app server instance



app.use(express.json());// middleware to parse json data
app.use(express.text());
app.use(express.urlencoded());

app.get('/ping',(req,res)=>{
    console.log(req.query);
    console.log(req.body);
    console.log(req.user);
    return res.json({message:'pong'});
});




app.listen(PORT,async()=>{
    console.log(`server is running on port ${PORT}`);
    await connectDB();
});