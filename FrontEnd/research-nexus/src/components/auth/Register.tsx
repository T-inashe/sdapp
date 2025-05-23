import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FcGoogle } from 'react-icons/fc';
import './Auth.css';
import config from '../../config';

const Register: React.FC = () => {
  const handleGoogleSignup = () => {
    // Redirect to backend Google OAuth route (same as login)
    window.location.href = `${config.API_URL}/auth/google`;
  };

  return (
    <div className="auth-page">
      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col md={6} lg={5}>
            <div className="text-center mb-4">
              <h1 className="brand-name">ResearchCollab</h1>
              <p className="brand-tagline">Connect. Collaborate. Innovate.</p>
            </div>
            
            <Card className="shadow auth-card">
              <Card.Body className="p-4">
                <h2 className="text-center mb-4">Join ResearchCollab</h2>
                <p className="text-center text-muted mb-4">
                  Create an account to start collaborating with researchers worldwide
                </p>
                
                <Button 
                  variant="outline-dark"
                  className="w-100 google-btn py-2 mb-3"
                  onClick={handleGoogleSignup}
                >
                  <FcGoogle size={20} className="me-2" />
                  <span>Sign up with Google</span>
                </Button>
                
                <div className="mt-4 text-center">
                  <p className="mb-0">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary text-decoration-none">
                      Log in
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
            
            <div className="text-center mt-4 text-muted small">
              <p>By signing up, you agree to our Terms of Service and Privacy Policy</p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Register;