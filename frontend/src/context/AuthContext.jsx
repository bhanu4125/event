import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('eventra_token') || '');
  const [loading, setLoading] = useState(true);

  // Load user profile on startup ONLY if token exists
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('eventra_token');
      if (storedToken) {
        try {
          const res = await apiClient.get('/auth/me');
          setUser(res.data.data);
        } catch (err) {
          console.warn('Session expired or invalid token:', err.message);
          localStorage.removeItem('eventra_token');
          setToken('');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password, portalRole = null) => {
    const res = await apiClient.post('/auth/login', { email, password, portalRole });
    if (!res.data?.data?.token) {
      throw new Error(res.data?.message || 'Invalid server response from backend. Please verify database and backend status.');
    }
    const { token: newToken, ...userData } = res.data.data;
    localStorage.setItem('eventra_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const res = await apiClient.post('/auth/register', userData);
    if (!res.data?.data?.token) {
      throw new Error(res.data?.message || 'Invalid server response from backend. Please verify database and backend status.');
    }
    const { token: newToken, ...userPayload } = res.data.data;
    localStorage.setItem('eventra_token', newToken);
    setToken(newToken);
    setUser(userPayload);
    return userPayload;
  };

  const logout = () => {
    localStorage.removeItem('eventra_token');
    setToken('');
    setUser(null);
  };

  // Instant 1-click Role Switcher (Admin, Organizer, Student) for fast testing
  const switchRole = async (targetRole) => {
    try {
      setLoading(true);
      const res = await apiClient.post('/auth/demo-login', { role: targetRole });
      const { token: newToken, ...userData } = res.data.data;
      localStorage.setItem('eventra_token', newToken);
      setToken(newToken);
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Role switch failed:', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchRole,
        isAuthenticated: !!user,
        isStudent: user?.role === 'student',
        isAdmin: user?.role === 'admin',
        isOrganizer: user?.role === 'organizer' || user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
