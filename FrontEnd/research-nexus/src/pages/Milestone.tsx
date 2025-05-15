// src/pages/Milestones.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Alert, Table } from 'react-bootstrap';
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiCheck, FiClock } from 'react-icons/fi';
import { getMilestonesByProject, createMilestone, updateMilestone, deleteMilestone } from '../../api/milestones';
import StatusPieChart from '../components/StatusPieChart';
import { Project } from '../components/dashboard/CollaboratorDashboard';
import './Milestones.css';

interface Milestone {
  id: string;
  title: string;
  description: string;
  expectedCompletion: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  assignedTo?: string;
  projectId: string;
}

const Milestones: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [project] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');


  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const milestonesData = await getMilestonesByProject(projectId!);
        setMilestones(milestonesData);
      } catch (err) {
        setError('Failed to load milestones');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const handleCreate = async (milestone: Omit<Milestone, 'id'>) => {
    try {
      const newMilestone = await createMilestone({
        ...milestone,
        projectId: projectId!
      });
      setMilestones([...milestones, newMilestone]);
      setShowForm(false);
    } catch (err) {
      setError('Failed to create milestone');
      console.error(err);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Milestone>) => {
    try {
      const updatedMilestone = await updateMilestone(id, updates);
      setMilestones(milestones.map(m => 
        m.id === id ? { ...m, ...updatedMilestone } : m
      ));
      setEditingMilestone(null);
    } catch (err) {
      setError('Failed to update milestone');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMilestone(id);
      setMilestones(milestones.filter(m => m.id !== id));
    } catch (err) {
      setError('Failed to delete milestone');
      console.error(err);
    }
  };

  const handleStatusChange = (id: string, status: Milestone['status']) => {
    handleUpdate(id, { status });
  };

  // Calculate status data for pie chart
  const statusData = {
    completed: milestones.filter(m => m.status === 'Completed').length,
    inProgress: milestones.filter(m => m.status === 'In Progress').length,
    notStarted: milestones.filter(m => m.status === 'Not Started').length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading milestones...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="milestones-container">
      {/* Header */}
      <Row className="mb-4 align-items-center">
        <Col>
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate('/dashboard?tab=projects')} // Matches your dashboard structure
          className="d-flex align-items-center"
        >
          <FiArrowLeft className="me-2" /> Back to Projects
      </Button>
        </Col>
        <Col className="text-end">
          <Button 
            variant="primary"
            onClick={() => {
              setEditingMilestone(null);
              setShowForm(true);
            }}
            className="d-flex align-items-center"
          >
            <FiPlus className="me-2" /> Add Milestone
          </Button>
        </Col>
      </Row>

      {/* Project Info */}
      {project && (
        <Card className="mb-4">
          <Card.Body>
            <h2>{project.title}</h2>
            <div className="d-flex align-items-center mb-3">
              <Badge bg="primary" className="me-2">{project.research_area}</Badge>
              <span className="text-muted">
                {formatDate(project.start_date)} - {formatDate(project.end_date)}
              </span>
            </div>
            <p>{project.description}</p>
          </Card.Body>
        </Card>
      )}

      {/* Progress Overview */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Milestone Progress</Card.Title>
              <div style={{ height: '300px' }}>
                <StatusPieChart data={statusData} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Status Summary</Card.Title>
              <div className="status-summary">
                <div className="status-item">
                  <Badge bg="success" className="status-badge">
                    <FiCheck />
                  </Badge>
                  <div>
                    <h5>{statusData.completed}</h5>
                    <p className="text-muted mb-0">Completed</p>
                  </div>
                </div>
                <div className="status-item">
                  <Badge bg="warning" className="status-badge">
                    <FiClock />
                  </Badge>
                  <div>
                    <h5>{statusData.inProgress}</h5>
                    <p className="text-muted mb-0">In Progress</p>
                  </div>
                </div>
                <div className="status-item">
                  <Badge bg="secondary" className="status-badge">
                    <FiClock />
                  </Badge>
                  <div>
                    <h5>{statusData.notStarted}</h5>
                    <p className="text-muted mb-0">Not Started</p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Milestones Table */}
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Card.Title>Project Milestones</Card.Title>
            <span className="text-muted">
              Showing {milestones.length} milestone{milestones.length !== 1 ? 's' : ''}
            </span>
          </div>

          {milestones.length === 0 ? (
            <Alert variant="info">
              No milestones yet. Click "Add Milestone" to create your first one.
            </Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Due Date</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map(milestone => (
                  <tr key={milestone.id}>
                    <td>{milestone.title}</td>
                    <td>{milestone.description || '-'}</td>
                    <td>{formatDate(milestone.expectedCompletion)}</td>
                    <td>{milestone.assignedTo || 'Unassigned'}</td>
                    <td>
                      <select
                        className={`form-select status-select ${milestone.status.toLowerCase().replace(' ', '-')}`}
                        value={milestone.status}
                        onChange={(e) => handleStatusChange(
                          milestone.id, 
                          e.target.value as Milestone['status']
                        )}
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => setEditingMilestone(milestone)}
                      >
                        <FiEdit2 />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(milestone.id)}
                      >
                        <FiTrash2 />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Milestone Form Modal */}
      {(showForm || editingMilestone) && (
        <div className="milestone-form-modal">
          <div className="milestone-form-container">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Card.Title>
                    {editingMilestone ? 'Edit Milestone' : 'Create New Milestone'}
                  </Card.Title>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={() => {
                      setEditingMilestone(null);
                      setShowForm(false);
                    }}
                  >
                    ×
                  </Button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const milestoneData = {
                    title: formData.get('title') as string,
                    description: formData.get('description') as string,
                    expectedCompletion: formData.get('dueDate') as string,
                    status: formData.get('status') as Milestone['status'],
                    assignedTo: formData.get('assignedTo') as string,
                    projectId: projectId!
                  };

                  if (editingMilestone) {
                    handleUpdate(editingMilestone.id, milestoneData);
                  } else {
                    handleCreate(milestoneData);
                  }
                }}>
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">Title*</label>
                    <input
                      type="text"
                      className="form-control"
                      id="title"
                      name="title"
                      required
                      defaultValue={editingMilestone?.title}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      id="description"
                      name="description"
                      rows={3}
                      defaultValue={editingMilestone?.description}
                    />
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="dueDate" className="form-label">Due Date*</label>
                      <input
                        type="date"
                        className="form-control"
                        id="dueDate"
                        name="dueDate"
                        required
                        defaultValue={editingMilestone?.expectedCompletion.split('T')[0]}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="status" className="form-label">Status*</label>
                      <select
                        className="form-select"
                        id="status"
                        name="status"
                        required
                        defaultValue={editingMilestone?.status || 'Not Started'}
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="assignedTo" className="form-label">Assigned To</label>
                    <input
                      type="text"
                      className="form-control"
                      id="assignedTo"
                      name="assignedTo"
                      defaultValue={editingMilestone?.assignedTo}
                    />
                  </div>

                  <div className="d-flex justify-content-end">
                    <Button
                      variant="secondary"
                      className="me-2"
                      onClick={() => {
                        setEditingMilestone(null);
                        setShowForm(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit">
                      {editingMilestone ? 'Update Milestone' : 'Create Milestone'}
                    </Button>
                  </div>
                </form>
              </Card.Body>
            </Card>
          </div>
        </div>
      )}
    </Container>
  );
};

export default Milestones;