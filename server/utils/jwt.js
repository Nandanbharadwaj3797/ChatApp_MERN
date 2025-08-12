import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRATION } from '../config/serverConfig.js';

export const generateToken = (userId) => jwt.sign(userId, JWT_SECRET, { expiresIn: JWT_EXPIRATION });