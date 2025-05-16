import React, { useState, useEffect, useContext, useRef } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form } from 'react-bootstrap';
import { FiPlus, FiX, FiMove } from 'react-icons/fi';
import AuthContext from '../../context/AuthContext';
import axios from 'axios';
import config from '../../config';

// Import necessary components for widgets
import Calendar from './Calendar';

// Widget types definition
type WidgetType = 
  | 'projects' 
  | 'milestones' 
  | 'funding' 
  | 'notifications' 
  | 'collaborators'
  | 'calendar'
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

const WIDGET_OPTIONS = [
  { value: 'projects', label: 'My Projects' },
  { value: 'milestones', label: 'Milestones' },
  { value: 'funding', label: 'Funding' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'collaborators', label: 'Collaborators' },
  { value: 'calendar', label: 'Calendar' },
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null);

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
      { id: 'widget_3', type: 'skills', title: 'Skills Profile', size: 'small', position: 2 }
    ];
    
    const newDashboardState = { widgets: defaultWidgets };
    setDashboardState(newDashboardState);
    
    // Save to localStorage
    localStorage.setItem(`dashboard_${user?.id}`, JSON.stringify(newDashboardState));
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch projects
      const projectResponse = await axios.get(`${config.API_URL}/api/createproject/creator/${user?.id}`, {
        withCredentials: true
      });
      
      if (projectResponse.data) {
        setProjects(projectResponse.data);
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

  // New HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, widgetId: string) => {
    setDraggedWidgetId(widgetId);
    e.dataTransfer.effectAllowed = 'move';
    // Add some opacity to the dragged element
    if (e.currentTarget.classList) {
      e.currentTarget.classList.add('dragging');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, widgetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedWidgetId !== widgetId) {
      setDragOverWidgetId(widgetId);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, widgetId: string) => {
    e.preventDefault();
    if (draggedWidgetId !== widgetId) {
      setDragOverWidgetId(widgetId);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverWidgetId(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetWidgetId: string) => {
    e.preventDefault();
    
    if (!draggedWidgetId || draggedWidgetId === targetWidgetId) {
      return;
    }

    const sortedWidgets = [...dashboardState.widgets].sort((a, b) => a.position - b.position);
    
    const draggedIndex = sortedWidgets.findIndex(widget => widget.id === draggedWidgetId);
    const targetIndex = sortedWidgets.findIndex(widget => widget.id === targetWidgetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Remove dragged item
    const [draggedWidget] = sortedWidgets.splice(draggedIndex, 1);
    
    // Insert at new position
    sortedWidgets.splice(targetIndex, 0, draggedWidget);
    
    // Update positions
    const reorderedWidgets = sortedWidgets.map((widget, index) => ({
      ...widget,
      position: index
    }));
    
    const updatedDashboardState = { ...dashboardState, widgets: reorderedWidgets };
    
    setDashboardState(updatedDashboardState);
    localStorage.setItem(`dashboard_${user?.id}`, JSON.stringify(updatedDashboardState));
    
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.classList) {
      e.currentTarget.classList.remove('dragging');
    }
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
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
        return renderCollaboratorsWidget(widget);
      // case 'calendar':
      //   return renderCalendarWidget(widget);
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
        </Card.Header>
        <Card.Body>
          <p className="text-center text-muted">Your upcoming project milestones will appear here.</p>
        </Card.Body>
      </Card>
    );
  };

  const renderFundingWidget = (widget: WidgetConfig) => {
    return (
      <Card className="h-100">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Funding</h5>
        </Card.Header>
        <Card.Body>
          <p className="text-center text-muted">Your funding information will appear here.</p>
        </Card.Body>
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

  // const renderCalendarWidget = (widget: WidgetConfig) => {
  //   return (
  //     <Card className="h-100">
  //       <Card.Header className="d-flex justify-content-between align-items-center">
  //         <h5 className="mb-0">Calendar</h5>
  //       </Card.Header>
  //       <Card.Body>
  //         <Calendar projects={projects as unknown as CalendarProject[]} />
  //       </Card.Body>
  //     </Card>
  //   );
  // };

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
        Customize your dashboard by adding, removing, or rearranging widgets to monitor the specific metrics 
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
              <div 
                className={`widget-wrapper ${dragOverWidgetId === widget.id ? 'drag-over' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, widget.id)}
                onDragOver={(e) => handleDragOver(e, widget.id)}
                onDragEnter={(e) => handleDragEnter(e, widget.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, widget.id)}
                onDragEnd={handleDragEnd}
              >
                <div className="widget-header d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center widget-drag-handle">
                    <FiMove className="me-2 text-muted" />
                    <span className="text-muted small">Drag to reposition</span>
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

      {/* CSS styles for drag and drop */}
      <style>{`
        .widget-wrapper {
          transition: background-color 0.2s;
          padding: 8px;
          border-radius: 4px;
          border: 2px solid transparent;
        }
        
        .widget-wrapper.dragging {
          opacity: 0.5;
          cursor: move;
        }
        
        .widget-wrapper.drag-over {
          border: 2px dashed #007bff;
          background-color: rgba(0, 123, 255, 0.05);
        }
        
        .widget-drag-handle {
          cursor: move;
        }
      `}</style>
    </Container>
  );
};

export default MyDashboard;