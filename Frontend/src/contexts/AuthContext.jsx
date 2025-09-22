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

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = Cookies.get('authToken');
      const userData = Cookies.get('user');

      if (token && userData) {
        try {
          const response = await axiosInstance.get('/api/auth/verify');
          if (response.data?.success) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setIsAuthenticated(true);
          } else {
            setTimeout(() => {
              clearAuthData();
            }, 4000)

          }
        } catch (verifyError) {
          if (verifyError.response?.status === 401) {
            setTimeout(() => {
              clearAuthData();
            }, 4000)
          } else {
            // Keep auth data on network errors
            try {
              const parsedUser = JSON.parse(userData);
              setUser(parsedUser);
              setIsAuthenticated(true);
            } catch {
              setTimeout(() => {
                clearAuthData();
              }, 4000)
            }
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthData = () => {
    Cookies.remove('authToken');
    Cookies.remove('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  // ✅ BULLETPROOF login function with guaranteed error handling
  const login = async (username, password) => {
    try {
      console.log('🔐 AuthContext: Login attempt');

      const response = await axiosInstance.post('/api/auth/login', {
        username: username?.trim() || '',
        password: password?.trim() || ''
      });

      console.log('📡 AuthContext: Response:', response.data);

      if (response?.data?.success) {
        const { token, user } = response.data;

        const cookieOptions = {
          expires: 7,
          secure: false,
          sameSite: 'lax',
          path: '/'
        };

        Cookies.set('authToken', token, cookieOptions);
        Cookies.set('user', JSON.stringify(user), cookieOptions);

        setUser(user);
        setIsAuthenticated(true);

        return { success: true, user };
      } else {
        return {
          success: false,
          message: response?.data?.message || 'Login failed'
        };
      }
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error);

      // GUARANTEED error handling - no uncaught errors
      let message = 'Login failed. Please try again.';

      try {
        if (error?.response?.status === 401) {
          message = 'Invalid username or password';
        } else if (error?.response?.data?.message) {
          message = error.response.data.message;
        } else if (error?.code === 'ERR_NETWORK') {
          message = 'Unable to connect to server';
        }
      } catch (parseError) {
        console.error('Error parsing error:', parseError);
      }

      return { success: false, message };
    }
  };

  const logout = () => {
    clearAuthData();
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
