import React, { useEffect, useCallback, useContext } from 'react';
import { AuthContext } from './AuthContext.jsx';
import toast from 'react-hot-toast';

// eslint-disable-next-line react-refresh/only-export-components
export const ChatContext = React.createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = React.useState([]);
    const [users, setUsers] = React.useState([]);
    const [selectedUser, setSelectedUser] = React.useState(null);
    const [unSeenMessages, setUnSeenMessages] = React.useState({});

    const { socket, axios, authUser } = useContext(AuthContext);

    // ✅ Restore selectedUser from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem("selectedUser");
        if (savedUser) {
            setSelectedUser(JSON.parse(savedUser));
        }
    }, []);

    // function to get all users for sidebar
    const getUsers = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/messages/users');
            if (data.success) {
                setUsers(data.users);
                setUnSeenMessages(data.unseenMessages);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to fetch users';
            toast.error(errorMessage);
        }
    }, [axios]);

    // function to get messages for selected user
    const getMessages = useCallback(async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to fetch messages';
            toast.error(errorMessage);
        }
    }, [axios]);

    // function to send message to selected user
    const sendMessage = useCallback(async (message) => {
        if (!selectedUser?._id) {
            toast.error('No user selected');
            return;
        }
        
        try {
            console.log('Sending message to:', selectedUser._id, 'Message:', message);
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, message);
            if (data.success) {
                // Add the message immediately to sender's view for instant feedback
                const newMessage = data.newMessage || data.message;
                console.log('Message sent successfully, adding to local state:', newMessage);
                setMessages((prevMessages) => {
                    console.log('Previous messages count:', prevMessages.length);
                    const updatedMessages = [...prevMessages, newMessage];
                    console.log('Updated messages count:', updatedMessages.length);
                    return updatedMessages;
                });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to send message';
            toast.error(errorMessage);
            throw error; // Re-throw to let the caller handle it
        }
    }, [axios, selectedUser?._id]);

    // function to subscribe to new messages via socket
    const subscribeToMessage = useCallback(() => {
        if (!socket) return;

        socket.on('message', (message) => {
            console.log('Received message via socket:', message);
            console.log('Current selectedUser:', selectedUser?._id);
            console.log('Message senderId:', message.senderId);
            console.log('Current authUser:', authUser?._id);
            
            // Check if message already exists to prevent duplicates
            setMessages((prevMessages) => {
                const messageExists = prevMessages.some(msg => msg._id === message._id);
                if (messageExists) {
                    console.log('Message already exists, skipping duplicate');
                    return prevMessages;
                }
                
                // If user is chatting with sender, append message directly
                if (selectedUser && message.senderId === selectedUser._id) {
                    console.log('Adding message to current chat via socket');
                    
                    // Mark as seen if it's not our own message
                    if (message.senderId !== authUser?._id) {
                        axios.put(`/api/messages/mark/${message._id}`, { seen: true })
                            .catch((error) => {
                                const errorMessage = error.response?.data?.message || 'Failed to mark message as seen';
                                toast.error(errorMessage);
                            });
                    }
                    
                    const updatedMessages = [...prevMessages, message];
                    console.log('Updated messages via socket, new count:', updatedMessages.length);
                    return updatedMessages;
                } else {
                    console.log('Message not for current chat, updating unseen count');
                    // Update unseen messages counter in sidebar
                    setUnSeenMessages((prevUnseen) => ({
                        ...prevUnseen,
                        [message.senderId]: (prevUnseen[message.senderId] || 0) + 1
                    }));

                    // 🔥 Ensure user list updates so receiver sees latest preview
                    getUsers();
                    
                    return prevMessages;
                }
            });
        });

        // ✅ Listen for user list refresh events
        socket.on('refreshUserList', () => {
            getUsers();
        });

        // ✅ Listen for typing indicators
        socket.on('userTyping', (data) => {
            // Handle typing indicator if needed
            console.log('User typing:', data);
        });

        // ✅ Listen for user update events
        socket.on('userUpdate', (data) => {
            console.log('User update event:', data);
            // Refresh user list when users are updated
            getUsers();
        });

        // ✅ Listen for specific user action events
        socket.on('userCreated', () => getUsers());
        socket.on('userDeleted', () => getUsers());
        socket.on('profileUpdated', () => getUsers());
        socket.on('userBlocked', () => getUsers());
        socket.on('userUnblocked', () => getUsers());
        socket.on('userMuted', () => getUsers());
        socket.on('userUnmuted', () => getUsers());
        socket.on('userPinned', () => getUsers());
        socket.on('userUnpinned', () => getUsers());
        socket.on('userArchived', () => getUsers());
        socket.on('userUnarchived', () => getUsers());
        socket.on('userStarred', () => getUsers());
        socket.on('userUnstarred', () => getUsers());
        socket.on('userHidden', () => getUsers());
        socket.on('userUnhidden', () => getUsers());
        socket.on('userReported', () => getUsers());
        socket.on('userVerified', () => getUsers());
        socket.on('userUnverified', () => getUsers());
        socket.on('userBanned', () => getUsers());
        socket.on('userUnbanned', () => getUsers());
        socket.on('chatMuted', () => getUsers());
        socket.on('chatUnmuted', () => getUsers());
        socket.on('chatBlocked', () => getUsers());
        socket.on('chatUnblocked', () => getUsers());
        socket.on('chatPinned', () => getUsers());
        socket.on('chatUnpinned', () => getUsers());
        socket.on('chatArchived', () => getUsers());
        socket.on('chatUnarchived', () => getUsers());
        socket.on('chatStarred', () => getUsers());
        socket.on('chatUnstarred', () => getUsers());
        socket.on('chatHidden', () => getUsers());
        socket.on('chatUnhidden', () => getUsers());
        socket.on('chatReported', () => getUsers());
        socket.on('chatVerified', () => getUsers());
        socket.on('chatUnverified', () => getUsers());
        socket.on('chatBanned', () => getUsers());
        socket.on('chatUnbanned', () => getUsers());
        socket.on('voiceMuted', () => getUsers());
        socket.on('voiceUnmuted', () => getUsers());
        socket.on('voiceBlocked', () => getUsers());
        socket.on('voiceUnblocked', () => getUsers());
    }, [socket, selectedUser, axios, getUsers]);


    // function to unsubscribe from socket
    const unsubscribeFromMessages = useCallback(() => {
        if (socket) socket.off('message');
    }, [socket]);

    // ✅ Whenever selectedUser changes → save to localStorage & fetch messages
    useEffect(() => {
        if (selectedUser && selectedUser._id) {
            localStorage.setItem("selectedUser", JSON.stringify(selectedUser));
            getMessages(selectedUser._id);
        }
    }, [selectedUser?._id]); // Only depend on the ID, not the entire object

    // Initial load
    useEffect(() => {
        getUsers();
        subscribeToMessage();

        return () => {
            unsubscribeFromMessages();
        }
    }, [getUsers, subscribeToMessage, unsubscribeFromMessages]);

    const value = {
        messages,
        users,
        selectedUser,
        getMessages,
        setSelectedUser,
        sendMessage,
        unSeenMessages,
        setUnSeenMessages,
        getUsers
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};
