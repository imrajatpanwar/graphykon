import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import getApiConfig from '../config/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get API configuration based on current environment
  const apiConfig = getApiConfig();
  
  // Configure axios defaults
  axios.defaults.baseURL = apiConfig.baseURL;
  axios.defaults.withCredentials = apiConfig.withCredentials;

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(apiConfig.socketURL, {
      withCredentials: true
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Track visitor activity
  useEffect(() => {
    if (socket) {
      // Send visitor join event
      socket.emit('visitor-join', {
        userId: user?.id || user?._id,
        email: user?.email,
        name: user?.name,
        currentPage: location.pathname
      });

      // Setup activity heartbeat
      const activityInterval = setInterval(() => {
        socket.emit('visitor-activity');
      }, 30000); // Send heartbeat every 30 seconds

      // Join admin room if user is admin
      if (user && (user.isAdmin || user.role === 'admin')) {
        socket.emit('join-admin-room');
      }

      return () => {
        clearInterval(activityInterval);
      };
    }
  }, [socket, user, location.pathname]);

  // Track page changes
  useEffect(() => {
    if (socket) {
      socket.emit('page-change', { page: location.pathname });
    }
  }, [socket, location.pathname]);

  // Check token expiration
  const checkTokenExpiration = useCallback(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();

        if (currentTime >= expirationTime) {
          // Token has expired
          logout();
          navigate('/login');
        }
      } catch (error) {
        console.error('Error checking token expiration:', error);
        logout();
        navigate('/login');
      }
    }
  }, [navigate]);

  // Check auth status on mount and every minute
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setUser(response.data);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    // Check token expiration every minute
    const interval = setInterval(checkTokenExpiration, 60000);
    return () => clearInterval(interval);
  }, [navigate, checkTokenExpiration]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Frontend: Starting registration...', { name, email });
      
      const response = await axios.post('/api/auth/register', {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
      });
      
      console.log('✅ Frontend: Registration successful', response.data);
      
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        localStorage.setItem('token', response.data.token);
        console.log('✅ Frontend: User data saved to state and localStorage');
        return response.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('❌ Frontend: Registration failed', err);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.response?.data) {
        const { message, error, connectionState } = err.response.data;
        
        // Handle specific error types
        if (err.response.status === 503) {
          errorMessage = 'Database connection failed. Please try again later.';
        } else if (err.response.status === 400) {
          errorMessage = message || 'Please check your input and try again.';
        } else {
          errorMessage = message || errorMessage;
        }
        
        // Log additional debug info
        console.error('Error details:', { 
          status: err.response.status, 
          message, 
          error, 
          connectionState 
        });
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.code === 'ERR_CONNECTION_REFUSED') {
        errorMessage = 'Server is not responding. Please try again later.';
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
    }
  };

  // Helper functions for admin
  const isAdmin = () => user?.isAdmin || user?.role === 'admin';
  const isCreator = () => user?.isCreator || user?.role === 'creator';
  
  const value = {
    user,
    setUser,
    loading,
    error,
    login,
    register,
    logout,
    isAdmin,
    isCreator,
    socket,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 