

// Create AuthSuccess.tsx component
import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from './context/AuthContext';
import config from './config';

const AuthSuccess: React.FC = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("AuthSuccess component mounted");
    const fetchUserData = async () => {
        console.log("Fetching user data after authentication");
      try {
        const response = await fetch(`${config.API_URL}/UserData`, {
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.loggedIn && data.user) {
          // Transform backend user data
          const userData = {
            id: data.user[0].id || '',
            name: data.user[0].name || '',
            email: data.user[0].email || '',
            institution: data.user[0].institution || data.user[0].school || '',
            avatar: data.user[0].avatar || ''
          };
          
          // Set the user in context
          login(userData);
          
          // Navigate to dashboard
          navigate('/dashboard');
        } else {
          // If something went wrong, go back to login
          navigate('/login');
        }
      } catch (error) {
        console.error('Failed to fetch user data after auth:', error);
        navigate('/login');
      }
    };

    fetchUserData();
  }, [login, navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="text-center">
        <h3>Completing authentication...</h3>
        <p>Please wait while we set up your session.</p>
      </div>
    </div>
  );
};

export default AuthSuccess;