import React, { useContext, useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { FiUsers, FiFileText, FiMessageSquare, FiCalendar, FiSettings, FiLogOut } from 'react-icons/fi';
import axios from 'axios';
import './Dashboard.css';

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

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  date: string;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch real projects from API
        const projectResponse = await axios.get('http://localhost:8081/api/projects/user', {
          withCredentials: true
        });
        
        if (projectResponse.data.success) {
          setProjects(projectResponse.data.projects);
        } else {
          setError(`Failed to load projects: ${projectResponse.data.message}`);
        }

        // For now, still using mock notifications
        setNotifications([
          {
            id: '1',
            message: 'Dr. Smith commented on your research proposal',
            type: 'info',
            date: '2025-04-19'
          },
          {
            id: '2',
            message: 'New collaboration request from MIT Research Group',
            type: 'success',
            date: '2025-04-18'
          },
          {
            id: '3',
            message: 'Grant application deadline in 3 days',
            type: 'warning',
            date: '2025-04-17'
          }
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Error connecting to server');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:8081/logout', {}, { withCredentials: true });
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setError('Logout failed. Please try again.');
    }
  };

  const getStatusBadgeVariant = (project: Project) => {
    if (project.collaborators_needed) {
      return 'success';
    } else {
      return 'primary';
    }
  };

  const getNotificationVariant = (type: string) => {
    switch (type) {
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const formatDeadlineDate = (dateString: string): {day: string, month: string} => {
    const date = new Date(dateString);
    return {
      day: date.getDate().toString(),
      month: new Intl.DateTimeFormat('en', { month: 'short' }).format(date)
    };
  };

  // Get upcoming project deadlines (end dates) sorted by date
  const getUpcomingDeadlines = () => {
    const now = new Date();
    const upcomingProjects = projects
      .filter(project => {
        const endDate = new Date(project.end_date);
        return endDate >= now;
      })
      .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
      .slice(0, 5); // Show top 5 upcoming deadlines
    
    // If we have fewer than 3 upcoming deadlines, add some past projects too
    if (upcomingProjects.length < 3) {
      const pastProjects = projects
        .filter(project => {
          const endDate = new Date(project.end_date);
          return endDate < now;
        })
        .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime()) // Most recent past first
        .slice(0, 3 - upcomingProjects.length);
      
      return [...upcomingProjects, ...pastProjects];
    }
    
    return upcomingProjects;
  };

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading your research dashboard...</p>
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

  const upcomingDeadlines = getUpcomingDeadlines();

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h3>ResearchCollab</h3>
        </div>
        <div className="user-profile text-center p-3">
          <div className="avatar-container mx-auto mb-2">
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.name} className="user-avatar" />
            ) : (
              <div className="avatar-placeholder">
                {user?.name?.charAt(0) || 'R'}
              </div>
            )}
          </div>
          <h5>{user?.name}</h5>
          <p className="text-muted small">{user?.institution}</p>
        </div>
        <Nav className="flex-column sidebar-nav">
          <Nav.Link
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            <FiFileText className="me-2" /> Overview
          </Nav.Link>
          <Nav.Link
            className={activeTab === 'collaborators' ? 'active' : ''}
            onClick={() => setActiveTab('collaborators')}
          >
            <FiUsers className="me-2" /> Collaborators
          </Nav.Link>
          <Nav.Link
            className={activeTab === 'messages' ? 'active' : ''}
            onClick={() => setActiveTab('messages')}
          >
            <FiMessageSquare className="me-2" /> Messages
          </Nav.Link>
          <Nav.Link
            className={activeTab === 'calendar' ? 'active' : ''}
            onClick={() => setActiveTab('calendar')}
          >
            <FiCalendar className="me-2" /> Calendar
          </Nav.Link>
          <Nav.Link
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            <FiSettings className="me-2" /> Settings
          </Nav.Link>
        </Nav>
        <div className="mt-auto p-3">
          <Button variant="outline-danger" className="w-100" onClick={handleLogout}>
            <FiLogOut className="me-2" /> Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>Research Dashboard</h2>
          <div>
            <Link to="/projects/create">
              <Button variant="primary" className="me-2">New Project</Button>
            </Link>
            <Button variant="outline-primary">Find Collaborators</Button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <Container fluid>
            {/* Welcome card */}
            <Row className="mb-4">
              <Col>
                <Card className="welcome-card">
                  <Card.Body>
                    <Row>
                      <Col md={8}>
                        <h3>Welcome back, {user?.name?.split(' ')[0]}!</h3>
                        <p>
                          Continue your research journey with ResearchCollab. You have{' '}
                          <strong>{notifications.length} notifications</strong> and{' '}
                          <strong>{projects.length} active projects</strong>.
                        </p>
                        <Button variant="primary">Complete Your Profile</Button>
                      </Col>
                      <Col md={4} className="d-none d-md-block">
                        <div className="welcome-illustration"></div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Stats and Notifications */}
            <Row className="mb-4">
              <Col md={8}>
                <h4 className="mb-3">Your Research Projects</h4>
                {projects.length === 0 ? (
                  <Card className="text-center p-5 mb-3">
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
                  projects.map((project) => (
                    <Card key={project.id} className="mb-3 project-card">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="d-flex mb-2">
                              <Badge bg="primary" className="me-2">{project.research_area}</Badge>
                              {project.collaborators_needed && (
                                <Badge bg="success">Seeking Collaborators</Badge>
                              )}
                            </div>
                            <h5>{project.title}</h5>
                            <p className="text-muted mb-2">
                              {project.description.length > 150 
                                ? `${project.description.substring(0, 150)}...` 
                                : project.description}
                            </p>
                            <div className="project-meta">
                              <span className="me-3">
                                <FiUsers className="me-1" /> 
                                {project.collaborators_needed ? 'Seeking collaborators' : 'No collaborators needed'}
                              </span>
                              <span>
                                {formatDate(project.start_date)} - {formatDate(project.end_date)}
                              </span>
                            </div>
                            {project.funding_available && (
                              <div className="mt-2 text-success">
                                <i className="bi bi-cash me-1"></i>
                                {project.funding_amount 
                                  ? `$${parseFloat(project.funding_amount).toLocaleString()}`
                                  : 'Funding Available'}
                              </div>
                            )}
                          </div>
                          <Badge bg={getStatusBadgeVariant(project)}>
                            {project.research_area}
                          </Badge>
                        </div>
                        <div className="mt-3">
                          <Link to={`/projects/${project.id}`}>
                            <Button variant="outline-primary" size="sm" className="me-2">
                              View Details
                            </Button>
                          </Link>
                          <Link to={`/projects/${project.id}/edit`}>
                            <Button variant="outline-secondary" size="sm">
                              <i className="bi bi-pencil-square me-1"></i>
                              Edit
                            </Button>
                          </Link>
                        </div>
                      </Card.Body>
                    </Card>
                  ))
                )}
                <div className="text-center mt-3">
                  <Link to="/projects">
                    <Button variant="outline-primary">View All Projects</Button>
                  </Link>
                </div>
              </Col>
              <Col md={4}>
                <h4 className="mb-3">Recent Notifications</h4>
                <Card>
                  <Card.Body className="p-0">
                    <div className="notification-list">
                      {notifications.map(notification => (
                        <div key={notification.id} className="notification-item">
                          <div className={`notification-indicator bg-${getNotificationVariant(notification.type)}`}></div>
                          <div className="notification-content">
                            <p className="mb-1">{notification.message}</p>
                            <small className="text-muted">{notification.date}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-center p-3">
                      <Button variant="link" className="text-decoration-none">View All Notifications</Button>
                    </div>
                  </Card.Body>
                </Card>

                <h4 className="mb-3 mt-4">Project Deadlines</h4>
                <Card>
                  <Card.Body>
                    {upcomingDeadlines.length === 0 ? (
                      <div className="text-center p-3">
                        <p className="text-muted">No project deadlines found</p>
                      </div>
                    ) : (
                      upcomingDeadlines.map(project => {
                        const date = formatDeadlineDate(project.end_date);
                        const isPastDeadline = new Date(project.end_date) < new Date();
                        
                        return (
                          <div className="deadline-item" key={project.id}>
                            <div className={`deadline-date ${isPastDeadline ? 'text-muted' : ''}`}>
                              <span className="day">{date.day}</span>
                              <span className="month">{date.month}</span>
                            </div>
                            <div className="deadline-info">
                              <h6>{project.title}</h6>
                              <p className="mb-0 text-muted small">
                                {isPastDeadline ? 'Completed' : project.institution || project.research_area}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        )}

        {activeTab !== 'overview' && (
          <div className="text-center py-5">
            <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
            <p className="text-muted">This section is under development.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;