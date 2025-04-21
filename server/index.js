import express, { json } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import dbConnection from './db/dbConnect.js';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';

import authRoute from './routes/authRoute.js';
import userRoute from './routes/userRoute.js';
// import { emit } from 'process';

dotenv.config();

const app = express();
const server = createServer(app);

const allowedOrigins = [process.env.FRONTEND_URL];
console.log(allowedOrigins); 
app.use(cors({
    origin: function(origin, callback){
        if(!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else{
            callback(new Error('Not allowed by cors'));
        }
    },
    credentials: true,
    methods:['GET', 'POST', 'PUT', 'DELETE'],
}))

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth',authRoute)
app.use("/api/user", userRoute); 
app.get('/',(req, res)=>{
    res.json({ message: "Server is running!" });
})
app.get("/ok", (req, res) => {
    res.json({ message: "Server is running!" });
  });

const io = new Server(server,{
    pingTimeout : 300000,
    cors:{
        origin:allowedOrigins[0],
        methods:["POST","GET"],
    },
});
console.log("[SUCCESS] Socket.io initialized with CORS"); 

    let onlineUsers = [];
    const activeCalls = new Map();
io.on("connection",(socket) => {
    console.log(`[INFO] New connection : ${socket.id}`);

    socket.emit("me",socket.id);
   
    socket.on("join",(user)=>{
        if(!user ||!user.id){
            console.warn("[WARNING] Invalid user data on join");
            return;
        }
        socket.join(user.id);
        const existingUser = onlineUsers.find((u) => u.userId === user.id); // Check if user is already online

        if (existingUser) {
          existingUser.socketId = socket.id; // Update socket ID if user reconnects
        } else {
          // 🟢 Add new user to online users list
          onlineUsers.push({
            userId: user.id,
            name: user.name,
            socketId: socket.id,
          });
        }
    
        io.emit("online-users", onlineUsers);
    })

    socket.on("callToUser",(data)=>{
        const callee = onlineUsers.find((user)=> user.userId = data.callToUserId);
    
        if(!callee){
            socket.emit("userUnavailabe", {message: "user is offline"});
            return;
        }
    
        if(activeCalls.has(data.callToUserId)){
            socket.emit("userBusy", {message:'user is busy'});
    
            io.to(callee.socketId).emit("incomingCallWhileBusy",{
                from:data.from,
                name: data.name,
                email:data.email,
                profilepic: data.profilepic,
            });
            return;
        }
        io.to(callee.socketId).emit("callToUser",{
            signal: data.signal,
            from:data.from,
            email:data.email,
            name:data.name,
            profilepic:data.profilepic
        });
    });
    
    socket.on("answeredCall", (data)=>{
        io.to(data.to).emit("callAccecpted",{
            signal:data.signal,
            from:data.from
        })
        activeCalls.set(data.from, {with: data.to, socketId: socket.id});
        activeCalls.set(data.to, {with: data.from, socketId: data.to});
    })
    
    socket.on("rejected-call",(data)=>{
        io.to(data.to).emit("callRejected",{
            name: data.name,
            profilepic: data.profilepic,
        })
    })
    
    socket.on("call-ender",(data)=>{
        io.to(data.to).emit("callEnded",{
            name: data.name,
        })
        activeCalls.delete(data.from);
        activeCalls.delete(data.to);
    })
    
    socket.on("disconnect",()=>{
        const user = onlineUsers.find((u)=>u.socketId ===socket.id);
        if(user){
            activeCalls.delete(user.userId);
            
            for(const [key,value] of activeCalls.entries()){
                if(value.with === user.userId) activeCalls.delete(key);
            }
        }
        onlineUsers = onlineUsers.filter((user)=> user.socketId !== socket.id);
    
        io.emit("online",onlineUsers);
    
        socket.broadcast.emit("disconnectUser",{disUser: socket.id});
        console.log(`[INFO] Disconnected user ${socket.id}`);
    })
    
})


const PORT = process.env.PORT || 3000

(async ()=>{
    try {
        await dbConnection();
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
          });
    } catch (error) {
        console.error("❌ Failed to connect to the database:", error);
    process.exit(1);
    }
})();

