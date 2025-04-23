import  { useState, useEffect, JSX } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import config from '../config';

interface Project {
  id: number;
  creator_email: string;
  title: string;
  description: string;
  research_goals: string;
  research_area: string;
  start_date: string;
  end_date: string;
  funding_available: boolean;
  funding_amount: string | null;
  collaborators_needed: boolean;
  collaborator_roles: string | null;
  institution: string | null;
  contact_email: string;
  created_at: string;
}

function UserProjects(): JSX.Element {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('`${config.API_URL}`/api/projects/user', {
          withCredentials: true
        });
        
        if (response.data.success) {
          setProjects(response.data.projects);
        } else {
          setError(response.data.message || 'Failed to load projects');
        }
      } catch (err) {
        setError('Error connecting to server');
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading your projects...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Research Projects</h2>
        <Link to="/projects/create">
          <Button variant="primary">
            <i className="bi bi-plus-circle me-2"></i>
            Create New Project
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card className="text-center p-5">
          <Card.Body>
            <i className="bi bi-journal-text display-1 text-muted mb-3"></i>
            <h3>No Projects Yet</h3>
            <p className="text-muted">
              Start your research journey by creating your first project.
            </p>
            <Link to="/projects/create">
              <Button variant="primary" size="lg" className="mt-3">
                Create Your First Project
              </Button>
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {projects.map((project) => (
            <Col lg={6} className="mb-4" key={project.id}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between mb-2">
                    <Badge bg="primary" className="mb-2">{project.research_area}</Badge>
                    {project.collaborators_needed && (
                      <Badge bg="success">Seeking Collaborators</Badge>
                    )}
                  </div>
                  <Card.Title>{project.title}</Card.Title>
                  <Card.Text className="text-muted mb-2">
                    {project.description.length > 150 
                      ? `${project.description.substring(0, 150)}...` 
                      : project.description}
                  </Card.Text>
                  <div className="d-flex justify-content-between mb-3">
                    <small className="text-muted">
                      {formatDate(project.start_date)} - {formatDate(project.end_date)}
                    </small>
                    {project.funding_available && (
                      <span className="text-success">
                        <i className="bi bi-cash me-1"></i>
                        {project.funding_amount 
                          ? `$${parseFloat(project.funding_amount).toLocaleString()}`
                          : 'Funding Available'}
                      </span>
                    )}
                  </div>
                  <div className="d-flex justify-content-between">
                    <Link to={`/projects/${project.id}`}>
                      <Button variant="outline-primary">View Details</Button>
                    </Link>
                    <Link to={`/projects/${project.id}/edit`}>
                      <Button variant="outline-secondary">
                        <i className="bi bi-pencil-square me-1"></i>
                        Edit
                      </Button>
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}

export default UserProjects;