import React, { useState, useContext } from 'react'
import assets, { imagesDummyData } from '../assets/assets';
import { AuthContext } from '../context/AuthContext.jsx';
import { ChatContext } from '../context/ChatContext.jsx';
import toast from 'react-hot-toast';

const RightSidebar = ({ selectedUser }) => {
  const { authUser, axios } = useContext(AuthContext);
  const { getUsers } = useContext(ChatContext);
  const [isLoading, setIsLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');

  // Check if current user is admin
  const isAdmin = authUser?.isAdmin || false;

  // Check if user is blocked/muted/etc
  const isUserBlocked = authUser?.blockedUsers?.includes(selectedUser?._id);
  const isUserMuted = authUser?.mutedUsers?.includes(selectedUser?._id);
  const isUserPinned = authUser?.pinnedUsers?.includes(selectedUser?._id);
  const isUserArchived = authUser?.archivedUsers?.includes(selectedUser?._id);
  const isUserStarred = authUser?.starredUsers?.includes(selectedUser?._id);
  const isUserHidden = authUser?.hiddenUsers?.includes(selectedUser?._id);
  const isChatMuted = authUser?.mutedChats?.includes(selectedUser?._id);
  const isChatBlocked = authUser?.blockedChats?.includes(selectedUser?._id);

  // Handle user actions
  const handleUserAction = async (action, targetUserId) => {
    if (!targetUserId) return;
    
    setIsLoading(true);
    try {
      let endpoint = '';
      let method = 'PUT';
      
      switch (action) {
        case 'block':
          endpoint = `/api/auth/block/${targetUserId}`;
          break;
        case 'mute':
          endpoint = `/api/auth/mute/${targetUserId}`;
          break;
        case 'pin':
          endpoint = `/api/auth/pin/${targetUserId}`;
          break;
        case 'archive':
          endpoint = `/api/auth/archive/${targetUserId}`;
          break;
        case 'star':
          endpoint = `/api/auth/star/${targetUserId}`;
          break;
        case 'hide':
          endpoint = `/api/auth/hide/${targetUserId}`;
          break;
        case 'chatMute':
          endpoint = `/api/auth/chat/mute/${targetUserId}`;
          break;
        case 'chatBlock':
          endpoint = `/api/auth/chat/block/${targetUserId}`;
          break;
        case 'verify':
          endpoint = `/api/auth/verify/${targetUserId}`;
          break;
        case 'ban':
          endpoint = `/api/auth/ban/${targetUserId}`;
          break;
        default:
          return;
      }

      const { data } = await axios[method.toLowerCase()](endpoint);
      if (data.success) {
        toast.success(data.message);
        getUsers(); // Refresh user list
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || `Failed to ${action} user`;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user report
  const handleReportUser = async () => {
    if (!selectedUser?._id || !reportReason) return;
    
    setIsLoading(true);
    try {
      const { data } = await axios.post(`/api/auth/report/${selectedUser._id}`, {
        reason: reportReason,
        description: reportDescription
      });
      
      if (data.success) {
        toast.success('User reported successfully');
        setShowReportModal(false);
        setReportReason('');
        setReportDescription('');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to report user';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle chat report
  const handleReportChat = async () => {
    if (!selectedUser?._id || !reportReason) return;
    
    setIsLoading(true);
    try {
      const { data } = await axios.post(`/api/auth/chat/report/${selectedUser._id}`, {
        reason: reportReason,
        description: reportDescription
      });
      
      if (data.success) {
        toast.success('Chat reported successfully');
        setShowReportModal(false);
        setReportReason('');
        setReportDescription('');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to report chat';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedUser) return null;

  return (
    <div className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll ${selectedUser ? 'max-md:hidden' : ''}`}>
      {/* User Profile Section */}
      <div className='pt-16 flex flex-col items-center gap-2 text-xs font-light ma-auto'>
        <img src={selectedUser?.profilePic || assets.avatar_icon} alt="" className='w-20 aspect-[1/1] rounded-full' />
        <h1 className='px-10 text-xl font-medium mx-auto flex items-center gap-2'>
          <span className='w-2 h-2 rounded-full bg-green-500'></span>
          {selectedUser.fullName}
          {selectedUser.isVerified && (
            <span className='text-blue-400 text-sm'>✓</span>
          )}
        </h1>
        <p className='px-10 mx-auto text-center'>
          {selectedUser.bio || 'No bio available'}
        </p>
        
        {/* User Status Indicators */}
        <div className='flex flex-wrap gap-2 justify-center mt-2'>
          {selectedUser.isBanned && (
            <span className='bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs'>
              Banned
            </span>
          )}
          {selectedUser.isChatBanned && (
            <span className='bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs'>
              Chat Banned
            </span>
          )}
        </div>
      </div>

      <hr className='border-[#ffffff50] my-4' />

      {/* User Management Actions */}
      <div className='px-5 space-y-3'>
        <h3 className='text-sm font-medium'>User Management</h3>
        
        {/* Basic Actions */}
        <div className='grid grid-cols-2 gap-2'>
          <button
            onClick={() => handleUserAction('block', selectedUser._id)}
            disabled={isLoading}
            className={`p-2 rounded text-xs transition-colors ${
              isUserBlocked 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {isUserBlocked ? 'Unblock' : 'Block'}
          </button>
          
          <button
            onClick={() => handleUserAction('mute', selectedUser._id)}
            disabled={isLoading}
            className={`p-2 rounded text-xs transition-colors ${
              isUserMuted 
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {isUserMuted ? 'Unmute' : 'Mute'}
          </button>
          
          <button
            onClick={() => handleUserAction('pin', selectedUser._id)}
            disabled={isLoading}
            className={`p-2 rounded text-xs transition-colors ${
              isUserPinned 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {isUserPinned ? 'Unpin' : 'Pin'}
          </button>
          
          <button
            onClick={() => handleUserAction('archive', selectedUser._id)}
            disabled={isLoading}
            className={`p-2 rounded text-xs transition-colors ${
              isUserArchived 
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {isUserArchived ? 'Unarchive' : 'Archive'}
          </button>
          
          <button
            onClick={() => handleUserAction('star', selectedUser._id)}
            disabled={isLoading}
            className={`p-2 rounded text-xs transition-colors ${
              isUserStarred 
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {isUserStarred ? 'Unstar' : 'Star'}
          </button>
          
          <button
            onClick={() => handleUserAction('hide', selectedUser._id)}
            disabled={isLoading}
            className={`p-2 rounded text-xs transition-colors ${
              isUserHidden 
                ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {isUserHidden ? 'Unhide' : 'Hide'}
          </button>
        </div>

        {/* Chat Management */}
        <div className='space-y-2'>
          <h4 className='text-xs font-medium text-gray-300'>Chat Management</h4>
          <div className='grid grid-cols-2 gap-2'>
            <button
              onClick={() => handleUserAction('chatMute', selectedUser._id)}
              disabled={isLoading}
              className={`p-2 rounded text-xs transition-colors ${
                isChatMuted 
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {isChatMuted ? 'Unmute Chat' : 'Mute Chat'}
            </button>
            
            <button
              onClick={() => handleUserAction('chatBlock', selectedUser._id)}
              disabled={isLoading}
              className={`p-2 rounded text-xs transition-colors ${
                isChatBlocked 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {isChatBlocked ? 'Unblock Chat' : 'Block Chat'}
            </button>
          </div>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className='space-y-2'>
            <h4 className='text-xs font-medium text-gray-300'>Admin Actions</h4>
            <div className='grid grid-cols-2 gap-2'>
              <button
                onClick={() => handleUserAction('verify', selectedUser._id)}
                disabled={isLoading}
                className='p-2 rounded text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30'
              >
                {selectedUser.isVerified ? 'Unverify' : 'Verify'}
              </button>
              
              <button
                onClick={() => handleUserAction('ban', selectedUser._id)}
                disabled={isLoading}
                className='p-2 rounded text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
              >
                {selectedUser.isBanned ? 'Unban' : 'Ban'}
              </button>
            </div>
          </div>
        )}

        {/* Report Actions */}
        <div className='space-y-2'>
          <h4 className='text-xs font-medium text-gray-300'>Report Actions</h4>
          <div className='grid grid-cols-2 gap-2'>
            <button
              onClick={() => setShowReportModal(true)}
              disabled={isLoading}
              className='p-2 rounded text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
            >
              Report User
            </button>
            
            <button
              onClick={() => setShowReportModal(true)}
              disabled={isLoading}
              className='p-2 rounded text-xs bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30'
            >
              Report Chat
            </button>
          </div>
        </div>
      </div>

      <hr className='border-[#ffffff50] my-4' />

      {/* Media Section */}
      <div className='px-5 text-xs'>
        <p>Media</p>
        <div className='mt-2 max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-4 opacity-80'>
          {imagesDummyData.map((url, index) => (
            <div key={index} onClick={() => window.open(url)} className='cursor-pointer rounded'>
              <img src={url} alt="" className='h-full rounded-md' />
            </div>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      <button className='absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 to-violet-600 text-white border-none text-sm font-light py-2 px-20 rounded-full cursor-pointer'>
        Logout
      </button>

      {/* Report Modal */}
      {showReportModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-gray-800 p-6 rounded-lg w-96 max-w-[90vw]'>
            <h3 className='text-lg font-medium mb-4'>Report {selectedUser.fullName}</h3>
            
            <div className='space-y-3'>
              <div>
                <label className='block text-sm text-gray-300 mb-1'>Reason *</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className='w-full p-2 bg-gray-700 border border-gray-600 rounded text-white'
                >
                  <option value=''>Select a reason</option>
                  <option value='spam'>Spam</option>
                  <option value='harassment'>Harassment</option>
                  <option value='inappropriate'>Inappropriate Content</option>
                  <option value='fake'>Fake Profile</option>
                  <option value='other'>Other</option>
                </select>
              </div>
              
              <div>
                <label className='block text-sm text-gray-300 mb-1'>Description</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder='Provide additional details...'
                  rows={3}
                  className='w-full p-2 bg-gray-700 border border-gray-600 rounded text-white resize-none'
                />
              </div>
            </div>
            
            <div className='flex gap-2 mt-6'>
              <button
                onClick={() => setShowReportModal(false)}
                className='flex-1 p-2 bg-gray-600 hover:bg-gray-700 rounded text-white'
              >
                Cancel
              </button>
              <button
                onClick={handleReportUser}
                disabled={!reportReason || isLoading}
                className='flex-1 p-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded text-white'
              >
                {isLoading ? 'Reporting...' : 'Report User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RightSidebar