import express from 'express';
import { signup, login, checkAuth, updateProfile } from '../controllers/userController.js';
import { protectRoute } from '../middleware/authMiddleware.js';


const router = express.Router();


router.post('/signup', signup);
router.post('/login', login);
router.put('/profile', protectRoute, updateProfile);
router.get('/check', protectRoute, checkAuth);


export default router;