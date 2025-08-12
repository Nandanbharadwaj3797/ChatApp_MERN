import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// middleware to protect routes

export const protectRoute=async (req, res, next) => {
  try {
    const token = req.cookies.token|| req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }
    // Verify token
    const decoded = await jwt.verify(token, process.env.JWT_SECRET); 

   const user= await User.findById(decoded.id).select('-password -__v');
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }
    req.user = user; // Attach user to request object
    next(); // Proceed to the next middleware or route handler

  } catch (error) {
    console.error('Error in protectRoute middleware:', error);
    return res.status(401).json({ message: 'Unauthorized access', error: error.message });
  }
}

// 