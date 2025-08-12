import express from 'express';
import { protectRoute } from '../middleware/authMiddleware.js';
import { getMessages, getUsersforSidebar, markMessageAsSeen, sendMessage } from '../controllers/messageController';

const messageRouter = express.Router();


messageRouter.get('/users',protectRoute,getUsersforSidebar);

messageRouter.get('/:id',protectRoute,getMessages);

messageRouter.put('/mark/:id',protectRoute,markMessageAsSeen);

messageRouter.post('/send/:id',protectRoute,sendMessage);


export default messageRouter;