import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt.js';
import cloudinary from "../config/cloudinary.js";

export const signup=async (req, res) => {
  const { email, fullName, password, profilePicture, bio } = req.body;

  try {
    // Validate required fields
    if (!email || !fullName || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newuser=await User.create({
      email,
      fullName,
      password: hashedPassword,
      profilePicture,
      bio
    });
    const token = generateToken({ id: newuser._id });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return res.status(201).json({ message: 'User created successfully', user: newuser });

  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// controller to login a user
export const login = async (req, res) => {

  try {
    const { email, password } = req.body;
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken({ id: user._id });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const checkAuth = async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
}

export const updateProfile=async (req, res) => {
  try {
    const { fullName,profilePicture, bio } = req.body;
    const userId = req.user._id;
    let updateduser;
    if(!profilePicture){
      await User.findByIdAndUpdate(userId, { fullName, bio }, { new: true });

    }
    else{
      const upload= await cloudinary.uploader.upload(profilePicture);
      updateduser = await User.findByIdAndUpdate(userId, { profilePicture: upload.secure_url, bio, fullName }, { new: true });
    }
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updateduser
    })
  } 
  catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
    
  }
}