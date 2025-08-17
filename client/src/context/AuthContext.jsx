import { createContext, useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

// Environment variable
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
console.log('Backend URL:', backendUrl);

axios.defaults.baseURL = backendUrl;

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    console.log('AuthProvider rendering...');
    
    // Token initialization with immediate Axios header setup
    const [token, setToken] = useState(() => {
        const savedToken = localStorage.getItem('token');
        console.log('Initial token:', savedToken);
        if (savedToken) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        }
        return savedToken;
    });

    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);

    // Centralized error handler
    const handleError = useCallback((error) => {
        const msg = error.response?.data?.message || error.message || 'Something went wrong';
        console.error('Auth error:', error);
        toast.error(msg);
    }, []);

    // Check authentication status
    const checkAuth = useCallback(async () => {
        try {
            console.log('Checking auth...');
            const { data } = await axios.get('/api/auth/check');
            console.log('Auth check response:', data);
            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            handleError(error);
            // If auth check fails, clear token and user
            localStorage.removeItem('token');
            setToken(null);
            setAuthUser(null);
        }
    }, [handleError]);

    // Login
    const login = useCallback(async (state, credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credentials);
            if (data.success) {
                setAuthUser(data.userData);
                connectSocket(data.userData);
                axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
                setToken(data.token);
                localStorage.setItem('token', data.token);
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            handleError(error);
            return false;
        }
    }, [handleError]);

    // Logout
    const logout = useCallback(() => {
        try {
            localStorage.removeItem('token');
            setToken(null);
            setAuthUser(null);
            setOnlineUsers([]);
            delete axios.defaults.headers.common['Authorization'];
            socket?.disconnect();
            setSocket(null);
            toast.success('Logout successful');
        } catch (error) {
            handleError(error);
        }
    }, [socket, handleError]);

    // Update profile
    const updateProfile = useCallback(async (body) => {
        try {
            const { data } = await axios.put('/api/auth/update-profile', body);
            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user); // Reconnect with updated user
                toast.success('Profile updated successfully');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            handleError(error);
        }
    }, [handleError]);

    // Socket connection
    const connectSocket = useCallback((userData) => {
        if (!userData) return;

        // Always disconnect old socket before creating a new one
        if (socket) {
            socket.disconnect();
            setSocket(null);
        }

        const newSocket = io(backendUrl, {
            query: { 
                userId: userData._id,
                userName: userData.fullName 
            },
            transports: ['websocket', 'polling']
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
        });

        newSocket.on('onlineUsers', (userIds) => {
            console.log('Online users updated:', userIds);
            setOnlineUsers(userIds);
        });

        newSocket.on('message', (message) => {
            // Handle new message notification if needed
            console.log('New message received:', message);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
    }, [socket]);

    // Check auth on token change
    useEffect(() => {
        console.log('Token changed:', token);
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            checkAuth();
        }
    }, [token, checkAuth]);

    // Cleanup socket on unmount
    useEffect(() => {
        return () => {
            socket?.disconnect();
        };
    }, [socket]);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        axios,
        authUser,
        token,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile,
    }), [axios, authUser, token, onlineUsers, socket, login, logout, updateProfile]);

    console.log('AuthProvider context value:', contextValue);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
