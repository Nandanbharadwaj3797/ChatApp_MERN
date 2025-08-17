// Socket utility functions to avoid circular imports
let ioInstance = null;
let userSocketMapInstance = {};

export const setSocketInstance = (io, userSocketMap) => {
  ioInstance = io;
  userSocketMapInstance = userSocketMap;
};

export const getSocketInstance = () => ioInstance;
export const getUserSocketMap = () => userSocketMapInstance;

export const emitMessage = (message) => {
  if (!ioInstance) return;
  
  const { senderId, receiverId } = message;
  
  // Emit to receiver for real-time updates
  const receiverSocketId = userSocketMapInstance[receiverId];
  if (receiverSocketId) {
    ioInstance.to(receiverSocketId).emit('message', message);
  }
  
  // Emit to sender to ensure immediate update
  const senderSocketId = userSocketMapInstance[senderId];
  if (senderSocketId) {
    ioInstance.to(senderSocketId).emit('message', message);
  }
};

// ✅ Emit user list refresh event
export const emitUserListRefresh = () => {
  if (!ioInstance) return;
  
  // Emit to all connected users to refresh their user list
  ioInstance.emit('refreshUserList');
};

// ✅ Emit online status update
export const emitOnlineStatusUpdate = () => {
  if (!ioInstance) return;
  
  // Emit updated online users list to all connected users
  const onlineUserIds = Object.keys(userSocketMapInstance);
  console.log('Emitting online users:', onlineUserIds);
  ioInstance.emit('onlineUsers', onlineUserIds);
};

// ✅ Emit user update events
export const emitUserUpdate = (userData, eventType = 'userUpdate') => {
  if (!ioInstance) return;
  
  // Emit to all connected users
  ioInstance.emit(eventType, userData);
  
  // Also emit a general user update event
  ioInstance.emit('userUpdate', { userData, eventType });
};

// ✅ Emit message update events
export const emitMessageUpdate = (messageData, eventType = 'messageUpdate') => {
  if (!ioInstance) return;
  
  const { senderId, receiverId } = messageData;
  
  // Emit to both sender and receiver
  const receiverSocketId = userSocketMapInstance[receiverId];
  if (receiverSocketId) {
    ioInstance.to(receiverSocketId).emit(eventType, messageData);
  }
  
  const senderSocketId = userSocketMapInstance[senderId];
  if (senderSocketId) {
    ioInstance.to(senderSocketId).emit(eventType, messageData);
  }
};

// ✅ Emit typing indicator
export const emitTypingIndicator = (senderId, receiverId, isTyping) => {
  if (!ioInstance) return;
  
  const receiverSocketId = userSocketMapInstance[receiverId];
  if (receiverSocketId) {
    ioInstance.to(receiverSocketId).emit('userTyping', { 
      userId: senderId, 
      isTyping 
    });
  }
};

// ✅ Emit message reaction
export const emitMessageReaction = (messageData) => {
  if (!ioInstance) return;
  
  emitMessageUpdate(messageData, 'messageReaction');
};

// ✅ Emit message edit
export const emitMessageEdit = (messageData) => {
  if (!ioInstance) return;
  
  emitMessageUpdate(messageData, 'messageEdit');
};

// ✅ Emit message delete
export const emitMessageDelete = (messageData) => {
  if (!ioInstance) return;
  
  emitMessageUpdate(messageData, 'messageDelete');
};

// ✅ Emit user status change
export const emitUserStatusChange = (userId, status) => {
  if (!ioInstance) return;
  
  ioInstance.emit('userStatusChange', { userId, status });
};

// ✅ Emit notification
export const emitNotification = (userId, notification) => {
  if (!ioInstance) return;
  
  const userSocketId = userSocketMapInstance[userId];
  if (userSocketId) {
    ioInstance.to(userSocketId).emit('notification', notification);
  }
};

// ✅ Emit to specific user
export const emitToUser = (userId, event, data) => {
  if (!ioInstance) return;
  
  const userSocketId = userSocketMapInstance[userId];
  if (userSocketId) {
    ioInstance.to(userSocketId).emit(event, data);
  }
};

// ✅ Emit to multiple users
export const emitToUsers = (userIds, event, data) => {
  if (!ioInstance) return;
  
  userIds.forEach(userId => {
    emitToUser(userId, event, data);
  });
};

// ✅ Emit to all users except specified ones
export const emitToAllExcept = (excludeUserIds, event, data) => {
  if (!ioInstance) return;
  
  const allUserIds = Object.keys(userSocketMapInstance);
  const targetUserIds = allUserIds.filter(id => !excludeUserIds.includes(id));
  
  emitToUsers(targetUserIds, event, data);
};
