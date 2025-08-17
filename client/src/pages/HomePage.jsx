import React, { useState, useCallback } from 'react'
import LeftSidebar from '../components/LeftSidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'

const Homepage = React.memo(() => {
  const [selectedUser, setSelectedUser] = useState(null);
  
  const handleUserSelection = useCallback((user) => {
    setSelectedUser(user);
  }, []);

  return (
    <div className='border w-full h-screen sm:px-[15%] sm:py-[5%]'>
        <div className={`backdrop-blur-xl border-2 border-gray-600 rounded-2xl overflow-hidden h-[100%] grid grid-cols-1 relative ${selectedUser ? 'md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]':'md:grid-cols-2'}`}>
          <LeftSidebar onUserSelect={handleUserSelection}/>
          <ChatContainer selectedUser={selectedUser} />
          <RightSidebar selectedUser={selectedUser} setSelectedUser={handleUserSelection}/>
        </div>
    </div>
  )
});

Homepage.displayName = 'Homepage';

export default Homepage