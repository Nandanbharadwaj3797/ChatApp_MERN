import React, { useMemo, useCallback, useRef, useEffect, useState, useContext } from 'react'
import assets from '../assets/assets'
import { formateMessageTime } from '../lib/utils'
import { ChatContext } from '../context/ChatContext.jsx'
import { AuthContext } from '../context/AuthContext.jsx'
import toast from 'react-hot-toast'
import axios from 'axios'

const ChatContainer = React.memo(({ selectedUser: propSelectedUser }) => {

  const { messages, selectedUser: contextSelectedUser, setSelectedUser, sendMessage, getMessages } = useContext(ChatContext);
  const { authUser, onlineUsers, socket } = useContext(AuthContext);
  
  // Use prop if provided, otherwise use context
  const selectedUser = propSelectedUser || contextSelectedUser;

  const scrollEnd = useRef(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [forwardToUser, setForwardToUser] = useState(null);
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ Restore selected user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("selectedUser");
    if (savedUser && !selectedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && parsedUser._id) {
          setSelectedUser(parsedUser);
        } else {
          localStorage.removeItem("selectedUser");
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem("selectedUser");
      }
    }
  }, []); // Only run once on mount

  // ✅ Whenever selectedUser changes, store in localStorage and fetch messages
  useEffect(() => {
    if (selectedUser && selectedUser._id) {
      localStorage.setItem("selectedUser", JSON.stringify(selectedUser));
      getMessages(selectedUser._id); // fetch messages for selected user
    }
  }, [selectedUser?._id, getMessages]); // Only depend on the ID and getMessages function

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollEnd.current && messages.length > 0) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Check if selected user is online
  const isUserOnline = useMemo(() => {
    return selectedUser ? onlineUsers.includes(selectedUser._id) : false;
  }, [selectedUser, onlineUsers]);

  // Function to add notification
  const addNotification = useCallback((message) => {
    const notification = {
      id: Date.now(),
      message: message.text || 'New message received',
      sender: message.senderName || 'Someone',
      timestamp: new Date(),
      type: 'message'
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  // Function to remove notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Function to send text message
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (input.trim() === '') return null;
    
    const messageData = { text: input.trim() };
    
    // Add reply data if replying
    if (replyToMessage) {
      messageData.replyTo = replyToMessage._id;
    }
    
    try {
      await sendMessage(messageData);
      setInput('');
      setReplyToMessage(null); // Clear reply
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  }, [input, sendMessage, replyToMessage]);

  // Function to handle typing indicator
  const handleTyping = useCallback((e) => {
    setInput(e.target.value);
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to stop typing indicator
    const newTimeout = setTimeout(() => {
      setIsTyping(false);
      // Emit typing stopped event via socket
      if (socket && selectedUser) {
        socket.emit('typing', { receiverId: selectedUser._id, isTyping: false });
      }
    }, 1000);
    
    setTypingTimeout(newTimeout);
    
    // Emit typing event via socket only if not already typing
    if (socket && selectedUser && !isTyping) {
      socket.emit('typing', { receiverId: selectedUser._id, isTyping: true });
      setIsTyping(true);
    }
  }, [typingTimeout, isTyping, socket, selectedUser]);

  // Function to send image
  const handleSendImage = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const messageData = { image: reader.result };
      if (replyToMessage) {
        messageData.replyTo = replyToMessage._id;
      }
      await sendMessage(messageData);
      e.target.value = ''; // Reset the input field
      setReplyToMessage(null);
    };
    reader.readAsDataURL(file);
  }, [sendMessage, replyToMessage]);

  // Function to send file
  const handleSendFile = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size should be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const messageData = { 
        file: {
          data: reader.result,
          name: file.name,
          size: file.size,
          type: file.type
        }
      };
      if (replyToMessage) {
        messageData.replyTo = replyToMessage._id;
      }
      await sendMessage(messageData);
      e.target.value = '';
      setReplyToMessage(null);
    };
    reader.readAsDataURL(file);
  }, [sendMessage, replyToMessage]);

  // Function to send audio
  const handleSendAudio = useCallback(async (audioBlob) => {
    try {
      const messageData = { 
        audio: {
          data: audioBlob,
          duration: 0 // You can calculate actual duration if needed
        }
      };
      if (replyToMessage) {
        messageData.replyTo = replyToMessage._id;
      }
      await sendMessage(messageData);
      setReplyToMessage(null);
    } catch (error) {
      toast.error('Failed to send audio message');
    }
  }, [sendMessage, replyToMessage]);

  // Function to send video
  const handleSendVideo = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video size should be less than 50MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const messageData = { 
        video: {
          data: reader.result,
          duration: 0 // You can calculate actual duration if needed
        }
      };
      if (replyToMessage) {
        messageData.replyTo = replyToMessage._id;
      }
      await sendMessage(messageData);
      e.target.value = '';
      setReplyToMessage(null);
    };
    reader.readAsDataURL(file);
  }, [sendMessage, replyToMessage]);

  // Function to send location
  const handleSendLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const messageData = { 
        location: {
          latitude,
          longitude,
          address: 'Current location' // You can reverse geocode this
        }
      };
      if (replyToMessage) {
        messageData.replyTo = replyToMessage._id;
      }
      await sendMessage(messageData);
      setReplyToMessage(null);
    }, () => {
      toast.error('Unable to retrieve your location');
    });
  }, [sendMessage, replyToMessage]);

  // Function to send contact
  const handleSendContact = useCallback(async (contactData) => {
    const messageData = { contact: contactData };
    if (replyToMessage) {
      messageData.replyTo = replyToMessage._id;
    }
    await sendMessage(messageData);
    setReplyToMessage(null);
  }, [sendMessage, replyToMessage]);

  // Function to edit message
  const handleEditMessage = useCallback(async (messageId, newText) => {
    try {
      const { data } = await axios.put(`/api/messages/edit/${messageId}`, { text: newText });
      if (data.success) {
        toast.success('Message edited successfully');
        setEditingMessage(null);
        getMessages(selectedUser._id);
      }
    } catch (error) {
      toast.error('Failed to edit message');
    }
  }, [selectedUser, getMessages]);

  // Function to delete message
  const handleDeleteMessage = useCallback(async (messageId) => {
    try {
      const { data } = await axios.delete(`/api/messages/delete/${messageId}`);
      if (data.success) {
        toast.success('Message deleted successfully');
        getMessages(selectedUser._id);
      }
    } catch (error) {
      toast.error('Failed to delete message');
    }
  }, [selectedUser, getMessages]);

  // Function to react to message
  const handleReactToMessage = useCallback(async (messageId, emoji) => {
    try {
      const { data } = await axios.post(`/api/messages/react/${messageId}`, { emoji });
      if (data.success) {
        toast.success('Reaction added');
        getMessages(selectedUser._id);
      }
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  }, [selectedUser, getMessages]);

  // Function to reply to message
  const handleReplyToMessage = useCallback((message) => {
    setReplyToMessage(message);
    setEditingMessage(null);
    setForwardToUser(null);
  }, []);

  // Function to forward message
  const handleForwardMessage = useCallback(async (message, targetUserId) => {
    try {
      const { data } = await axios.post(`/api/messages/forward/${message._id}`, { receiverId: targetUserId });
      if (data.success) {
        toast.success('Message forwarded successfully');
        setForwardToUser(null);
      }
    } catch (error) {
      toast.error('Failed to forward message');
    }
  }, []);

  // Function to search messages
  const handleSearchMessages = useCallback(async (query) => {
    if (!query.trim()) return;
    
    try {
      const { data } = await axios.get(`/api/messages/search/${query}`);
      if (data.success) {
        // Handle search results - you can display them in a modal or separate section
        console.log('Search results:', data.messages);
      }
    } catch (error) {
      toast.error('Failed to search messages');
    }
  }, []);

  // Show only chat between logged-in user and selected user
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => msg.senderId === authUser._id || msg.senderId === selectedUser?._id);
  }, [messages, authUser._id, selectedUser?._id]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);



  return selectedUser ? (
    <div className='h-full overflow-scroll relative backdrop-blur-lg'>
      {/*-------- Header---------- */}
      <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
        <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 rounded-full' />
        <p className='flex-1 text-lg text-white flex items-center gap-2'>
          {selectedUser.fullName}
          {isUserOnline && <span className='w-2 h-2 rounded-full bg-green-500'></span>}
        </p>
        <img onClick={() => { setSelectedUser(null); localStorage.removeItem("selectedUser"); }} src={assets.menu_icon} alt="" className='md:hidden max-w-7' />
        <img src={assets.help_icon} alt="" className='md:hidden max-w-5' />
      </div>

      {/*-------- Search Bar---------- */}
      <div className='px-4 py-2'>
        <div className='relative'>
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchMessages(searchQuery)}
            className='w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-white/40'
          />
          <button
            onClick={() => handleSearchMessages(searchQuery)}
            className='absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300'
          >
            🔍
          </button>
        </div>
      </div>

      {/*-------- Reply Preview---------- */}
      {replyToMessage && (
        <div className='px-4 py-2 bg-blue-500/20 border-l-4 border-blue-500'>
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              <p className='text-xs text-blue-300'>Replying to {replyToMessage.senderId === authUser._id ? 'yourself' : selectedUser.fullName}</p>
              <p className='text-sm text-white truncate'>
                {replyToMessage.text || 'Image sent'}
              </p>
            </div>
            <button
              onClick={() => setReplyToMessage(null)}
              className='text-blue-300 hover:text-white text-lg'
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/*-------- Notifications---------- */}
      {notifications.length > 0 && (
        <div className='px-4 py-2 space-y-2'>
          {notifications.map(notification => (
            <div 
              key={notification.id}
              className='bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-white text-sm'
            >
              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-medium'>{notification.sender}</p>
                  <p className='text-gray-300'>{notification.message}</p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className='text-gray-400 hover:text-white text-lg'
                >
                  ×
                </button>
              </div>
              <p className='text-xs text-gray-400 mt-1'>
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/*-------- Chat Messages------ */}
      <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
        {filteredMessages.map((msg, index) => (
          <div key={`${msg._id || index}-${msg.createdAt}`} className={`flex items-end gap-2 justify-end  ${msg.senderId !== authUser._id && 'flex-row-reverse'}`}>
            {/* Reply Preview */}
            {msg.replyTo && (
              <div className={`max-w-[200px] bg-gray-600/30 rounded p-2 mb-2 text-xs ${msg.senderId === authUser._id ? 'mr-2' : 'ml-2'}`}>
                <p className='text-gray-400'>Replying to {msg.replyTo.text || 'Image sent'}</p>
              </div>
            )}

            {/* Message Content */}
            <div className='relative group'>
              {msg.image ? (
                <img src={msg.image} alt="" className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8' loading="lazy" />
              ) : msg.file ? (
                <div className='max-w-[230px] bg-gray-700/50 border border-gray-600 rounded-lg p-3 mb-8'>
                  <div className='flex items-center gap-2'>
                    <span className='text-2xl'>📎</span>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium truncate'>{msg.file.name}</p>
                      <p className='text-xs text-gray-400'>{(msg.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                </div>
              ) : msg.audio ? (
                <div className='max-w-[230px] bg-gray-700/50 border border-gray-600 rounded-lg p-3 mb-8'>
                  <div className='flex items-center gap-2'>
                    <span className='text-2xl'>🎵</span>
                    <div>
                      <p className='text-sm'>Audio Message</p>
                      <p className='text-xs text-gray-400'>{msg.audio.duration}s</p>
                    </div>
                  </div>
                </div>
              ) : msg.video ? (
                <div className='max-w-[230px] bg-gray-700/50 border border-gray-600 rounded-lg p-3 mb-8'>
                  <div className='flex items-center gap-2'>
                    <span className='text-2xl'>🎥</span>
                    <div>
                      <p className='text-sm'>Video Message</p>
                      <p className='text-xs text-gray-400'>{msg.video.duration}s</p>
                    </div>
                  </div>
                </div>
              ) : msg.location ? (
                <div className='max-w-[230px] bg-gray-700/50 border border-gray-600 rounded-lg p-3 mb-8'>
                  <div className='flex items-center gap-2'>
                    <span className='text-2xl'>📍</span>
                    <div>
                      <p className='text-sm'>Location</p>
                      <p className='text-xs text-gray-400'>{msg.location.address}</p>
                    </div>
                  </div>
                </div>
              ) : msg.contact ? (
                <div className='max-w-[230px] bg-gray-700/50 border border-gray-600 rounded-lg p-3 mb-8'>
                  <div className='flex items-center gap-2'>
                    <span className='text-2xl'>👤</span>
                    <div>
                      <p className='text-sm font-medium'>{msg.contact.name}</p>
                      <p className='text-xs text-gray-400'>{msg.contact.phone}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${msg.senderId === authUser._id ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                  {msg.text}
                  {msg.isEdited && <span className='text-xs text-gray-400 ml-2'>(edited)</span>}
                </p>
              )}

              {/* Message Actions Menu */}
              <div className={`absolute top-0 ${msg.senderId === authUser._id ? 'left-0' : 'right-0'} transform -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 rounded-lg shadow-lg p-1 z-10`}>
                <button
                  onClick={() => handleReplyToMessage(msg)}
                  className='block w-full text-left px-3 py-1 text-sm text-white hover:bg-gray-700 rounded'
                >
                  Reply
                </button>
                <button
                  onClick={() => setForwardToUser(msg)}
                  className='block w-full text-left px-3 py-1 text-sm text-white hover:bg-gray-700 rounded'
                >
                  Forward
                </button>
                {msg.senderId === authUser._id && (
                  <>
                    <button
                      onClick={() => setEditingMessage(msg)}
                      className='block w-full text-left px-3 py-1 text-sm text-white hover:bg-gray-700 rounded'
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(msg._id)}
                      className='block w-full text-left px-3 py-1 text-sm text-white hover:bg-gray-700 rounded text-red-400'
                    >
                      Delete
                    </button>
                  </>
                )}
                <div className='border-t border-gray-600 my-1'></div>
                <div className='flex gap-1 px-3 py-1'>
                  {['👍', '❤️', '😄', '😮', '😢', '😡'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleReactToMessage(msg._id, emoji)}
                      className='text-lg hover:scale-110 transition-transform'
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className='text-center text-xs'>
              <img src={msg.senderId === authUser._id ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.arrow_icon} alt="" className='w-7 rounded-full' />
              <p className='text-gray-500'>{formateMessageTime(msg.createdAt)}</p>
            </div>
          </div>
        ))}
        
        {/* ✅ Typing indicator */}
        {isTyping && (
          <div className='flex items-end gap-2 justify-start flex-row-reverse'>
            <div className='text-center text-xs'>
              <img src={selectedUser?.profilePic || assets.avatar_icon} alt="" className='w-7 rounded-full' />
            </div>
            <div className='flex items-center gap-1 p-2 bg-violet-500/30 rounded-lg mb-8'>
              <div className='flex gap-1'>
                <div className='w-2 h-2 bg-white rounded-full animate-bounce' style={{ animationDelay: '0ms' }}></div>
                <div className='w-2 h-2 bg-white rounded-full animate-bounce' style={{ animationDelay: '150ms' }}></div>
                <div className='w-2 h-2 bg-white rounded-full animate-bounce' style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={scrollEnd}> </div>
      </div>

      {/*-------- Bottom area------ */}
      <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
        <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
          <input
            onChange={handleTyping}
            value={input}
            onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null}
            type="text"
            placeholder='Send a message'
            className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400'
          />
          
          {/* Media Inputs */}
          <input onChange={handleSendImage} type="file" id='image' accept='image/png, image/jpeg' hidden />
          <input onChange={handleSendFile} type="file" id='file' hidden />
          <input onChange={handleSendVideo} type="file" id='video' accept='video/*' hidden />
          
          <label htmlFor="image" className='cursor-pointer mr-2'>
            <img src={assets.gallery_icon} alt="" className='w-5' />
          </label>
          
          <label htmlFor="file" className='cursor-pointer mr-2'>
            📎
          </label>
          
          <label htmlFor="video" className='cursor-pointer mr-2'>
            🎥
          </label>
          
          <button onClick={handleSendLocation} className='mr-2 text-xl'>
            📍
          </button>
          
          <button onClick={() => {/* Open contact picker */}} className='mr-2 text-xl'>
            👤
          </button>
        </div>
        <img onClick={handleSendMessage} src={assets.send_button} alt="" className='w-7 cursor-pointer' />
      </div>

      {/*-------- Edit Message Modal---------- */}
      {editingMessage && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-gray-800 p-6 rounded-lg w-96 max-w-[90vw]'>
            <h3 className='text-lg font-medium mb-4'>Edit Message</h3>
            <textarea
              value={editingMessage.text}
              onChange={(e) => setEditingMessage({...editingMessage, text: e.target.value})}
              className='w-full p-3 bg-gray-700 border border-gray-600 rounded text-white resize-none'
              rows={3}
            />
            <div className='flex gap-2 mt-4'>
              <button
                onClick={() => setEditingMessage(null)}
                className='flex-1 p-2 bg-gray-600 hover:bg-gray-700 rounded text-white'
              >
                Cancel
              </button>
              <button
                onClick={() => handleEditMessage(editingMessage._id, editingMessage.text)}
                className='flex-1 p-2 bg-blue-600 hover:bg-blue-700 rounded text-white'
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/*-------- Forward Message Modal---------- */}
      {forwardToUser && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-gray-800 p-6 rounded-lg w-96 max-w-[90vw]'>
            <h3 className='text-lg font-medium mb-4'>Forward Message</h3>
            <p className='text-gray-300 mb-4'>Select a user to forward to:</p>
            {/* User list would go here - you can implement this based on your user list */}
            <div className='flex gap-2 mt-4'>
              <button
                onClick={() => setForwardToUser(null)}
                className='flex-1 p-2 bg-gray-600 hover:bg-gray-700 rounded text-white'
              >
                Cancel
              </button>
              <button
                onClick={() => {/* Handle forward */}}
                className='flex-1 p-2 bg-blue-600 hover:bg-blue-700 rounded text-white'
              >
                Forward
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
      <img src={assets.logo_icon} className='max-w-16' alt="" />
      <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
    </div>
  )
});

ChatContainer.displayName = 'ChatContainer';

export default ChatContainer;
