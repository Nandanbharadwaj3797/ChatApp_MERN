import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt.js';
import cloudinary from "../config/cloudinary.js";
import { emitMessage } from '../utils/socket.js';

// Function to emit user update events
export const emitUserUpdate = (userData, eventType = 'userUpdate') => {
  // This will be used when users are created, updated, or deleted
  // For now, we'll use the existing emitMessage function as a template
  console.log(`User ${eventType}:`, userData);
};

export const signup = async (req, res) => {
  const { email, fullName, password, profilePicture, bio } = req.body;

  try {
    if (!email || !fullName || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let profilePicUrl = profilePicture;
    if (profilePicture && !profilePicture.startsWith('http')) {
      const upload = await cloudinary.uploader.upload(profilePicture);
      profilePicUrl = upload.secure_url;
    }

    const newUser = await User.create({
      email: email.toLowerCase(),
      fullName,
      password: hashedPassword,
      profilePicture: profilePicUrl,
      bio
    });

    const token = generateToken({ id: newUser._id });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // Remove password before sending response
    const { password: _, ...userData } = newUser.toObject();

    // ✅ Emit new user event via socket
    emitUserUpdate(userData, 'userCreated');

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      userData,
      token
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken({ id: user._id });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    const { password: _, ...userData } = user.toObject();

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      userData,
      token
    });

  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const checkAuth = async (req, res) => {
  const { password, ...userData } = req.user.toObject();
  res.json({
    success: true,
    user: userData,
  });
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, profilePicture, bio } = req.body;
    const userId = req.user._id;

    let updateData = {};

    if (fullName) updateData.fullName = fullName;
    if (bio) updateData.bio = bio;

    if (profilePicture) {
      if (profilePicture.startsWith('http')) {
        updateData.profilePicture = profilePicture;
      } else {
        const upload = await cloudinary.uploader.upload(profilePicture);
        updateData.profilePicture = upload.secure_url;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    // ✅ Emit user update event via socket
    emitUserUpdate(updatedUser, 'profileUpdated');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Delete user function with socket emission
export const deleteUser = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Emit user deletion event before deleting
    emitUserUpdate({ _id: userId }, 'userDeleted');
    
    await User.findByIdAndDelete(userId);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Block/unblock user function with socket emission
export const toggleBlockUser = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const isBlocked = user.blockedUsers?.includes(targetUserId);
    
    if (isBlocked) {
      // Unblock user
      user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== targetUserId);
    } else {
      // Block user
      if (!user.blockedUsers) user.blockedUsers = [];
      user.blockedUsers.push(targetUserId);
    }
    
    await user.save();
    
    // ✅ Emit user block/unblock event via socket
    emitUserUpdate(user, isBlocked ? 'userUnblocked' : 'userBlocked');
    
    res.json({
      success: true,
      message: `User ${isBlocked ? 'unblocked' : 'blocked'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error toggling user block:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Mute/unmute user function with socket emission
export const toggleMuteUser = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const isMuted = user.mutedUsers?.includes(targetUserId);
    
    if (isMuted) {
      // Unmute user
      user.mutedUsers = user.mutedUsers.filter(id => id.toString() !== targetUserId);
    } else {
      // Mute user
      if (!user.mutedUsers) user.mutedUsers = [];
      user.mutedUsers.push(targetUserId);
    }
    
    await user.save();
    
    // ✅ Emit user mute/unmute event via socket
    emitUserUpdate(user, isMuted ? 'userUnmuted' : 'userMuted');
    
    res.json({
      success: true,
      message: `User ${isMuted ? 'unmuted' : 'muted'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error toggling user mute:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Pin/unpin user function with socket emission
export const togglePinUser = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const isPinned = user.pinnedUsers?.includes(targetUserId);
    
    if (isPinned) {
      // Unpin user
      user.pinnedUsers = user.pinnedUsers.filter(id => id.toString() !== targetUserId);
    } else {
      // Pin user
      if (!user.pinnedUsers) user.pinnedUsers = [];
      user.pinnedUsers.push(targetUserId);
    }
    
    await user.save();
    
    // ✅ Emit user pin/unpin event via socket
    emitUserUpdate(user, isPinned ? 'userUnpinned' : 'userPinned');
    
    res.json({
      success: true,
      message: `User ${isPinned ? 'unpinned' : 'pinned'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error toggling user pin:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Archive/unarchive user function with socket emission
export const toggleArchiveUser = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const isArchived = user.archivedUsers?.includes(targetUserId);
    
    if (isArchived) {
      // Unarchive user
      user.archivedUsers = user.archivedUsers.filter(id => id.toString() !== targetUserId);
    } else {
      // Archive user
      if (!user.archivedUsers) user.archivedUsers = [];
      user.archivedUsers.push(targetUserId);
    }
    
    await user.save();
    
    // ✅ Emit user archive/unarchive event via socket
    emitUserUpdate(user, isArchived ? 'userUnarchived' : 'userArchived');
    
    res.json({
      success: true,
      message: `User ${isArchived ? 'unarchived' : 'archived'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error toggling user archive:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Star/unstar user function with socket emission
export const toggleStarUser = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const isStarred = user.starredUsers?.includes(targetUserId);
    
    if (isStarred) {
      // Unstar user
      user.starredUsers = user.starredUsers.filter(id => id.toString() !== targetUserId);
    } else {
      // Star user
      if (!user.starredUsers) user.starredUsers = [];
      user.starredUsers.push(targetUserId);
    }
    
    await user.save();
    
    // ✅ Emit user star/unstar event via socket
    emitUserUpdate(user, isStarred ? 'userUnstarred' : 'userStarred');
    
    res.json({
      success: true,
      message: `User ${isStarred ? 'unstarred' : 'starred'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error toggling user star:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Hide/unhide user function with socket emission
export const toggleHideUser = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const isHidden = user.hiddenUsers?.includes(targetUserId);
    
    if (isHidden) {
      // Unhide user
      user.hiddenUsers = user.hiddenUsers.filter(id => id.toString() !== targetUserId);
    } else {
      // Hide user
      if (!user.hiddenUsers) user.hiddenUsers = [];
      user.hiddenUsers.push(targetUserId);
    }
    
    await user.save();
    
    // ✅ Emit user hide/unhide event via socket
    emitUserUpdate(user, isHidden ? 'userUnhidden' : 'userHidden');
    
    res.json({
      success: true,
      message: `User ${isHidden ? 'unhidden' : 'hidden'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error toggling user hide:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Report user function with socket emission
export const reportUser = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const { reason, description } = req.body;
    const userId = req.user._id;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required for reporting'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Add report to user's reports array
    if (!user.reports) user.reports = [];
    user.reports.push({
      reportedUserId: targetUserId,
      reason,
      description,
      reportedAt: new Date()
    });
    
    await user.save();
    
    // ✅ Emit user report event via socket
    emitUserUpdate(user, 'userReported');
    
    res.json({
      success: true,
      message: 'User reported successfully',
      user
    });
  } catch (error) {
    console.error('Error reporting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Verify/unverify user function with socket emission (admin only)
export const toggleVerifyUser = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    
    // Check if current user is admin
    const currentUser = await User.findById(userId);
    if (!currentUser || !currentUser.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }
    
    // Toggle verification status
    targetUser.isVerified = !targetUser.isVerified;
    await targetUser.save();
    
    // ✅ Emit user verification event via socket
    emitUserUpdate(targetUser, targetUser.isVerified ? 'userVerified' : 'userUnverified');
    
    res.json({
      success: true,
      message: `User ${targetUser.isVerified ? 'verified' : 'unverified'} successfully`,
      user: targetUser
    });
  } catch (error) {
    console.error('Error toggling user verification:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Ban/unban user function with socket emission (admin only)
export const toggleBanUser = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;
    
    // Check if current user is admin
    const currentUser = await User.findById(userId);
    if (!currentUser || !currentUser.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }
    
    // Toggle ban status
    const wasBanned = targetUser.isBanned;
    targetUser.isBanned = !targetUser.isBanned;
    
    if (targetUser.isBanned) {
      targetUser.banReason = reason || 'No reason provided';
      targetUser.bannedAt = new Date();
      targetUser.bannedBy = userId;
    } else {
      targetUser.banReason = undefined;
      targetUser.bannedAt = undefined;
      targetUser.bannedBy = undefined;
    }
    
    await targetUser.save();
    
    // ✅ Emit user ban/unban event via socket
    emitUserUpdate(targetUser, targetUser.isBanned ? 'userBanned' : 'userUnbanned');
    
    res.json({
      success: true,
      message: `User ${targetUser.isBanned ? 'banned' : 'unbanned'} successfully`,
      user: targetUser
    });
  } catch (error) {
    console.error('Error toggling user ban:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Mute/unmute chat function with socket emission
export const toggleMuteChat = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const isChatMuted = user.mutedChats?.includes(targetUserId);
    
    if (isChatMuted) {
      // Unmute chat
      user.mutedChats = user.mutedChats.filter(id => id.toString() !== targetUserId);
    } else {
      // Mute chat
      if (!user.mutedChats) user.mutedChats = [];
      user.mutedChats.push(targetUserId);
    }
    
    await user.save();
    
    // ✅ Emit chat mute/unmute event via socket
    emitUserUpdate(user, isChatMuted ? 'chatUnmuted' : 'chatMuted');
    
    res.json({
      success: true,
      message: `Chat ${isChatMuted ? 'unmuted' : 'muted'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error toggling chat mute:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Block/unblock chat function with socket emission
export const toggleBlockChat = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const isChatBlocked = user.blockedChats?.includes(targetUserId);
    
    if (isChatBlocked) {
      // Unblock chat
      user.blockedChats = user.blockedChats.filter(id => id.toString() !== targetUserId);
    } else {
      // Block chat
      if (!user.blockedChats) user.blockedChats = [];
      user.blockedChats.push(targetUserId);
    }
    
    await user.save();
    
    // ✅ Emit chat block/unblock event via socket
    emitUserUpdate(user, isChatBlocked ? 'chatUnblocked' : 'chatBlocked');
    
    res.json({
      success: true,
      message: `Chat ${isChatBlocked ? 'unblocked' : 'blocked'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error toggling chat block:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Pin/unpin chat function with socket emission
export const togglePinChat = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const isChatPinned = user.pinnedChats?.includes(targetUserId);
    
    if (isChatPinned) {
      // Unpin chat
      user.pinnedChats = user.pinnedChats.filter(id => id.toString() !== targetUserId);
    } else {
      // Pin chat
      if (!user.pinnedChats) user.pinnedChats = [];
      user.pinnedChats.push(targetUserId);
    }
    
    await user.save();
    
    // ✅ Emit chat pin/unpin event via socket
    emitUserUpdate(user, isChatPinned ? 'chatUnpinned' : 'chatPinned');
    
    res.json({
      success: true,
      message: `Chat ${isChatPinned ? 'unpinned' : 'pinned'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error toggling chat pin:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Archive/unarchive chat function with socket emission
export const toggleArchiveChat = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const isChatArchived = user.archivedChats?.includes(targetUserId);
    
    if (isChatArchived) {
      // Unarchive chat
      user.archivedChats = user.archivedChats.filter(id => id.toString() !== targetUserId);
    } else {
      // Archive chat
      if (!user.archivedChats) user.archivedChats = [];
      user.archivedChats.push(targetUserId);
    }
    
    await user.save();
    
    // ✅ Emit chat archive/unarchive event via socket
    emitUserUpdate(user, isChatArchived ? 'chatUnarchived' : 'chatArchived');
    
    res.json({
      success: true,
      message: `Chat ${isChatArchived ? 'unarchived' : 'archived'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error toggling chat archive:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Star/unstar chat function with socket emission
export const toggleStarChat = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const isChatStarred = user.starredChats?.includes(targetUserId);
    
    if (isChatStarred) {
      // Unstar chat
      user.starredChats = user.starredChats.filter(id => id.toString() !== targetUserId);
    } else {
      // Star chat
      if (!user.starredChats) user.starredChats = [];
      user.starredChats.push(targetUserId);
    }
    
    await user.save();
    
    // ✅ Emit chat star/unstar event via socket
    emitUserUpdate(user, isChatStarred ? 'chatUnstarred' : 'chatStarred');
    
    res.json({
      success: true,
      message: `Chat ${isChatStarred ? 'unstarred' : 'starred'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error toggling chat star:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Hide/unhide chat function with socket emission
export const toggleHideChat = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const isChatHidden = user.hiddenChats?.includes(targetUserId);
    
    if (isChatHidden) {
      // Unhide chat
      user.hiddenChats = user.hiddenChats.filter(id => id.toString() !== targetUserId);
    } else {
      // Hide chat
      if (!user.hiddenChats) user.hiddenChats = [];
      user.hiddenChats.push(targetUserId);
    }
    
    await user.save();
    
    // ✅ Emit chat hide/unhide event via socket
    emitUserUpdate(user, isChatHidden ? 'chatUnhidden' : 'chatHidden');
    
    res.json({
      success: true,
      message: `Chat ${isChatHidden ? 'unhidden' : 'hidden'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error toggling chat hide:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Report chat function with socket emission
export const reportChat = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const { reason, description } = req.body;
    const userId = req.user._id;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required for reporting chat'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Add chat report to user's chatReports array
    if (!user.chatReports) user.chatReports = [];
    user.chatReports.push({
      reportedUserId: targetUserId,
      reason,
      description,
      reportedAt: new Date()
    });
    
    await user.save();
    
    // ✅ Emit chat report event via socket
    emitUserUpdate(user, 'chatReported');
    
    res.json({
      success: true,
      message: 'Chat reported successfully',
      user
    });
  } catch (error) {
    console.error('Error reporting chat:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Verify/unverify chat function with socket emission (admin only)
export const toggleVerifyChat = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    
    // Check if current user is admin
    const currentUser = await User.findById(userId);
    if (!currentUser || !currentUser.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }
    
    // Toggle chat verification status
    targetUser.isChatVerified = !targetUser.isChatVerified;
    await targetUser.save();
    
    // ✅ Emit chat verification event via socket
    emitUserUpdate(targetUser, targetUser.isChatVerified ? 'chatVerified' : 'chatUnverified');
    
    res.json({
      success: true,
      message: `Chat ${targetUser.isChatVerified ? 'verified' : 'unverified'} successfully`,
      user: targetUser
    });
  } catch (error) {
    console.error('Error toggling chat verification:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Ban/unban chat function with socket emission (admin only)
export const toggleBanChat = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;
    
    // Check if current user is admin
    const currentUser = await User.findById(userId);
    if (!currentUser || !currentUser.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }
    
    // Toggle chat ban status
    const wasChatBanned = targetUser.isChatBanned;
    targetUser.isChatBanned = !targetUser.isChatBanned;
    
    if (targetUser.isChatBanned) {
      targetUser.chatBanReason = reason || 'No reason provided';
      targetUser.chatBannedAt = new Date();
      targetUser.chatBannedBy = userId;
    } else {
      targetUser.chatBanReason = undefined;
      targetUser.chatBannedAt = undefined;
      targetUser.chatBannedBy = undefined;
    }
    
    await targetUser.save();
    
    // ✅ Emit chat ban/unban event via socket
    emitUserUpdate(targetUser, targetUser.isChatBanned ? 'chatBanned' : 'chatUnbanned');
    
    res.json({
      success: true,
      message: `Chat ${targetUser.isChatBanned ? 'banned' : 'unbanned'} successfully`,
      user: targetUser
    });
  } catch (error) {
    console.error('Error toggling chat ban:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Mute/unmute voice function with socket emission
export const toggleMuteVoice = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const isVoiceMuted = user.mutedVoiceUsers?.includes(targetUserId);
    
    if (isVoiceMuted) {
      // Unmute voice
      user.mutedVoiceUsers = user.mutedVoiceUsers.filter(id => id.toString() !== targetUserId);
    } else {
      // Mute voice
      if (!user.mutedVoiceUsers) user.mutedVoiceUsers = [];
      user.mutedVoiceUsers.push(targetUserId);
    }
    
    await user.save();
    
    // ✅ Emit voice mute/unmute event via socket
    emitUserUpdate(user, isVoiceMuted ? 'voiceUnmuted' : 'voiceMuted');
    
    res.json({
      success: true,
      message: `Voice ${isVoiceMuted ? 'unmuted' : 'muted'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error toggling voice mute:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Block/unblock voice function with socket emission
export const toggleBlockVoice = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const isVoiceBlocked = user.blockedVoiceUsers?.includes(targetUserId);
    
    if (isVoiceBlocked) {
      // Unblock voice
      user.blockedVoiceUsers = user.blockedVoiceUsers.filter(id => id.toString() !== targetUserId);
    } else {
      // Block voice
      if (!user.blockedVoiceUsers) user.blockedVoiceUsers = [];
      user.blockedVoiceUsers.push(targetUserId);
    }
    
    await user.save();
    
    // ✅ Emit voice block/unblock event via socket
    emitUserUpdate(user, isVoiceBlocked ? 'voiceUnblocked' : 'voiceBlocked');
    
    res.json({
      success: true,
      message: `Voice ${isVoiceBlocked ? 'unblocked' : 'blocked'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error toggling voice block:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
