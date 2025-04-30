import React, { useEffect, useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import config from '../../config';

const AuthSuccess: React.FC = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for error query parameter
    const params = new URLSearchParams(location.search);
    const errorType = params.get('error');
    
    if (errorType) {
      switch (errorType) {
        case 'server':
          setError('Server error occurred. Please try again later.');
          break;
        case 'auth':
          setError('Authentication failed. Please try again.');
          break; 
        case 'login':
          setError('Login failed. Please try again.');
          break;
        case 'session':
          setError('Session creation failed. Please try again.');
          break;
        default:
          setError('An error occurred during authentication.');
      }
      setLoading(false);
      return;
    }
    
    console.log("AuthSuccess component mounted");
    
    const fetchUserData = async () => {
      console.log("Fetching user data after authentication");
      
      // Add a retry mechanism
      let attempts = 0;
      let maxAttempts = 5; // Increased from 3
      let success = false;
      
      while (attempts < maxAttempts && !success) {
        attempts++;
        console.log(`Attempt ${attempts} to fetch user data`);
        
        try {
          // First check authentication status
          const authCheck = await fetch(`${config.API_URL}/auth/check`, {
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
          
          const authStatus = await authCheck.json();
          console.log("Auth check status:", authStatus);
          
          // If not authenticated yet, wait and retry
          if (!authStatus.sessionExists || 
              (!authStatus.sessionUser && !authStatus.passportUser && !authStatus.isAuthenticated)) {
            console.log("Not authenticated yet, waiting before retry");
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          
          // Now fetch user data
          const response = await fetch(`${config.API_URL}/UserData`, {
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
          
          console.log("Response status:", response.status);
          
          if (!response.ok) {
            console.error(`Error response from server: ${response.status}`);
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("Received data:", data);
          
          if (data.loggedIn && data.user && data.user.length > 0) {
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
            success = true;
            
            // Navigate to dashboard
            navigate('/dashboard');
            return;
          } else {
            console.log("User not logged in or no user data");
            // Wait a bit longer between later attempts
            const waitTime = Math.min(1000 * attempts, 3000);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        } catch (error) {
          console.error(`Attempt ${attempts} failed:`, error);
          // Wait a bit longer between later attempts
          const waitTime = Math.min(1000 * attempts, 3000);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      if (!success) {
        setError("Unable to retrieve user data. Please try logging in again.");
        setLoading(false);
        setTimeout(() => navigate('/login'), 3000);
      }
    };
    
    fetchUserData();
  }, [login, navigate, location.search]);

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="text-center">
        {error ? (
          <>
            <h3>Authentication Error</h3>
            <p>{error}</p>
            <p>Redirecting to login page...</p>
            <button 
              className="btn btn-primary mt-3" 
              onClick={() => navigate('/login')}
            >
              Go to Login Now
            </button>
          </>
        ) : loading ? (
          <>
            <h3>Completing authentication...</h3>
            <p>Please wait while we set up your session.</p>
            <div className="spinner-border text-primary mt-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </>
        ) : (
          <>
            <h3>Authentication Complete</h3>
            <p>Redirecting to dashboard...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthSuccess;