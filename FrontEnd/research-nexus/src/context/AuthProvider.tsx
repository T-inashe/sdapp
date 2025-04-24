import React, { useState, useEffect } from 'react';
import AuthContext from './AuthContext';

interface User {
  id: string;
  name: string;
  email: string;
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
  const [initialCheckDone, setInitialCheckDone] = useState<boolean>(false);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('http://localhost:8081/UserData', {
          credentials: 'include' // Important for cookies to be sent
        });
        
        const data = await response.json();
        
        if (data.loggedIn && data.user) {
          // Transform backend user data to match our User interface
          const userData: User = {
            id: data.user[0].id || '',
            name: data.user[0].name || '',
            email: data.user[0].email || '',
            institution: data.user[0].institution || data.user[0].school || '',
            avatar: data.user[0].avatar || ''
          };
          
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to check authentication status:', error);
        // On error, we assume user is not authenticated
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
        setInitialCheckDone(true);
      }
    };

    checkAuthStatus();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:8081/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Don't render anything until initial auth check is done
  if (loading && !initialCheckDone) {
    return <div>Loading...</div>; // Or your preferred loading indicator
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;