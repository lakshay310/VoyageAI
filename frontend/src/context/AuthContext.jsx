// src/context/AuthContext.jsx
// React Context for authentication state.
// Provides user info and auth functions to the entire app
// without needing prop drilling.

import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/auth.service';

// Create the context object
const AuthContext = createContext(null);

// AuthProvider wraps the whole app and manages auth state
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // while we check for existing session

  // On app mount, check if a token exists and fetch the user
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMe()
        .then((res) => setUser(res.data.data))
        .catch(() => {
          // Token is invalid or expired — clean up
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Called after login or register — saves the token and user
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // Called on logout — clears everything
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access to auth context
export const useAuth = () => useContext(AuthContext);
