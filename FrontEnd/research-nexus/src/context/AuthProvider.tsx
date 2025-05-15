import React, { useState, useEffect } from 'react';
import AuthContext from './AuthContext';
import config from '../config';

interface User {
  id: string;
  name: string;
  email: string;
  role?:string;
  institution?: string;
  avatar?: string;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper: Get token from localStorage
  const getToken = () => localStorage.getItem('token');

  // Fetch user data using stored token
  const fetchUserData = async () => {
    const token = getToken();
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${config.API_URL}/auth/UserData`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch user data');

      const data = await response.json();

      if (data.user) {
        const userData: User = {
          id: data.user._id || '',
          name: `${data.user.fname || ''} ${data.user.lname || ''}`,
          email: data.user.email || '',
          role: data.user.role || '',
          institution: data.user.institution || data.user.school || '',
          avatar: data.user.avatar || '',
        };
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        throw new Error('Invalid user data');
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // On mount, check if user is already logged in
  useEffect(() => {
    const tokenFromURL = new URLSearchParams(window.location.search).get('token');
    if (tokenFromURL) {
      localStorage.setItem('token', tokenFromURL);
      // Clean URL (remove token from query string)
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, document.title, url.toString());
    }
    fetchUserData();
  }, []);

  const login = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  };
  

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
