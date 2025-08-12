import express from'express';
import connectDB from './config/dbConfig.js';
import { PORT } from './config/serverConfig.js'; // Importing PORT from serverConfig.js
import router from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io';


const app=express();// create express app server instance
const server=http.createServer(app);// create http server instance

// initialize socket io server
export const io = new Server(server, {
  cors: {
    origin: '*'
  },
});

// store online user
export const userSocketMap ={}; // To store user socket connections

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId; // Get userId from query params
    console.log(`User connected: ${userId}`);

    if(userId) {
        userSocketMap[userId] = socket.id; // Store the socket ID for the user
    }
    // Emit online users to all clients
    io.emit('onlineUsers', Object.keys(userSocketMap));

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId}`);
        delete userSocketMap[userId]; // Remove the socket ID when user disconnects
        // Emit updated online users to all clients
        io.emit('onlineUsers', Object.keys(userSocketMap));
    });


});

app.use(express.json());// middleware to parse json data
app.use(express.text());
app.use(express.urlencoded());

app.get('/ping',(req,res)=>{
    console.log(req.query);
    console.log(req.body);
    console.log(req.user);
    return res.json({message:'pong'});
});

app.use("/api/auth",router)
app.use("/api/messages",messageRouter);




app.listen(PORT,async()=>{
    console.log(`server is running on port ${PORT}`);
    await connectDB();
});