import User from '../models/User.js';
import Message from '../models/Message.js';
import cloudinary from "../config/cloudinary.js";
import { emitMessage, emitUserListRefresh } from '../utils/socket.js';

// Get all user except the logged in user
export const getUsersforSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get users with advanced filtering
    const filterUsers = await User.find({ 
      _id: { $ne: userId },
      isBanned: { $ne: true } // Don't show banned users
    }).select('-password');

    const unseenMessages = {};
    const promises = filterUsers.map(async (user) => {
      const unseenCount = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
        isDeleted: { $ne: true } // Don't count deleted messages
      });

      if (unseenCount.length > 0) {
        unseenMessages[user._id] = unseenCount.length;
      }
    });
    await Promise.all(promises);
    
    res.json({ success: true, users: filterUsers, unseenMessages });
  } catch (error) {
    console.error('Error fetching users for sidebar:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//get all message for selected user
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;
    
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId }
      ],
      isDeleted: { $ne: true } // Don't show deleted messages
    }).populate('replyTo', 'text image').populate('originalSender', 'fullName');
    
    await Message.updateMany(
      { senderId: selectedUserId, receiverId: myId, seen: false },
      { $set: { seen: true, seenAt: new Date() } }
    );
    
    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//api to mark message as seen using messageId
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedMessage = await Message.findByIdAndUpdate(id, { 
      seen: true, 
      seenAt: new Date() 
    }, { new: true });
    
    // ✅ Emit message seen status update via socket
    if (updatedMessage) {
      emitMessage(updatedMessage);
      // ✅ Also refresh user list to update unseen message counts
      emitUserListRefresh();
    }
    
    res.json({
      success: true,
      message: 'Message marked as seen'
    });
  } catch (error) {
    console.error('Error marking message as seen:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// send message to selected user
export const sendMessage = async (req, res) => {
  try {
    const { image, text, file, audio, video, location, contact, replyTo, forwardFrom } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let messageData = {
      senderId,
      receiverId,
      text,
      messageType: 'text'
    };

    // Handle different message types
    if (image) {
      const upload = await cloudinary.uploader.upload(image);
      messageData.image = upload.secure_url;
      messageData.messageType = 'image';
    }

    if (file) {
      const upload = await cloudinary.uploader.upload(file.data, {
        resource_type: 'auto',
        folder: 'chat-files'
      });
      messageData.file = {
        url: upload.secure_url,
        name: file.name,
        size: file.size,
        type: file.type
      };
      messageData.messageType = 'file';
    }

    if (audio) {
      const upload = await cloudinary.uploader.upload(audio, {
        resource_type: 'video',
        folder: 'chat-audio'
      });
      messageData.audio = {
        url: upload.secure_url,
        duration: audio.duration
      };
      messageData.messageType = 'audio';
    }

    if (video) {
      const upload = await cloudinary.uploader.upload(video.data, {
        resource_type: 'video',
        folder: 'chat-video'
      });
      messageData.video = {
        url: upload.secure_url,
        duration: video.duration,
        thumbnail: upload.thumbnail_url
      };
      messageData.messageType = 'video';
    }

    if (location) {
      messageData.location = location;
      messageData.messageType = 'location';
    }

    if (contact) {
      messageData.contact = contact;
      messageData.messageType = 'contact';
    }

    // Handle reply
    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    // Handle forward
    if (forwardFrom) {
      messageData.isForwarded = true;
      messageData.originalSender = forwardFrom;
    }

    const newMessage = await Message.create(messageData);

    // ✅ Emit the new message via socket utility for real-time updates
    emitMessage(newMessage);
    
    // ✅ Emit user list refresh to update sidebar with latest message preview
    emitUserListRefresh();

    res.json({
      success: true,
      message: 'Message sent successfully',
      newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Edit message
export const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }

    const updatedMessage = await Message.findByIdAndUpdate(id, {
      text,
      isEdited: true,
      editedAt: new Date()
    }, { new: true });

    emitMessage(updatedMessage);
    emitUserListRefresh();

    res.json({
      success: true,
      message: 'Message edited successfully',
      updatedMessage
    });
  } catch (error) {
    console.error('Error editing message:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    const deletedMessage = await Message.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date()
    }, { new: true });

    emitMessage(deletedMessage);
    emitUserListRefresh();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// React to message
export const reactToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(
      reaction => reaction.userId.toString() !== userId.toString()
    );

    // Add new reaction
    message.reactions.push({
      userId,
      emoji,
      reactedAt: new Date()
    });

    await message.save();

    emitMessage(message);
    emitUserListRefresh();

    res.json({
      success: true,
      message: 'Reaction added successfully',
      message
    });
  } catch (error) {
    console.error('Error adding reaction:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Reply to message
export const replyToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, image } = req.body;
    const userId = req.user._id;

    const originalMessage = await Message.findById(id);
    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: 'Original message not found'
      });
    }

    const receiverId = originalMessage.senderId.toString() === userId.toString() 
      ? originalMessage.receiverId 
      : originalMessage.senderId;

    let messageData = {
      senderId: userId,
      receiverId,
      text,
      replyTo: id,
      messageType: 'text'
    };

    if (image) {
      const upload = await cloudinary.uploader.upload(image);
      messageData.image = upload.secure_url;
      messageData.messageType = 'image';
    }

    const newMessage = await Message.create(messageData);

    emitMessage(newMessage);
    emitUserListRefresh();

    res.json({
      success: true,
      message: 'Reply sent successfully',
      newMessage
    });
  } catch (error) {
    console.error('Error sending reply:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Forward message
export const forwardMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { receiverId } = req.body;
    const userId = req.user._id;

    const originalMessage = await Message.findById(id);
    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: 'Original message not found'
      });
    }

    const messageData = {
      senderId: userId,
      receiverId,
      text: originalMessage.text,
      image: originalMessage.image,
      file: originalMessage.file,
      audio: originalMessage.audio,
      video: originalMessage.video,
      location: originalMessage.location,
      contact: originalMessage.contact,
      isForwarded: true,
      originalSender: originalMessage.senderId,
      messageType: originalMessage.messageType
    };

    const newMessage = await Message.create(messageData);

    emitMessage(newMessage);
    emitUserListRefresh();

    res.json({
      success: true,
      message: 'Message forwarded successfully',
      newMessage
    });
  } catch (error) {
    console.error('Error forwarding message:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Send file
export const sendFile = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const { file } = req.body;
    const senderId = req.user._id;

    const upload = await cloudinary.uploader.upload(file.data, {
      resource_type: 'auto',
      folder: 'chat-files'
    });

    const newMessage = await Message.create({
      senderId,
      receiverId,
      file: {
        url: upload.secure_url,
        name: file.name,
        size: file.size,
        type: file.type
      },
      messageType: 'file'
    });

    emitMessage(newMessage);
    emitUserListRefresh();

    res.json({
      success: true,
      message: 'File sent successfully',
      newMessage
    });
  } catch (error) {
    console.error('Error sending file:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Send audio
export const sendAudio = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const { audio } = req.body;
    const senderId = req.user._id;

    const upload = await cloudinary.uploader.upload(audio, {
      resource_type: 'video',
      folder: 'chat-audio'
    });

    const newMessage = await Message.create({
      senderId,
      receiverId,
      audio: {
        url: upload.secure_url,
        duration: audio.duration
      },
      messageType: 'audio'
    });

    emitMessage(newMessage);
    emitUserListRefresh();

    res.json({
      success: true,
      message: 'Audio sent successfully',
      newMessage
    });
  } catch (error) {
    console.error('Error sending audio:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Send video
export const sendVideo = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const { video } = req.body;
    const senderId = req.user._id;

    const upload = await cloudinary.uploader.upload(video.data, {
      resource_type: 'video',
      folder: 'chat-video'
    });

    const newMessage = await Message.create({
      senderId,
      receiverId,
      video: {
        url: upload.secure_url,
        duration: video.duration,
        thumbnail: upload.thumbnail_url
      },
      messageType: 'video'
    });

    emitMessage(newMessage);
    emitUserListRefresh();

    res.json({
      success: true,
      message: 'Video sent successfully',
      newMessage
    });
  } catch (error) {
    console.error('Error sending video:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Send location
export const sendLocation = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const { location } = req.body;
    const senderId = req.user._id;

    const newMessage = await Message.create({
      senderId,
      receiverId,
      location,
      messageType: 'location'
    });

    emitMessage(newMessage);
    emitUserListRefresh();

    res.json({
      success: true,
      message: 'Location sent successfully',
      newMessage
    });
  } catch (error) {
    console.error('Error sending location:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Send contact
export const sendContact = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const { contact } = req.body;
    const senderId = req.user._id;

    const newMessage = await Message.create({
      senderId,
      receiverId,
      contact,
      messageType: 'contact'
    });

    emitMessage(newMessage);
    emitUserListRefresh();

    res.json({
      success: true,
      message: 'Contact sent successfully',
      newMessage
    });
  } catch (error) {
    console.error('Error sending contact:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Search messages
export const searchMessages = async (req, res) => {
  try {
    const { query } = req.params;
    const userId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ],
      $and: [
        { isDeleted: { $ne: true } },
        {
          $or: [
            { text: { $regex: query, $options: 'i' } },
            { 'file.name': { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).populate('senderId', 'fullName profilePicture')
      .populate('receiverId', 'fullName profilePicture')
      .populate('replyTo', 'text image')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error searching messages:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get message statistics
export const getMessageStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own statistics'
      });
    }

    const totalMessages = await Message.countDocuments({
      $or: [
        { senderId: currentUserId },
        { receiverId: currentUserId }
      ],
      isDeleted: { $ne: true }
    });

    const sentMessages = await Message.countDocuments({
      senderId: currentUserId,
      isDeleted: { $ne: true }
    });

    const receivedMessages = await Message.countDocuments({
      receiverId: currentUserId,
      isDeleted: { $ne: true }
    });

    const unreadMessages = await Message.countDocuments({
      receiverId: currentUserId,
      seen: false,
      isDeleted: { $ne: true }
    });

    const messageTypes = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: currentUserId },
            { receiverId: currentUserId }
          ],
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: '$messageType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalMessages,
        sentMessages,
        receivedMessages,
        unreadMessages,
        messageTypes
      }
    });
  } catch (error) {
    console.error('Error getting message stats:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};