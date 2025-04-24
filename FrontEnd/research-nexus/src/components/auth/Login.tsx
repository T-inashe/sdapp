import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FcGoogle } from 'react-icons/fc';
import './Auth.css';
import config from '../../config';


const Login: React.FC = () => {
  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth route
    console.log(config.API_URL);
    window.location.href = `${config.API_URL}/auth/google`;
  };

  return (
    <div className="auth-page">
      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col md={6} lg={5}>
            <div className="text-center mb-4">
              <h1 className="brand-name">ResearchBridge</h1>
              <p className="brand-tagline">Connect. Collaborate. Innovate.</p>
            </div>
            
            <Card className="shadow auth-card">
              <Card.Body className="p-4">
                <h2 className="text-center mb-4">Welcome Back</h2>
                <p className="text-center text-muted mb-4">
                  Log in to access your research collaborations
                </p>
                
                <Button 
                  variant="outline-dark"
                  className="w-100 google-btn py-2 mb-3"
                  onClick={handleGoogleLogin}
                >
                  <FcGoogle size={20} className="me-2" />
                  <span>Continue with Google</span>
                </Button>
                
                <div className="mt-4 text-center">
                  <p className="mb-0">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary text-decoration-none">
                      Sign up
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
            
            <div className="text-center mt-4 text-muted small">
              <p>By logging in, you agree to our Terms of Service and Privacy Policy</p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;