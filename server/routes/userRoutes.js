import express from 'express';
import { 
  signup, 
  login, 
  checkAuth, 
  updateProfile, 
  deleteUser,
  toggleBlockUser,
  toggleMuteUser,
  togglePinUser,
  toggleArchiveUser,
  toggleStarUser,
  toggleHideUser,
  reportUser,
  toggleVerifyUser,
  toggleBanUser,
  toggleMuteChat,
  toggleBlockChat,
  togglePinChat,
  toggleArchiveChat,
  toggleStarChat,
  toggleHideChat,
  reportChat,
  toggleVerifyChat,
  toggleBanChat,
  toggleMuteVoice,
  toggleBlockVoice
} from '../controllers/userController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

// Authentication routes
router.post('/signup', signup);
router.post('/login', login);
router.get('/check', protectRoute, checkAuth);

// Profile management
router.put('/update-profile', protectRoute, updateProfile);
router.delete('/delete', protectRoute, deleteUser);

// User relationship management
router.put('/block/:targetUserId', protectRoute, toggleBlockUser);
router.put('/mute/:targetUserId', protectRoute, toggleMuteUser);
router.put('/pin/:targetUserId', protectRoute, togglePinUser);
router.put('/archive/:targetUserId', protectRoute, toggleArchiveUser);
router.put('/star/:targetUserId', protectRoute, toggleStarUser);
router.put('/hide/:targetUserId', protectRoute, toggleHideUser);
router.post('/report/:targetUserId', protectRoute, reportUser);

// Chat management
router.put('/chat/mute/:targetUserId', protectRoute, toggleMuteChat);
router.put('/chat/block/:targetUserId', protectRoute, toggleBlockChat);
router.put('/chat/pin/:targetUserId', protectRoute, togglePinChat);
router.put('/chat/archive/:targetUserId', protectRoute, toggleArchiveChat);
router.put('/chat/star/:targetUserId', protectRoute, toggleStarChat);
router.put('/chat/hide/:targetUserId', protectRoute, toggleHideChat);
router.post('/chat/report/:targetUserId', protectRoute, reportChat);

// Voice management
router.put('/voice/mute/:targetUserId', protectRoute, toggleMuteVoice);
router.put('/voice/block/:targetUserId', protectRoute, toggleBlockVoice);

// Admin functions
router.put('/verify/:targetUserId', protectRoute, toggleVerifyUser);
router.put('/ban/:targetUserId', protectRoute, toggleBanUser);
router.put('/chat/verify/:targetUserId', protectRoute, toggleVerifyChat);
router.put('/chat/ban/:targetUserId', protectRoute, toggleBanChat);

export default router;