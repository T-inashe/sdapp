import React, { useState, useEffect, useContext, useRef } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Badge, Table } from 'react-bootstrap';
import { FiPlus, FiX, FiEdit2, FiTrash2 } from 'react-icons/fi';
import AuthContext from '../../context/AuthContext';
import axios from 'axios';
import config from '../../config';

// Import necessary components for widgets
// import Calendar from './Calendar';

// Widget types definition
type WidgetType = 
  | 'projects' 
  | 'milestones' 
  | 'funding' 
  | 'notifications' 
  | 'collaborators'
  | 'skills';

interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  size: 'small' | 'medium' | 'large';
  position: number;
}

interface DashboardState {
  widgets: WidgetConfig[];
}

// Define types for our state objects
type Project = {
  _id: string;
  title: string;
  research_area: string;
  institution?: string;
  end_date: string;
  description?: string;
  start_date?: string;
  // Add other project properties as needed
};

interface Notification {
  id: string;
  message: string;
  type: string;
  date: string;
}

interface Milestone {
  _id?: string;
  projectId: number;
  title: string;
  description: string;
  dueDate: string;
  status: 'not started' | 'in progress' | 'completed';
  assignedTo: string;
  createdAt?: string;
}
// Define funding types
interface FundingSource {
  _id?: string;
  name: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | string;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed';
  startDate: string;
  endDate: string;
  projectId?: string;
  description?: string;
  agency?: string;
}

const WIDGET_OPTIONS = [
  { value: 'projects', label: 'My Projects' },
  { value: 'milestones', label: 'Milestones' },
  { value: 'funding', label: 'Funding' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'collaborators', label: 'Collaborators' },
  // { value: 'calendar', label: 'Calendar' },
  { value: 'skills', label: 'Skills Profile' }
];

