import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/serverConfig.js';

export const protectRoute = async (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id).select('-password -__v');
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    console.error('Error in protectRoute middleware:', error.message);
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
};
