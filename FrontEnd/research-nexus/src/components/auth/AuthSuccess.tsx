import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import config from '../../config';

const AuthSuccess: React.FC = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("AuthSuccess component mounted");
    
    // Check if we have the test cookie
    const hasAuthCookie = document.cookie.includes('auth_test=true');
    console.log("Auth test cookie present:", hasAuthCookie);
    
    const fetchUserData = async () => {
      console.log("Fetching user data after authentication");
      try {
        const response = await fetch(`${config.API_URL}/UserData`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          console.error("Error response from server");
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Received data:", data);
        
        if (data.loggedIn && data.user && data.user.length > 0) {
          console.log("User is logged in, processing user data");
          // Transform backend user data
          const userData = {
            id: data.user[0].id || '',
            name: data.user[0].name || '',
            email: data.user[0].email || '',
            institution: data.user[0].institution || data.user[0].school || '',
            avatar: data.user[0].avatar || ''
          };
          
          console.log("Processed user data:", userData);
          // Set the user in context
          login(userData);
          
          // Navigate to dashboard
          navigate('/dashboard');
        } else {
          console.error("Not logged in or no user data:", data);
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