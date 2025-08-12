import User from '../models/User.js';
import Message from '../models/Message.js';
import cloudinary from "../config/cloudinary.js";

import{io,userSocketMap} from '../server.js'; 

// Get all user except the logged in user

export const getUsersforSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const filterUsers= await User.find({ _id: { $ne: userId } }).select('-password');

    const unseenMessages ={}
    const promises= filterUsers.map(async (user) => {
      const unseenCount = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false
      });

      if(unseenCount.length>0){
        unseenMessages[user._id] = unseenCount.length;
      }
    });
    await Promise.all(promises);
    res.json({ success: true, users: filterUsers, unseenMessages });
  } catch (error) {
    console.error('Error fetching users for sidebar:', error.Message);
    return res.json({
        success: false,
        msessage:error.message
    })
  }
}



//get all message for selected user

export const getMessages = async (req, res) => {
    try{
        const{id:selectedUserId} = req.params;
        const myId = req.user._id;
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId }
            ]
        })
        await Message.updateMany(
            { senderId: selectedUserId, receiverId: myId, seen: false },
            { $set: { seen: true } }
        );
        res.json({
            success: true,
            messages
        })
    }
    catch(error){
        console.error('Error fetching messages:', error.Message);
        return res.json({
            success: false,
            msessage:error.message
        })      
    }
}

//api to mark message as seen using messageId
export const markMessageAsSeen = async (req, res) => {
    try {
        const {id}= req.params;
        await Message.findByIdAndUpdate(id, { seen: true });
        res.json({
            success: true,
            message: 'Message marked as seen'
        })
    } catch (error) {
        console.error('Error marking message as seen:', error.Message);
        return res.json({
            success: false,
            msessage:error.message
        })  
    }
}


// send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const { image, text } = req.body;
        const receiverId  = req.params;
        const senderId = req.user._id;

        let imageurl;
        if(image){
            const upload = await cloudinary.uploader.upload(image);
            imageurl = upload.secure_url
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageurl
        });
        
        // Emit the new message to the receiver's socket

        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', newMessage);
        }

        res.json({
            success: true,
            message: 'Message sent successfully',
            newMessage
        })
    } catch (error) {
        console.error('Error sending message:', error.Message);
        return res.json({
            success: false,
            msessage:error.message
        })  
    }
}