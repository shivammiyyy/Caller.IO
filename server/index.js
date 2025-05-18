import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import dbConnection from './db/dbConnect.js';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';

import authRoute from './routes/authRoute.js';
import userRoute from './routes/userRoute.js';

dotenv.config();

const app = express();
const server = createServer(app);

// Define allowed origins; add your front-end URL and localhost for development

const FE = process.env.FRONTEND_URL;
if (!FE) {
  console.error('[ERROR] FRONTEND_URL not defined');
  process.exit(1);
}
const allowedOrigins = [FE, 'http://localhost:3000'];

// Express CORS configuration
const defineAllowed = (origin, callback) => {
  console.log('[DEBUG] Incoming Origin:', origin);
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, false);
  } else {
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  }
};
app.use(cors({
  origin: defineAllowed,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);

app.get('/', (req, res) => res.json({ message: 'Server is running!' }));
// app.get('/*', (req, res) => res.json({ message: 'Noting' }));

// Socket.io with CORS
const io = new Server(server, {
  pingTimeout: 300000,
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

console.log('[SUCCESS] Socket.io initialized with CORS');

let onlineUsers = [];
const activeCalls = new Map();

io.on('connection', (socket) => {
  console.log(`[INFO] New connection: ${socket.id}`);

  socket.emit('me', socket.id);

  socket.on('join', (user) => {
    if (!user || !user.id) {
      console.warn('[WARNING] Invalid user data on join');
      return;
    }
    socket.join(user.id);
    const existing = onlineUsers.find((u) => u.userId === user.id);
    if (existing) {
      existing.socketId = socket.id;
    } else {
      onlineUsers.push({ userId: user.id, name: user.name, socketId: socket.id });
    }
    io.emit('online-users', onlineUsers);
  });

  socket.on('callToUser', (data) => {
    const callee = onlineUsers.find((u) => u.userId === data.callToUserId);
    if (!callee) {
      socket.emit('userUnavailable', { message: 'User is offline' });
      return;
    }
    if (activeCalls.has(data.callToUserId)) {
      socket.emit('userBusy', { message: 'User is busy' });
      io.to(callee.socketId).emit('incomingCallWhileBusy', {
        from: data.from,
        name: data.name,
        email: data.email,
        profilepic: data.profilepic,
      });
      return;
    }
    io.to(callee.socketId).emit('callToUser', {
      signal: data.signal,
      from: data.from,
      email: data.email,
      name: data.name,
      profilepic: data.profilepic,
    });
  });

  socket.on('answeredCall', (data) => {
    io.to(data.to).emit('callAccepted', {
      signal: data.signal,
      from: data.from,
    });
    activeCalls.set(data.from, { with: data.to, socketId: socket.id });
    activeCalls.set(data.to, { with: data.from, socketId: data.to });
  });

  socket.on('rejectedCall', (data) => {
    io.to(data.to).emit('callRejected', {
      name: data.name,
      profilepic: data.profilepic,
    });
  });

  socket.on('callEnded', (data) => {
    io.to(data.to).emit('callEnded', { name: data.name });
    activeCalls.delete(data.from);
    activeCalls.delete(data.to);
  });

  socket.on('disconnect', () => {
    const user = onlineUsers.find((u) => u.socketId === socket.id);
    if (user) {
      activeCalls.delete(user.userId);
      for (const [key, value] of activeCalls) {
        if (value.with === user.userId) activeCalls.delete(key);
      }
    }
    onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
    io.emit('online-users', onlineUsers);
    socket.broadcast.emit('disconnectUser', { disUser: socket.id });
    console.log(`[INFO] Disconnected user ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await dbConnection();
    server.listen(PORT, () => console.log(`[SUCCESS] Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Failed to connect to DB:', err);
    process.exit(1);
  }
})();
