import dotenv from 'dotenv';

dotenv.config();

export const MONGODB_URI = process.env.MONGODB_URI;
export const PORT = process.env.PORT || 3000;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Validate required environment variables
if (!MONGODB_URI) {
  console.error('MONGODB_URI is required in environment variables');
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error('JWT_SECRET is required in environment variables');
  process.exit(1);
}