const MyDashboard: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    widgets: []
  });
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [newWidget, setNewWidget] = useState<{
    type: WidgetType | '';
    size: 'small' | 'medium' | 'large';
  }>({
    type: '',
    size: 'medium'
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);

  // Load dashboard configuration from localStorage or set default on first load
  useEffect(() => {
    setIsLoading(true);
    
    // Try to load dashboard configuration from localStorage
    const savedDashboard = localStorage.getItem(`dashboard_${user?.id}`);
    
    if (savedDashboard) {
      try {
        setDashboardState(JSON.parse(savedDashboard));
      } catch (err) {
        console.error('Failed to parse saved dashboard configuration:', err);
        // Set default dashboard if parsing fails
        setDefaultDashboard();
      }
    } else {
      // Set default dashboard for first time users
      setDefaultDashboard();
    }
    
    // Fetch necessary data for widgets
    fetchDashboardData();
  }, [user?.id]);

  const setDefaultDashboard = () => {
    const defaultWidgets: WidgetConfig[] = [
      { id: 'widget_1', type: 'projects', title: 'My Projects', size: 'medium', position: 0 },
      { id: 'widget_2', type: 'notifications', title: 'Notifications', size: 'small', position: 1 },
      { id: 'widget_3', type: 'milestones', title: 'Milestones', size: 'medium', position: 2 }
    ];
    
    const newDashboardState = { widgets: defaultWidgets };
    setDashboardState(newDashboardState);
    
    // Save to localStorage
    localStorage.setItem(`dashboard_${user?.id}`, JSON.stringify(newDashboardState));
  };

  const fetchDashboardData = async () => {
      // Fetch funding sources
      try {
        const fundingResponse = await axios.get(`${config.API_URL}/api/funding/user/${user?.id}`, {
          withCredentials: true
        });
        
        if (fundingResponse.data && Array.isArray(fundingResponse.data)) {
          setFundingSources(fundingResponse.data);
        }
      } catch (error) {
        console.error('Error fetching funding sources:', error);
        // Use mock data if API isn't available
        const mockFunding: FundingSource[] = [
          {
            _id: '1',
            name: 'NSF Research Grant',
            amount: 250000,
            currency: 'USD',
            status: 'approved',
            startDate: '2025-01-01',
            endDate: '2026-12-31',
            agency: 'National Science Foundation',
            description: 'Machine Learning Research Project'
          },
          {
            _id: '2',
            name: 'University Seed Grant',
            amount: 50000,
            currency: 'USD',
            status: 'disbursed',
            startDate: '2024-09-01',
            endDate: '2025-08-31',
            agency: 'University Research Office',
            description: 'Data Analysis Infrastructure'
          },
          {
            _id: '3',
            name: 'Industry Partnership',
            amount: 100000,
            currency: 'USD',
            status: 'pending',
            startDate: '2025-06-01',
            endDate: '2026-05-31',
            agency: 'Tech Company Inc.',
            description: 'Applied AI Research Collaboration'
          }
        ];
        setFundingSources(mockFunding);
      }

    try {
      // Fetch projects
      const projectResponse = await axios.get(`${config.API_URL}/api/createproject/creator/${user?.id}`, {
        withCredentials: true
      });
      
      if (projectResponse.data) {
        setProjects(projectResponse.data);
        if (projectResponse.data.length > 0) {
          setSelectedProject(projectResponse.data[0]._id);
          fetchMilestones(projectResponse.data[0]._id);
        }
      }

      // Fetch notifications
      try {
        const userId = user?.id;
        const response = await axios.get(`${config.API_URL}/api/notifications?user=${userId}`);
        const dbNotifications: Notification[] = Array.isArray(response.data)
          ? response.data.map((notif: any) => ({
              id: notif._id,
              message: notif.message,
              type: notif.type || 'info',
              date: new Date(notif.date || notif.createdAt).toISOString().split('T')[0]
            }))
          : [];

        setNotifications(dbNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

const fetchMilestones = async (projectId: number) => {
  setIsLoading(true);
  try {
    // First try to get milestones from the API
    try {
      const response = await axios.get(`${config.API_URL}/api/milestones?projectId=${projectId}`, {
        withCredentials: true
      });
      
      if (response.data && Array.isArray(response.data)) {
        setMilestones(response.data);
        setIsLoading(false);
        return; // Exit early if we successfully got data
      }
    } catch (apiError) {
      // Silently fail and continue to use mock data
      console.log('API endpoint for milestones not available, using mock data instead');
    }
    
    // If we get here, either the API call failed or returned invalid data
    // Use mock data as fallback
    const mockMilestones = [
      {
        _id: '1',
        projectId: projectId,
        title: 'Literature Review',
        description: 'Complete comprehensive literature review',
        dueDate: '2025-06-15',
        status: 'completed' as const,
        assignedTo: user?.name || 'Team Member',
        createdAt: '2025-05-01'
      },
      {
        _id: '2',
        projectId: projectId,
        title: 'Data Collection',
        description: 'Gather and organize research data',
        dueDate: '2025-07-30',
        status: 'in progress' as const,
        assignedTo: user?.name || 'Team Member',
        createdAt: '2025-05-01'
      },
      {
        _id: '3',
        projectId: projectId,
        title: 'Analysis',
        description: 'Analyze collected data',
        dueDate: '2025-08-15',
        status: 'not started' as const,
        assignedTo: user?.name || 'Team Member',
        createdAt: '2025-05-01'
      }
    ];
    setMilestones(mockMilestones);
  } catch (err) {
    console.error('Unexpected error in fetchMilestones:', err);
    // Set empty milestones array in case of unexpected errors
    setMilestones([]);
  } finally {
    setIsLoading(false);
  }
};


  const handleAddWidget = () => {
    if (!newWidget.type) return;
    
    const widgetId = `widget_${Date.now()}`;
    const widgetConfig: WidgetConfig = {
      id: widgetId,
      type: newWidget.type as WidgetType,
      title: WIDGET_OPTIONS.find(option => option.value === newWidget.type)?.label || 'Widget',
      size: newWidget.size,
      position: dashboardState.widgets.length
    };
    
    const updatedWidgets = [...dashboardState.widgets, widgetConfig];
    const updatedDashboardState = { ...dashboardState, widgets: updatedWidgets };
    
    setDashboardState(updatedDashboardState);
    localStorage.setItem(`dashboard_${user?.id}`, JSON.stringify(updatedDashboardState));
    
    // Reset and close modal
    setNewWidget({ type: '', size: 'medium' });
    setShowAddWidget(false);
  };

  const handleRemoveWidget = (widgetId: string) => {
    const updatedWidgets = dashboardState.widgets.filter(widget => widget.id !== widgetId);
    
    // Update positions
    const repositionedWidgets = updatedWidgets.map((widget, index) => ({
      ...widget,
      position: index
    }));
    
    const updatedDashboardState = { ...dashboardState, widgets: repositionedWidgets };
    
    setDashboardState(updatedDashboardState);
    localStorage.setItem(`dashboard_${user?.id}`, JSON.stringify(updatedDashboardState));
  };

  // Render appropriate widget based on its type
  const renderWidget = (widget: WidgetConfig) => {
    switch (widget.type) {
      case 'projects':
        return renderProjectsWidget(widget);
      case 'notifications':
        return renderNotificationsWidget(widget);
      case 'milestones':
        return renderMilestonesWidget(widget);
      case 'funding':
        return renderFundingWidget(widget);
      case 'collaborators':
      //   return renderCollaboratorsWidget(widget);
      // case 'calendar':
        return renderCalendarWidget(widget);
      case 'skills':
        return renderSkillsProfileWidget(widget);
      default:
        return <p>Unknown widget type</p>;
    }
  };

  const getColumnSize = (size: string) => {
    switch (size) {
      case 'small':
        return 4;
      case 'large':
        return 12;
      case 'medium':
      default:
        return 6;
    }
  };

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in progress':
        return 'warning';
      case 'not started':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Individual widget renderers
  const renderProjectsWidget = (widget: WidgetConfig) => {
    return (
      <Card className="h-100">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">My Projects</h5>
        </Card.Header>
        <Card.Body>
          {projects.length === 0 ? (
            <p className="text-center text-muted">No active projects found.</p>
          ) : (
            projects.slice(0, 3).map((project: Project) => (
              <div key={project._id} className="mb-3 border-bottom pb-2">
                <h6>{project.title}</h6>
                <p className="text-muted small mb-1">{project.research_area}</p>
                <div className="d-flex justify-content-between align-items-center">
                  <small>{project.institution || 'No institution'}</small>
                  <small>{new Date(project.end_date).toLocaleDateString()}</small>
                </div>
              </div>
            ))
          )}
        </Card.Body>
        <Card.Footer className="text-center">
          <Button variant="outline-primary" size="sm">View All Projects</Button>
        </Card.Footer>
      </Card>
    );
  };

  const renderNotificationsWidget = (widget: WidgetConfig) => {
    return (
      <Card className="h-100">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Notifications</h5>
        </Card.Header>
        <Card.Body>
          {notifications.length === 0 ? (
            <p className="text-center text-muted">No notifications.</p>
          ) : (
            notifications.slice(0, 5).map((notification: Notification) => (
              <div key={notification.id} className="mb-2 border-bottom pb-2">
                <p className="mb-1 small">{notification.message}</p>
                <small className="text-muted">{notification.date}</small>
              </div>
            ))
          )}
        </Card.Body>
        <Card.Footer className="text-center">
          <Button variant="outline-primary" size="sm">View All Notifications</Button>
        </Card.Footer>
      </Card>
    );
  };

  const renderMilestonesWidget = (widget: WidgetConfig) => {
    return (
      <Card className="h-100">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Milestones</h5>
          {projects.length > 0 && (
            <Form.Select 
              size="sm"
              value={selectedProject || ''}
              onChange={(e) => {
                const projectId = Number(e.target.value);
                setSelectedProject(projectId);
                fetchMilestones(projectId);
              }}
              style={{ width: '150px' }}
            >
              {projects.map(project => (
                <option key={project._id} value={project._id}>{project.title}</option>
              ))}
            </Form.Select>
          )}
        </Card.Header>
        <Card.Body>
          {projects.length === 0 ? (
            <p className="text-center text-muted">No projects available to display milestones.</p>
          ) : milestones.length === 0 ? (
            <p className="text-center text-muted">No milestones found for this project.</p>
          ) : (
            <div className="milestone-list">
              {milestones.slice(0, 3).map((milestone) => (
                <div key={milestone._id} className="mb-3 border-bottom pb-2">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <h6>{milestone.title}</h6>
                    <Badge bg={getStatusVariant(milestone.status)}>
                      {milestone.status}
                    </Badge>
                  </div>
                  <p className="text-muted small mb-1">{milestone.description}</p>
                  <div className="d-flex justify-content-between align-items-center">
                    <small>Due: {formatDate(milestone.dueDate)}</small>
                    <small>Assigned to: {milestone.assignedTo}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
        <Card.Footer className="text-center">
          <Button variant="outline-primary" size="sm">View All Milestones</Button>
        </Card.Footer>
      </Card>
    );
  };

  const renderFundingWidget = (widget: WidgetConfig) => {
    const totalFunding = fundingSources.reduce((sum, funding) => sum + funding.amount, 0);
    const activeFunding = fundingSources.filter(funding => 
      funding.status === 'approved' || funding.status === 'disbursed'
    );
    
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'approved': return 'success';
        case 'disbursed': return 'primary';
        case 'pending': return 'warning';
        case 'rejected': return 'danger';
        default: return 'secondary';
      }
    };

    const formatCurrency = (amount: number, currency: string) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD'
      }).format(amount);
    };

    return (
      <Card className="h-100">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Funding</h5>
          <Badge bg="info">{activeFunding.length} Active</Badge>
        </Card.Header>
        <Card.Body>
          {fundingSources.length === 0 ? (
            <div className="text-center text-muted">
              <p>No funding sources available.</p>
              <Button variant="outline-primary" size="sm">
                Add Funding Source
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-3 p-3 bg-light rounded">
                <h6 className="mb-2">Total Funding</h6>
                <h4 className="text-primary mb-0">
                  {formatCurrency(totalFunding, 'USD')}
                </h4>
                <small className="text-muted">
                  {activeFunding.length} of {fundingSources.length} sources active
                </small>
              </div>
              
              <div className="funding-list">
                {fundingSources.slice(0, widget.size === 'small' ? 2 : 3).map((funding) => (
                  <div key={funding._id} className="mb-3 border-bottom pb-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <h6 className="mb-0">{funding.name}</h6>
                      <Badge bg={getStatusColor(funding.status)}>
                        {funding.status}
                      </Badge>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold text-success">
                        {formatCurrency(funding.amount, funding.currency)}
                      </span>
                      <small className="text-muted">{funding.agency}</small>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        {formatDate(funding.startDate)} - {formatDate(funding.endDate)}
                      </small>
                      <small className="text-muted">
                        {Math.round((new Date(funding.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                      </small>
                    </div>
                    
                    {funding.description && (
                      <p className="text-muted small mb-0 mt-1">{funding.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card.Body>
        <Card.Footer className="text-center">
          <Button variant="outline-primary" size="sm">
            Manage Funding
          </Button>
        </Card.Footer>
      </Card>
    );
  };

  const renderCollaboratorsWidget = (widget: WidgetConfig) => {
    return (
      <Card className="h-100">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Collaborators</h5>
        </Card.Header>
        <Card.Body>
          <p className="text-center text-muted">Your collaborators will appear here.</p>
        </Card.Body>
      </Card>
    );
  };

  const renderCalendarWidget = (widget: WidgetConfig) => {
    return (
      <Card className="h-100">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Calendar</h5>
        </Card.Header>
        <Card.Body>
          <p className="text-center text-muted">Calendar functionality will be added here.</p>
        </Card.Body>
      </Card>
    );
  };

  const renderSkillsProfileWidget = (widget: WidgetConfig) => {
    return (
      <Card className="h-100">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Skills Profile</h5>
        </Card.Header>
        <Card.Body>
          <div className="skills-section">
            <h6>Research Areas</h6>
            <div className="mb-3">
              <span className="badge bg-primary me-2 mb-2">Machine Learning</span>
              <span className="badge bg-primary me-2 mb-2">Data Analysis</span>
              <span className="badge bg-primary me-2 mb-2">Neuroscience</span>
            </div>
            
            <h6>Technical Skills</h6>
            <div className="mb-3">
              <span className="badge bg-secondary me-2 mb-2">Python</span>
              <span className="badge bg-secondary me-2 mb-2">R</span>
              <span className="badge bg-secondary me-2 mb-2">Statistical Analysis</span>
              <span className="badge bg-secondary me-2 mb-2">MATLAB</span>
            </div>
          </div>
        </Card.Body>
        <Card.Footer className="text-center">
          <Button variant="outline-primary" size="sm">Edit Skills</Button>
        </Card.Footer>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading your dashboard...</p>
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
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>My Dashboard</h3>
        <Button 
          variant="primary" 
          className="d-flex align-items-center"
          onClick={() => setShowAddWidget(true)}
        >
          <FiPlus className="me-2" /> Add Widget
        </Button>
      </div>

      <p className="text-muted mb-4">
        Customize your dashboard by adding or removing widgets to monitor the specific metrics 
        and information that matter most to you.
      </p>

      <Row className="g-4">
        {dashboardState.widgets
          .sort((a, b) => a.position - b.position)
          .map((widget) => (
            <Col 
              key={widget.id}
              md={getColumnSize(widget.size)}
              className="mb-4"
            >
              <div className="widget-wrapper">
                <div className="widget-header d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center">
                    <span className="text-muted small">{widget.title}</span>
                  </div>
                  <Button 
                    variant="link" 
                    className="text-danger p-0" 
                    onClick={() => handleRemoveWidget(widget.id)}
                  >
                    <FiX />
                  </Button>
                </div>
                {renderWidget(widget)}
              </div>
            </Col>
          ))}
      </Row>

      {/* Add Widget Modal */}
      <Modal show={showAddWidget} onHide={() => setShowAddWidget(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Widget</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Widget Type</Form.Label>
              <Form.Select 
                value={newWidget.type} 
                onChange={(e) => setNewWidget({...newWidget, type: e.target.value as WidgetType})}
              >
                <option value="">Select Widget Type</option>
                {WIDGET_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Widget Size</Form.Label>
              <Form.Select 
                value={newWidget.size} 
                onChange={(e) => setNewWidget({...newWidget, size: e.target.value as 'small' | 'medium' | 'large'})}
              >
                <option value="small">Small (1/3 width)</option>
                <option value="medium">Medium (1/2 width)</option>
                <option value="large">Large (Full width)</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddWidget(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddWidget}
            disabled={!newWidget.type}
          >
            Add Widget
          </Button>
        </Modal.Footer>
      </Modal>

      {/* CSS styles */}
      <style>{`
        .widget-wrapper {
          padding: 8px;
          border-radius: 4px;
          border: 2px solid transparent;
        }
           .funding-list .border-bottom:last-child {
          border-bottom: none !important;
        }
        
        .bg-light {
          background-color: #f8f9fa !important;
        }
      `}</style>
    </Container>
  );
};

export default MyDashboard;