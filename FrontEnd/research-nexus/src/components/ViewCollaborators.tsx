import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import config from '../config';
import AuthContext from '../context/AuthContext';
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

const ProjectCollaboratorsList: React.FC<{ projectId: number, projectName: string }> = ({ projectId, projectName }) => {
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
   const navigate = useNavigate();


  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        const response = await axios.get(`${config.API_URL}/api/createproject/projects/${projectId}/collaborators`, {
          withCredentials: true
        });
        console.log(response.data)
        setCollaborators(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch collaborators.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollaborators();
  }, [projectId]);

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading collaborators...</p>
      </Container>
    );
  }

  if (error || collaborators.length === 0) {
    return (
      <Container className="py-5">
        <Alert variant="warning">{error || 'No collaborators found.'}</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-5">
      <h3 className="mb-4 text-center">Project Collaborators</h3>
      <Row xs={1} sm={2} md={3} lg={5} className="g-4">
        {collaborators.map((collab) => (
          <Col key={collab._id}>
            <Card className="shadow-sm h-100">
              <p className="mb-1"><strong>Project:</strong> {projectName}</p>
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  {collab.avatar ? (
                    <img
                      src={collab.avatar}
                      alt={`${collab.fname} ${collab.lname}`}
                      className="rounded-circle me-3"
                      width="60"
                      height="60"
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center me-3"
                      style={{ width: 60, height: 60 }}
                    >
                      {collab.fname.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h6 className="mb-0">{collab.fname} {collab.lname}</h6>
                    <small className="text-muted">{collab.academicRole}</small>
                  </div>
                </div>
                <p className="mb-1"><strong>Department:</strong> {collab.department}</p>
                <p className="mb-1"><strong>Experience:</strong> {collab.researchExperience}</p>
                <Badge bg="info">{collab.researcharea}</Badge>
             <div className="d-grid mt-3">
              <button
                className="btn btn-sm rounded-pill"
                style={{
                  color: '#4a6fa5',
                  border: '1px solid #4a6fa5',
                  backgroundColor: '#f8f9fc',
                  padding: '0.375rem 1rem',
                  transition: 'all 0.3s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#e2e6f0';
                  e.currentTarget.style.color = '#36577a';
                  e.currentTarget.style.borderColor = '#36577a';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fc';
                  e.currentTarget.style.color = '#4a6fa5';
                  e.currentTarget.style.borderColor = '#4a6fa5';
                }}
                onClick={() => navigate(`/chat/${projectId}`)}
              >
                💬 Enter Group Chat
              </button>
            </div>

              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default ProjectCollaboratorsList;
