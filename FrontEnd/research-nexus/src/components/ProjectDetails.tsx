import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiUsers, FiCalendar, FiDollarSign, FiArrowLeft, FiEdit } from 'react-icons/fi';
import config from '../config';

interface Project {
  _id: number;
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
  file: {
    data: "base64-string",
    contentType: "application/pdf",
    originalName: "proposal.pdf"
  } 
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const reportRef = useRef<HTMLDivElement>(null);

 const [exporting, setExporting] = useState(false);

const handleExportPDF = () => {
  if (!reportRef.current) return;

  setExporting(true);

  try {
    // @ts-ignore
    const html2pdf = window.html2pdf;

    html2pdf()
      .from(reportRef.current)
      .save()
      .finally(() => setExporting(false));
  } catch (err) {
    console.error('PDF export error:', err);
    setExporting(false);
  }
};


  useEffect(() => {
    const fetchProjectDetails = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${config.API_URL}/api/createproject/projects/${id}`, {
          withCredentials: true
        });

        if (response.data) {
          setProject(response.data);
        } else {
          setError(response.data.message || 'Failed to load project details');
        }
      } catch (err) {
        console.error('Error fetching project details:', err);
        setError('Could not connect to server');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProjectDetails();
    }
  }, [id]);

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this project?");
    if (!confirmDelete) return;
  
    try {
      const response = await axios.delete(`${config.API_URL}/api/createproject/projects/${id}`, {
        withCredentials: true
      });
  
      if (response.status === 200 || response.data) {
        navigate('/collaboratordashboard'); // Redirect to project list after deletion
      } else {
        setError(response.data.message || 'Failed to delete project');
      }
    } catch (err) {
      setError('Server error while deleting. Please try again later.');
      console.error('Project deletion error:', err);
    }
  };
  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading project details...</p>
      </Container>
    );
  }

  if (error || !project) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          {error || 'Project not found'}
        </Alert>
        <Button variant="primary" onClick={() => navigate('/collaboratordashboard')}>
          <FiArrowLeft className="me-2" /> Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <Button variant="link" className="text-decoration-none p-0" onClick={() => navigate('/collaboratordashboard')}>
          <FiArrowLeft className="me-2" /> Back to Dashboard
        </Button>
        <Link to={`/projects/${id}/edit`}>
          <Button variant="outline-primary">
            <FiEdit className="me-2" /> Edit Project
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm mb-4" ref={reportRef}>
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0">{project.title}</h2>
            <Badge bg="light" text="dark">{project.research_area}</Badge>
          </div>
        </Card.Header>
        <Card.Body className="p-4">
          <Row className="mb-4">
            <Col md={6}>
              <h5>Project Overview</h5>
              <p>{project.description}</p>
              <a href={`${config.API_URL}/api/createproject/${project._id}/download/`} download>
                  Download {project.file.originalName}
                  </a>  
            </Col>
            <Col md={6}>
              <Card className="bg-light">
                <Card.Body>
                  <h5>Project Details</h5>
                  <div className="mb-2">
                    <FiCalendar className="me-2 text-primary" />
                    <strong>Timeline:</strong> {formatDate(project.start_date)} - {formatDate(project.end_date)}
                  </div>
                  
                  <div className="mb-2">
                    <FiUsers className="me-2 text-primary" />
                    <strong>Collaborator Status:</strong>{' '}
                    {project.collaborators_needed ? (
                      <Badge bg="success">Seeking Collaborators</Badge>
                    ) : (
                      <Badge bg="secondary">Not Seeking Collaborators</Badge>
                    )}
                  </div>
                  
                  {project.institution && (
                    <div className="mb-2">
                      <i className="bi bi-building me-2 text-primary"></i>
                      <strong>Institution:</strong> {project.institution}
                    </div>
                  )}
                  
                  <div className="mb-2">
                    <i className="bi bi-envelope me-2 text-primary"></i>
                    <strong>Contact:</strong> {project.contact_email}
                  </div>
                  
                  {project.funding_available && (
                    <div className="mb-2">
                      <FiDollarSign className="me-2 text-success" />
                      <strong>Funding:</strong>{' '}
                      {project.funding_amount ? (
                        <span className="text-success">${parseFloat(project.funding_amount).toLocaleString()}</span>
                      ) : (
                        <span className="text-success">Available (amount not specified)</span>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <h5>Research Goals</h5>
          <div className="mb-4">
            <p>{project.research_goals}</p>
          </div>

          {project.collaborators_needed && project.collaborator_roles && (
            <div className="mb-4">
              <h5>Collaborator Roles Needed</h5>
              <p>{project.collaborator_roles}</p>
              <Button variant="success"  onClick={() => navigate(`/collaborators/${project._id}`)}>
                <FiUsers className="me-2" /> Apply to Collaborate
              </Button>
            </div>
          )}

          <hr className="my-4" />

          <div className="d-flex justify-content-between">
            <Button variant="outline-secondary" onClick={() => navigate('/collaboratordashboard')}>
              <FiArrowLeft className="me-2" /> Back to Dashboard
            </Button>
            <Button 
              variant="danger"
              size="lg"
              onClick={handleDelete}
            >
              Delete Project
            </Button>
            <Button onClick={handleExportPDF} disabled={exporting}>
              {exporting ? 'Exporting...' : 'Export as PDF'}
            </Button>

          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProjectDetail;