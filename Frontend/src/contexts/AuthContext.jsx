// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import axiosInstance from '../../axiosCreate';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = Cookies.get('authToken');
      const userData = Cookies.get('user');

      if (token && userData) {
        // Verify token with backend
        const response = await axiosInstance.get('/api/auth/verify');
        if (response.data.success) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          // Invalid token, clear cookies
          Cookies.remove('authToken');
          Cookies.remove('user');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      Cookies.remove('authToken');
      Cookies.remove('user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axiosInstance.post('/api/auth/login', {
        username,
        password
      });

      if (response.data.success) {
        const { token, user } = response.data;
        
        // Store in cookies with 7 days expiry
        Cookies.set('authToken', token, { expires: 7, secure: false, sameSite: 'strict' });
        Cookies.set('user', JSON.stringify(user), { expires: 7, secure: false, sameSite: 'strict' });
        
        setUser(user);
        setIsAuthenticated(true);
        
        return { success: true, user };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    Cookies.remove('authToken');
    Cookies.remove('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
