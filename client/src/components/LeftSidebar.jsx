import React, { useContext, useMemo } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../context/ChatContext.jsx'
import { AuthContext } from '../context/AuthContext.jsx'

const LeftSidebar = ({ onUserSelect }) => {
  const { users, selectedUser, setSelectedUser, unSeenMessages } = useContext(ChatContext);
  const { authUser, onlineUsers } = useContext(AuthContext);

  // ✅ Get the latest message for each user to show preview
  const usersWithLatestMessage = useMemo(() => {
    return users.map(user => {
      // Find the latest message for this user
      const latestMessage = user.latestMessage || null;
      const unreadCount = unSeenMessages[user._id] || 0;
      
      return {
        ...user,
        latestMessage,
        unreadCount
      };
    });
  }, [users, unSeenMessages]);

  return (
    <div className='w-80 max-md:w-full h-full bg-white/10 backdrop-blur-lg border-r border-white/20'>
      {/* Header */}
      <div className='p-4 border-b border-white/20'>
        <div className='flex items-center gap-3'>
          <img src={authUser?.profilePic || assets.avatar_icon} alt="" className='w-10 h-10 rounded-full' />
          <div>
            <h2 className='text-white font-semibold'>{authUser?.fullName || 'User'}</h2>
            <p className='text-gray-300 text-sm'>Online</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className='p-4'>
        <div className='relative'>
          <img src={assets.search_icon} alt="" className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4' />
          <input
            type="text"
            placeholder='Search users...'
            className='w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-white/40'
          />
        </div>
      </div>

      {/* Users List */}
      <div className='flex-1 overflow-y-auto'>
        {usersWithLatestMessage.map((user) => (
          <div
            key={user._id}
            onClick={() => {
              setSelectedUser(user);
              if (onUserSelect) {
                onUserSelect(user);
              }
            }}
            className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-white/10 transition-colors ${
              selectedUser?._id === user._id ? 'bg-white/20' : ''
            }`}
          >
            <div className='relative'>
              <img src={user.profilePic || assets.avatar_icon} alt="" className='w-12 h-12 rounded-full' />
              {/* ✅ Online indicator */}
              {onlineUsers.includes(user._id) && (
                <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white'></div>
              )}
              {/* ✅ Unread message counter */}
              {user.unreadCount > 0 && (
                <div className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold'>
                  {user.unreadCount > 99 ? '99+' : user.unreadCount}
                </div>
              )}
            </div>
            
            <div className='flex-1 min-w-0'>
              <div className='flex items-center justify-between'>
                <h3 className='text-white font-medium truncate'>{user.fullName}</h3>
                {user.latestMessage && (
                  <span className='text-xs text-gray-400'>
                    {new Date(user.latestMessage.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                )}
              </div>
              
              {/* ✅ Latest message preview */}
              {user.latestMessage ? (
                <p className='text-gray-300 text-sm truncate'>
                  {user.latestMessage.text || 'Image sent'}
                </p>
              ) : (
                <p className='text-gray-400 text-sm'>No messages yet</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LeftSidebar
