import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Form } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import config from '../config';
import { useNavigate} from 'react-router-dom';
import './dashboard/Dashboard.css';

interface User {
  _id: string;
  fname: string;
  lname: string;
  avatar?: string;
  academicRole: string;
  department: string;
  researchExperience: string;
  researcharea: string;
}

interface Project {
  _id: string;
  title: string;
  description: string;
  creator: User;
}

const ProjectCollaborator: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useContext(AuthContext);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`${config.API_URL}/api/createproject/projects/${id}`, {
          withCredentials: true
        });
        setProject(response.data);
      } catch (err) {
        setError('Failed to fetch project.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const handleSendMessage = async () => {
    if (!message || !user?.id || !project?.creator?._id) return;

    try {
      await axios.post(`${config.API_URL}/api/collaborator`, {
        sender: user?.id,
        receiver: project.creator._id,
        message: message,
        project: project._id,
        type: 'application'
      }, {
        withCredentials: true
      });
      
      alert('Message sent!');
      navigate('/collaboratordashboard');
      setMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
      alert('Failed to send message');
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading project...</p>
      </Container>
    );
  }

  if (error || !project) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || 'Project not found.'}</Alert>
      </Container>
    );
  }

  const creator = project.creator;

  return (
    <Container fluid className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow-lg">
            <Card.Body>
              <div className="d-flex align-items-center mb-4">
                {project.creator.avatar ? (
                  <img src={project.creator.avatar} alt={project.creator.fname} className="rounded-circle me-3" width="80" height="80" />
                ) : (
                  <div className="rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center me-3" style={{ width: 80, height: 80 }}>
                    {project.creator.fname.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4>{creator.fname} {creator.lname}</h4>
                  <p className="text-muted mb-1">{creator.academicRole} • {creator.department}</p>
                  <Badge bg="info" className="text-white">{creator.researcharea}</Badge>
                </div>
              </div>

              <div className="mb-3">
                <strong>Research Experience:</strong>
                <p>{creator.researchExperience}</p>
              </div>

              <div className="mb-4">
                <strong>Project Title:</strong>
                <p>{project.title}</p>
                <strong>Description:</strong>
                <p>{project.description}</p>
              </div>

              <Form.Group className="d-flex">
                <Form.Control
                  type="text"
                  placeholder="Type your message..."
                  className="me-2"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button variant="primary" onClick={handleSendMessage}>
                  Send Message
                </Button>
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProjectCollaborator;
