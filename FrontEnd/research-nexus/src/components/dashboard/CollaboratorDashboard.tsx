import React, { useContext, useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Nav, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { FiUsers, FiFileText, FiMessageSquare, FiCalendar, FiSettings, FiLogOut, FiSearch, FiBriefcase } from 'react-icons/fi';
import axios from 'axios';
import './Dashboard.css';
import Calendar from './Calendar'; 
import config from '../../config';

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
  status?: string;
  role?: string;
}

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  date: string;
}

interface Opportunity {
  id: number;
  title: string;
  research_area: string;
  institution: string;
  deadline: string;
  skills_needed: string[];
  matchScore: number;
}

const CollaboratorDashboard: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const projectResponse = await axios.get(`${config.API_URL}/api/createproject/projects`, {
        withCredentials: true
       });
      
       if (projectResponse.data) {
         setProjects(projectResponse.data);
       } else {
         console.error('Failed to load projects:', projectResponse.data.message);
       }
        // Mock opportunities data - would be from real API in production
        setOpportunities([
          {
            id: 1,
            title: "AI in Healthcare Research",
            research_area: "Machine Learning",
            institution: "Stanford University",
            deadline: "2025-05-20",
            skills_needed: ["Machine Learning", "Healthcare", "Data Analysis"],
            matchScore: 93
          },
          {
            id: 2,
            title: "Climate Change Impact Assessment",
            research_area: "Environmental Science",
            institution: "MIT",
            deadline: "2025-06-15",
            skills_needed: ["Environmental Science", "Statistical Analysis", "GIS"],
            matchScore: 87
          },
          {
            id: 3,
            title: "Quantum Computing Applications",
            research_area: "Computer Science",
            institution: "Cambridge University",
            deadline: "2025-05-30",
            skills_needed: ["Quantum Computing", "Algorithm Design", "Mathematics"],
            matchScore: 82
          },
          {
            id: 4,
            title: "Neuroplasticity in Learning",
            research_area: "Neuroscience",
            institution: "Harvard Medical School",
            deadline: "2025-07-01",
            skills_needed: ["Neuroscience", "Psychology", "Data Analysis"],
            matchScore: 79
          }
        ]);

        // Mock notifications
        try {
          const userId = user?.id;
          const response = await axios.get(`${config.API_URL}/api/notifications?user=${userId}`);
          const dbNotifications = Array.isArray(response.data)
            ? response.data.map((notif) => ({
                id: notif._id,
                message: notif.message,
                type: notif.type || 'info',
                date: new Date(notif.date || notif.createdAt).toISOString().split('T')[0]
              }))
            : [];

          setNotifications(dbNotifications);

        } catch (error) {
          console.error('Error fetching notifications:', error);
          setError('Error connecting to notifications API');
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Error connecting to server');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    logout(); 
    navigate('/login'); 
  };
  
  const getDashboardTitle = () => {
    const role = user?.role;
    if (role === 'Researcher') return 'Researcher Dashboard';
    if (role === 'Reviewer') return 'Reviewer Dashboard';
    if (role === 'Admin') return 'Admin Dashboard';
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
      const upcomingDeadlines = getUpcomingDeadlines();

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

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'data analyst':
        return 'info';
      case 'researcher':
        return 'primary';
      case 'advisor':
        return 'secondary';
      case 'lead researcher':
        return 'danger';
      default:
        return 'dark';
    }
  };

  const handleApply = async (opportunityId: number) => {
    try {
      console.log(`Applied to opportunity ${opportunityId}`);
      const userId = user?.id;
  
      const response = await axios.post(`${config.API_URL}/api/notifications`, {
        message: 'Application submitted successfully!',
        user: userId,
        type: 'success',
        date: new Date().toISOString()
      });
  
      // Add the new notification to the state immediately
      const newNotif = response.data;
      setNotifications((prev) => [
        {
          id: newNotif._id, 
          message: newNotif.message,
          type: newNotif.type,
          date: new Date(newNotif.date || newNotif.createdAt).toISOString().split('T')[0]
        },
        ...prev
      ]);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };
  
  

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading your collaborator dashboard...</p>
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
                {user?.name?.charAt(0) || 'C'}
              </div>
            )}
          </div>
          <h5>{user?.name}</h5>
          <p className="text-muted small">{user?.institution}</p>
          <Badge bg="info">Collaborator</Badge>
        </div>
        <Nav className="flex-column sidebar-nav">
          <Nav.Link
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            <FiFileText className="me-2" /> Overview
          </Nav.Link>
          <Nav.Link
            className={activeTab === 'opportunities' ? 'active' : ''}
            onClick={() => setActiveTab('opportunities')}
          >
            <FiSearch className="me-2" /> Find Opportunities
          </Nav.Link>
          <Nav.Link
            className={activeTab === 'projects' ? 'active' : ''}
            onClick={() => setActiveTab('projects')}
          >
            <FiBriefcase className="me-2" /> My Projects
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
          <h2>{getDashboardTitle()}</h2>
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
                          Find exciting research opportunities that match your skills and interests. You have{' '}
                          <strong>{notifications.length} notifications</strong> and are part of{' '}
                          <strong>{projects.length} research projects</strong>.
                        </p>
                        <Button variant="primary">Complete Your Skills Profile</Button>
                      </Col>
                      <Col md={4} className="d-none d-md-block">
                        <div className="welcome-illustration"></div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Main Content */}
            <Row className="mb-4">
              <Col md={8}>
                <h4 className="mb-3">Recommended Opportunities</h4>
                {opportunities.length === 0 ? (
                  <Card className="text-center p-5 mb-3">
                    <Card.Body>
                      <i className="bi bi-search display-1 text-muted mb-3"></i>
                      <h3>No Matching Opportunities</h3>
                      <p className="text-muted">
                        Update your skills profile to get better research opportunity matches.
                      </p>
                      <Link to="/profile/skills">
                        <Button variant="primary" size="lg" className="mt-3">
                          Update Skills Profile
                        </Button>
                      </Link>
                    </Card.Body>
                  </Card>
                ) : (
                  opportunities.slice(0, 3).map((opportunity) => (
                    <Card key={opportunity.id} className="mb-3 opportunity-card">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <div className="mb-2">
                              <Badge bg="primary" className="me-2">{opportunity.research_area}</Badge>
                              <Badge bg="success">Match Score: {opportunity.matchScore}%</Badge>
                            </div>
                            <h5>{opportunity.title}</h5>
                            <p className="text-muted mb-0">{opportunity.institution}</p>
                          </div>
                          <div className="deadline-badge">
                            <div className="deadline-date">
                              <small>Deadline</small>
                              <strong>{formatDate(opportunity.deadline)}</strong>
                            </div>
                          </div>
                        </div>
                        
                        <div className="skills-needed mt-3">
                          <small className="text-muted">Skills Needed:</small>
                          <div className="mt-1">
                            {opportunity.skills_needed.map((skill, index) => (
                              <Badge bg="light" text="dark" className="me-2 mb-2" key={index}>
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleApply(opportunity.id)}
                          >
                            Apply Now
                          </Button>
                          <Link to={`/opportunities/${opportunity.id}`}>
                            <Button variant="outline-primary" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </Card.Body>
                    </Card>
                  ))
                )}
                <div className="text-center mt-3">
                  <Button variant="outline-primary" onClick={() => setActiveTab('opportunities')}>
                    View All Opportunities
                  </Button>
                </div>

                <h4 className="mb-3 mt-4">Current Projects</h4>
                {projects.length === 0 ? (
                  <Card className="text-center p-5 mb-3">
                    <Card.Body>
                      <i className="bi bi-briefcase display-1 text-muted mb-3"></i>
                      <h3>No Active Projects</h3>
                      <p className="text-muted">
                        You're not currently collaborating on any research projects.
                      </p>
                      <Button variant="primary" size="lg" className="mt-3" onClick={() => setActiveTab('opportunities')}>
                        Find Opportunities
                      </Button>
                    </Card.Body>
                  </Card>
                ) : (
                  projects.map((project) => (
                    <Card key={project._id} className="mb-3 project-card">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="d-flex mb-2">
                              <Badge bg="primary" className="me-2">{project.research_area}</Badge>
                              <Badge bg={getRoleColor(project.role || '')}>
                                {project.role || 'Collaborator'}
                              </Badge>
                            </div>
                            <h5>{project.title}</h5>
                            <p className="text-muted mb-2">
                              {project.description?.length > 150 
                                ? `${project.description.substring(0, 150)}...` 
                                : project.description}
                            </p>
                            <div className="project-meta">
                              <span className="me-3">
                                <FiUsers className="me-1" /> 
                                {project.institution || 'Unknown Institution'}
                              </span>
                              <span>
                                {project.start_date && project.end_date ? 
                                  `${formatDate(project.start_date)} - ${formatDate(project.end_date)}` :
                                  'Dates not specified'}
                              </span>
                            </div>
                          </div>
                          <Badge bg={project.status === 'Active' ? 'success' : 'warning'}>
                            {project.status || 'Active'}
                          </Badge>
                        </div>
                        <div className="mt-3">
                          <Link to={`/projects/${project._id}`}>
                            <Button variant="outline-primary" size="sm" className="me-2">
                              View Project
                            </Button>
                          </Link>
                          <Link to={`/projects/${project._id}/edit`}>
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

                <h4 className="mb-3 mt-4">Skills Profile</h4>
                <Card>
                  <Card.Body>
                    <div className="skills-section">
                      <h6>Research Areas</h6>
                      <div className="mb-3">
                        <Badge bg="primary" className="me-2 mb-2">Machine Learning</Badge>
                        <Badge bg="primary" className="me-2 mb-2">Data Analysis</Badge>
                        <Badge bg="primary" className="me-2 mb-2">Neuroscience</Badge>
                        <Badge bg="light" text="dark" className="mb-2">+ Add</Badge>
                      </div>
                      
                      <h6>Technical Skills</h6>
                      <div className="mb-3">
                        <Badge bg="secondary" className="me-2 mb-2">Python</Badge>
                        <Badge bg="secondary" className="me-2 mb-2">R</Badge>
                        <Badge bg="secondary" className="me-2 mb-2">Statistical Analysis</Badge>
                        <Badge bg="secondary" className="me-2 mb-2">MATLAB</Badge>
                        <Badge bg="light" text="dark" className="mb-2">+ Add</Badge>
                      </div>
                      
                      <h6>Publications</h6>
                      <p className="small text-muted">3 publications in peer-reviewed journals</p>
                      
                      <div className="text-center mt-3">
                        <Link to="/profile/skills">
                          <Button variant="outline-primary" size="sm">
                            Update Skills Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                <h4 className="mb-3 mt-4">Upcoming Deadlines</h4>
                <Card>
                  <Card.Body>
                    <div className="deadline-item">
                      <div className="deadline-date">
                        <span className="day">15</span>
                        <span className="month">May</span>
                      </div>
                      <div className="deadline-info">
                        <h6>Submit Research Data</h6>
                        <p className="mb-0 text-muted small">Climate Change Impact Assessment</p>
                      </div>
                    </div>
                    <div className="deadline-item">
                      <div className="deadline-date">
                        <span className="day">22</span>
                        <span className="month">May</span>
                      </div>
                      <div className="deadline-info">
                        <h6>Weekly Team Meeting</h6>
                        <p className="mb-0 text-muted small">AI in Healthcare Research</p>
                      </div>
                    </div>
                    <div className="deadline-item">
                      <div className="deadline-date">
                        <span className="day">30</span>
                        <span className="month">May</span>
                      </div>
                      <div className="deadline-info">
                        <h6>Final Report Draft</h6>
                        <p className="mb-0 text-muted small">Quantum Computing Applications</p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        )}

        {activeTab === 'opportunities' && (
          <Container fluid>
            <Row className="mb-4">
              <Col>
                <Card>
                  <Card.Body>
                    <h4>Find Research Opportunities</h4>
                    <div className="search-filters mb-4">
                      <Row>
                        <Col md={4}>
                          <div className="mb-3">
                            <label className="form-label">Research Area</label>
                            <select className="form-select">
                              <option value="">All Areas</option>
                              <option>Machine Learning</option>
                              <option>Environmental Science</option>
                              <option>Computer Science</option>
                              <option>Neuroscience</option>
                              <option>Physics</option>
                            </select>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="mb-3">
                            <label className="form-label">Institution</label>
                            <select className="form-select">
                              <option value="">All Institutions</option>
                              <option>Stanford University</option>
                              <option>MIT</option>
                              <option>Cambridge University</option>
                              <option>Harvard Medical School</option>
                            </select>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="mb-3">
                            <label className="form-label">Skills Match</label>
                            <select className="form-select">
                              <option value="">Any Match</option>
                              <option>High Match (80%+)</option>
                              <option>Medium Match (50-79%)</option>
                              <option>Low Match (Below 50%)</option>
                            </select>
                          </div>
                        </Col>
                      </Row>
                      <Button variant="primary">Apply Filters</Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          
            <Row>
              <Col>
                <h4>{opportunities.length} Opportunities Found</h4>
                {opportunities.map((opportunity) => (
                  <Card key={opportunity.id} className="mb-3 opportunity-card">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <div className="mb-2">
                            <Badge bg="primary" className="me-2">{opportunity.research_area}</Badge>
                            <Badge bg="success">Match Score: {opportunity.matchScore}%</Badge>
                          </div>
                          <h5>{opportunity.title}</h5>
                          <p className="text-muted mb-0">{opportunity.institution}</p>
                        </div>
                        <div className="deadline-badge">
                          <div className="deadline-date">
                            <small>Deadline</small>
                            <strong>{formatDate(opportunity.deadline)}</strong>
                          </div>
                        </div>
                      </div>
                      
                      <div className="skills-needed mt-3">
                        <small className="text-muted">Skills Needed:</small>
                        <div className="mt-1">
                          {opportunity.skills_needed.map((skill, index) => (
                            <Badge bg="light" text="dark" className="me-2 mb-2" key={index}>
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleApply(opportunity.id)}
                        >
                          Apply Now
                        </Button>
                        <Link to={`/opportunities/${opportunity.id}`}>
                          <Button variant="outline-primary" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </Col>
            </Row>
          </Container>
        )}
        
        {activeTab === 'projects' && (
          <Container fluid>
            <Row className="mb-4">
              <Col>
                <Card>
                  <Card.Body>
                    <h4>My Research Projects</h4>
                    <p className="text-muted">
                      Projects you're currently collaborating on.
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            <Row>
              <Col>
                {projects.length === 0 ? (
                  <Card className="text-center p-5">
                    <Card.Body>
                      <i className="bi bi-briefcase display-1 text-muted mb-3"></i>
                      <h3>No Active Projects</h3>
                      <p className="text-muted">
                        You're not currently collaborating on any research projects.
                      </p>
                      <Button variant="primary" size="lg" className="mt-3" onClick={() => setActiveTab('opportunities')}>
                        Find Opportunities
                      </Button>
                    </Card.Body>
                  </Card>
                ) : (
                  projects.map((project) => (
                    <Card key={project._id} className="mb-3 project-card">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="d-flex mb-2">
                              <Badge bg="primary" className="me-2">{project.research_area}</Badge>
                              <Badge bg={getRoleColor(project.role || '')}>
                                {project.role || 'Collaborator'}
                              </Badge>
                            </div>
                            <h5>{project.title}</h5>
                            <p className="text-muted mb-2">
                              {project.description?.length > 150 
                                ? `${project.description.substring(0, 150)}...` 
                                : project.description}
                            </p>
                            <div className="project-meta">
                              <span className="me-3">
                                <FiUsers className="me-1" /> 
                                {project.institution || 'Unknown Institution'}
                              </span>
                              <span>
                                {project.start_date && project.end_date ? 
                                  `${formatDate(project.start_date)} - ${formatDate(project.end_date)}` :
                                  'Dates not specified'}
                              </span>
                            </div>
                          </div>
                          <Badge bg={project.status === 'Active' ? 'success' : 'warning'}>
                            {project.status || 'Active'}
                          </Badge>
                        </div>
                        <div className="mt-3">
                          <Link to={`/projects/${project._id}`}>
                            <Button variant="outline-primary" size="sm" className="me-2">
                              View Project
                            </Button>
                          </Link>
                          <Link to={`/projects/${project._id}/tasks`}>
                            <Button variant="outline-secondary" size="sm">
                              My Tasks
                            </Button>
                          </Link>
                        </div>
                      </Card.Body>
                    </Card>
                  ))
                )}
              </Col>
            </Row>
          </Container>
        )}

        {activeTab === 'calendar' && (
          <Container fluid>
            <Row className="mb-4">
              <Col>
                <h4 className="mb-3">Collaborator Project Calendar</h4>
                <p className="text-muted">
                  View all your research projects with their start and end dates. Easily keep track of important milestones.
                </p>
              </Col>
            </Row>
            <Row>
              <Col>
                <Calendar projects={projects} />
              </Col>
            </Row>
            <Row className="mt-4">
              <Col md={6}>
                <Card>
                  <Card.Body>
                    <h5>Upcoming Deadlines</h5>
                    <div className="calendar-deadlines">
                      {upcomingDeadlines.map(project => {
                        const date = formatDeadlineDate(project.end_date);
                        const isPastDeadline = new Date(project.end_date) < new Date();
                        
                        return (
                          <div className="deadline-item" key={project._id}>
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
                      })}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card>
                  <Card.Body>
                    <h5>Project Timeline</h5>
                    <p className="text-muted">View your project timeline and manage deadlines effectively.</p>
                    <Button variant="primary" onClick={() => navigate('/projects')}>
                      Manage Projects
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        )}
        
        {(activeTab !== 'overview' && activeTab !== 'opportunities' && activeTab !== 'projects') && (
          <div className="text-center py-5">
            <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
            <p className="text-muted">This section is under development.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaboratorDashboard;