import express from 'express';
import { protectRoute } from '../middleware/authMiddleware.js';
import { 
  getMessages, 
  getUsersforSidebar, 
  markMessageAsSeen, 
  sendMessage,
  editMessage,
  deleteMessage,
  reactToMessage,
  replyToMessage,
  forwardMessage,
  sendFile,
  sendAudio,
  sendVideo,
  sendLocation,
  sendContact,
  searchMessages,
  getMessageStats
} from '../controllers/messageController.js';

const messageRouter = express.Router();

// Basic message routes
messageRouter.get('/users', protectRoute, getUsersforSidebar);
messageRouter.get('/:id', protectRoute, getMessages);
messageRouter.put('/mark/:id', protectRoute, markMessageAsSeen);
messageRouter.post('/send/:id', protectRoute, sendMessage);

// Advanced message features
messageRouter.put('/edit/:id', protectRoute, editMessage);
messageRouter.delete('/delete/:id', protectRoute, deleteMessage);
messageRouter.post('/react/:id', protectRoute, reactToMessage);
messageRouter.post('/reply/:id', protectRoute, replyToMessage);
messageRouter.post('/forward/:id', protectRoute, forwardMessage);

// Media message routes
messageRouter.post('/file/:id', protectRoute, sendFile);
messageRouter.post('/audio/:id', protectRoute, sendAudio);
messageRouter.post('/video/:id', protectRoute, sendVideo);
messageRouter.post('/location/:id', protectRoute, sendLocation);
messageRouter.post('/contact/:id', protectRoute, sendContact);

// Search and analytics
messageRouter.get('/search/:query', protectRoute, searchMessages);
messageRouter.get('/stats/:userId', protectRoute, getMessageStats);

export default messageRouter;