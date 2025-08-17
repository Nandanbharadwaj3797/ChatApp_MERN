import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/dbConfig.js';
import { PORT, CORS_ORIGIN } from './config/serverConfig.js';
import router from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io';
import { 
  setSocketInstance, 
  emitOnlineStatusUpdate, 
  emitTypingIndicator,
  emitUserUpdate,
  emitMessageUpdate,
  emitNotification
} from './utils/socket.js';

const app = express();
const server = http.createServer(app);

// Performance optimizations
app.set('trust proxy', 1);

// Allow CORS for frontend
app.use(cors({
  origin: CORS_ORIGIN === '*' ? 'http://localhost:5173' : CORS_ORIGIN,
  credentials: true
}));

// Middleware
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Performance monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`🐌 Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  next();
});

// Socket.IO setup with performance optimizations
export const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN === '*' ? 'http://localhost:5173' : CORS_ORIGIN,
    credentials: true
  },
  // Performance optimizations
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

export const userSocketMap = {};

// ✅ Set socket instances in utility file
setSocketInstance(io, userSocketMap);

// Optimize socket connection handling
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  console.log(`User connected: ${userId}`);

  if (userId) {
    userSocketMap[userId] = socket.id;
    
    // ✅ Use socket utility function for online status updates
    emitOnlineStatusUpdate();
    
    // ✅ Emit user status change to all users
    emitUserUpdate({ _id: userId }, 'userOnline');
    
    // ✅ Emit online users list to the newly connected user
    socket.emit('onlineUsers', Object.keys(userSocketMap));
  }

  // ✅ Handle typing indicators
  socket.on('typing', (data) => {
    const { receiverId, isTyping } = data;
    emitTypingIndicator(userId, receiverId, isTyping);
  });

  // ✅ Handle message reactions
  socket.on('messageReaction', (data) => {
    const { messageId, emoji } = data;
    // This will be handled by the message controller
    console.log('Message reaction:', { userId, messageId, emoji });
  });

  // ✅ Handle message editing
  socket.on('messageEdit', (data) => {
    const { messageId, newText } = data;
    // This will be handled by the message controller
    console.log('Message edit:', { userId, messageId, newText });
  });

  // ✅ Handle message deletion
  socket.on('messageDelete', (data) => {
    const { messageId } = data;
    // This will be handled by the message controller
    console.log('Message delete:', { userId, messageId });
  });

  // ✅ Handle user status updates
  socket.on('userStatusUpdate', (data) => {
    const { status, customStatus } = data;
    emitUserUpdate({ _id: userId, status, customStatus }, 'userStatusUpdate');
  });

  // ✅ Handle user away status
  socket.on('userAway', () => {
    emitUserUpdate({ _id: userId, status: 'away' }, 'userAway');
  });

  // ✅ Handle user busy status
  socket.on('userBusy', () => {
    emitUserUpdate({ _id: userId, status: 'busy' }, 'userBusy');
  });

  // ✅ Handle user custom status
  socket.on('customStatus', (data) => {
    const { customStatus } = data;
    emitUserUpdate({ _id: userId, customStatus }, 'customStatus');
  });

  // ✅ Handle user profile updates
  socket.on('profileUpdate', (data) => {
    emitUserUpdate({ _id: userId, ...data }, 'profileUpdate');
  });

  // ✅ Handle user block/unblock
  socket.on('userBlockToggle', (data) => {
    const { targetUserId, isBlocked } = data;
    emitUserUpdate({ 
      _id: userId, 
      targetUserId, 
      action: isBlocked ? 'blocked' : 'unblocked' 
    }, 'userBlockToggle');
  });

  // ✅ Handle user mute/unmute
  socket.on('userMuteToggle', (data) => {
    const { targetUserId, isMuted } = data;
    emitUserUpdate({ 
      _id: userId, 
      targetUserId, 
      action: isMuted ? 'muted' : 'unmuted' 
    }, 'userMuteToggle');
  });

  // ✅ Handle chat mute/unmute
  socket.on('chatMuteToggle', (data) => {
    const { targetUserId, isChatMuted } = data;
    emitUserUpdate({ 
      _id: userId, 
      targetUserId, 
      action: isChatMuted ? 'chatMuted' : 'chatUnmuted' 
    }, 'chatMuteToggle');
  });

  // ✅ Handle message search
  socket.on('searchMessages', (data) => {
    const { query } = data;
    // This will be handled by the message controller
    console.log('Message search:', { userId, query });
  });

  // ✅ Handle file upload progress
  socket.on('fileUploadProgress', (data) => {
    const { receiverId, progress, fileName } = data;
    emitNotification(receiverId, { 
      type: 'fileUploadProgress',
      senderId: userId, 
      progress, 
      fileName 
    });
  });

  // ✅ Handle voice call requests
  socket.on('voiceCallRequest', (data) => {
    const { receiverId } = data;
    emitNotification(receiverId, { 
      type: 'voiceCallRequest',
      callerId: userId,
      callerName: socket.handshake.query.userName || 'Unknown'
    });
  });

  // ✅ Handle voice call response
  socket.on('voiceCallResponse', (data) => {
    const { callerId, accepted, reason } = data;
    emitNotification(callerId, { 
      type: 'voiceCallResponse',
      receiverId: userId,
      accepted,
      reason
    });
  });

  // ✅ Handle voice call end
  socket.on('voiceCallEnd', (data) => {
    const { receiverId } = data;
    emitNotification(receiverId, { 
      type: 'voiceCallEnd',
      senderId: userId 
    });
  });

  // ✅ Handle video call requests
  socket.on('videoCallRequest', (data) => {
    const { receiverId } = data;
    emitNotification(receiverId, { 
      type: 'videoCallRequest',
      callerId: userId,
      callerName: socket.handshake.query.userName || 'Unknown'
    });
  });

  // ✅ Handle video call response
  socket.on('videoCallResponse', (data) => {
    const { callerId, accepted, reason } = data;
    emitNotification(callerId, { 
      type: 'videoCallResponse',
      receiverId: userId,
      accepted,
      reason
    });
  });

  // ✅ Handle video call end
  socket.on('videoCallEnd', (data) => {
    const { receiverId } = data;
    emitNotification(receiverId, { 
      type: 'videoCallEnd',
      senderId: userId 
    });
  });

  // ✅ Handle screen sharing
  socket.on('screenShareStart', (data) => {
    const { receiverId } = data;
    emitNotification(receiverId, { 
      type: 'screenShareStart',
      senderId: userId 
    });
  });

  socket.on('screenShareStop', (data) => {
    const { receiverId } = data;
    emitNotification(receiverId, { 
      type: 'screenShareStop',
      senderId: userId 
    });
  });

  // ✅ Handle user typing in group chats
  socket.on('groupTyping', (data) => {
    const { groupId, isTyping } = data;
    // Emit to all group members except the sender
    // This would need group management implementation
    console.log('Group typing:', { userId, groupId, isTyping });
  });

  // ✅ Handle user read receipts
  socket.on('markAsRead', (data) => {
    const { messageIds, senderId } = data;
    emitNotification(senderId, { 
      type: 'messagesRead',
      readerId: userId, 
      messageIds 
    });
  });

  // ✅ Handle user typing in channels
  socket.on('channelTyping', (data) => {
    const { channelId, isTyping } = data;
    // Emit to all channel members except the sender
    // This would need channel management implementation
    console.log('Channel typing:', { userId, channelId, isTyping });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
    if (userId) {
      delete userSocketMap[userId];
      
      // ✅ Use socket utility function for online status updates
      emitOnlineStatusUpdate();
      
      // ✅ Emit user offline status
      emitUserUpdate({ _id: userId }, 'userOffline');
    }
  });
});

// Test route
app.get('/ping', (req, res) => {
  return res.json({ message: 'pong' });
});

// Routes
app.use("/api/auth", router);
app.use("/api/messages", messageRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await connectDB();
});
