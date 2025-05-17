import React, { useState, useEffect, useContext,useRef } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, Table, Modal, ProgressBar, Alert } from 'react-bootstrap';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FiPlus, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi';
import axios from 'axios';
import config from '../../config';
import AuthContext from '../../context/AuthContext';

interface Project {
  _id: string;
  title: string;
}

interface Milestone {
  _id?: string;
  projectId: string; 
  title: string;
  description: string;
  dueDate: string;
  status: 'not started' | 'in progress' | 'completed';
  assignedTo: string;
  createdAt?: string;
}

const MilestoneDashboard: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<Milestone>({
    projectId: '', // Default value to satisfy the type
    title: '',
    description: '',
    dueDate: '',
    status: 'not started',
    assignedTo: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

const handleExportPDF = async () => {
  if (!reportRef.current) return;

  setExporting(true);

  try {
    // @ts-ignore
    const html2canvas = window.html2canvas;
    // @ts-ignore
    const { jsPDF } = window.jspdf;

    const canvas = await html2canvas(reportRef.current, {
      scale: 2, // Higher quality
      useCORS: true, // Support for external images/fonts
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Calculate image dimensions to fit A4
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('report.pdf');
  } catch (err) {
    console.error('PDF export error:', err);
  } finally {
    setExporting(false);
  }
};


  // Colors for pie chart
  const COLORS = ['#dc3545', '#ffc107', '#198754'];

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchMilestones(selectedProject);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${config.API_URL}/api/createproject/creator/${user?.id}`, {
        withCredentials: true
      });
      
      if (response.data && response.data.length > 0) {
        setProjects(response.data);
        // Auto-select the first project
        setSelectedProject(response.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Error fetching projects. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMilestones = async (projectId: string) => {
    setIsLoading(true);
    try {
      // In a real application, this would be a real API endpoint
      const response = await axios.get(`${config.API_URL}/api/milestone/project/${projectId}`, {
        withCredentials: true
      });
      setMilestones(response.data);
     
    } catch (err) {
      console.error('Failed to fetch milestones:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentMilestone({
      ...currentMilestone,
      [name]: value
    });
  };

const saveMilestone = async () => {
  try {
    if (!selectedProject) {
      setError('No project selected. Please select a project first.');
      return;
    }

    const milestoneToSave = {
      ...currentMilestone,
      projectId: selectedProject
    };

    if (isEditing && currentMilestone._id) {
      // Update existing milestone
      const response = await axios.put(
        `${config.API_URL}/api/milestone/${currentMilestone._id}`,
        milestoneToSave,
        { withCredentials: true }
      );

      // Update local state with API response
      setMilestones(milestones.map(m =>
        m._id === currentMilestone._id ? response.data : m
      ));
    } else {
      console.log(milestoneToSave)
      // Create new milestone
      const response = await axios.post(
        `${config.API_URL}/api/milestone`,
        milestoneToSave,
        { withCredentials: true }
      );

      setMilestones([...milestones, response.data]);
    }

    setShowModal(false);
    resetForm();
  } catch (err) {
    console.error('Failed to save milestone:', err);
    setError('Failed to save milestone. Please try again.');
  }
};


  const editMilestone = (milestone: Milestone) => {
    setCurrentMilestone(milestone);
    setIsEditing(true);
    setShowModal(true);
  };

  const deleteMilestone = async (id: string) => {
    try {
      await axios.delete(`${config.API_URL}/api/milestone/${id}`, {
        withCredentials: true
      });
      
      // Update local state
      setMilestones(milestones.filter(m => m._id !== id));
    } catch (err) {
      console.error('Failed to delete milestone:', err);
    }
  };

  const updateMilestoneStatus = async (id: string, newStatus: 'not started' | 'in progress' | 'completed') => {
    try {
      await axios.put(`${config.API_URL}/api/milestone/${id}`, { status: newStatus }, {
        withCredentials: true
      });
      
      // Update local state
      setMilestones(milestones.map(m => 
        m._id === id ? { ...m, status: newStatus } : m
      ));
    } catch (err) {
      console.error('Failed to update milestone status:', err);
    }
  };
  const resetForm = () => {
    // Ensure we have a valid default projectId
    setCurrentMilestone({
      projectId: "", 
      title: '',
      description: '',
      dueDate: '',
      status: 'not started',
      assignedTo: ''
    });
    setIsEditing(false);
  };

  const openNewMilestoneModal = () => {
    if (!selectedProject) {
      setError('Please select a project first before adding milestones.');
      return;
    }
    resetForm();
    setShowModal(true);
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

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate milestone statistics
  const getMilestoneStats = () => {
    const completed = milestones.filter(m => m.status === 'completed').length;
    const inProgress = milestones.filter(m => m.status === 'in progress').length;
    const notStarted = milestones.filter(m => m.status === 'not started').length;
    const total = milestones.length;
    
    const completedPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      stats: [
        { name: 'Not Started', value: notStarted },
        { name: 'In Progress', value: inProgress },
        { name: 'Completed', value: completed }
      ],
      completedPercentage
    };
  };

  const { stats, completedPercentage } = getMilestoneStats();

  return (
    <Container fluid  ref={reportRef}>
      <Row className="mb-4">
        <Col>
          <Card >
            <Card.Body >
              <div className="d-flex justify-content-between align-items-center mb-3" >
                <h4>Project Milestones</h4>
                <div>
                  <Form.Select 
                  value={selectedProject || ''} 
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="d-inline-block me-2"
                  style={{ width: 'auto' }}
                >
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>
                      {project.title}
                    </option>
                  ))}
                </Form.Select>

                  <Button variant="primary" onClick={openNewMilestoneModal}>
                    <FiPlus className="me-1" /> New Milestone
                  </Button>

                <Button 
                  onClick={handleExportPDF} 
                  disabled={exporting} 
                  variant="success" 
                  style={{ marginLeft: '1rem' }}
                  >
                  {exporting ? 'Exporting...' : 'Export as PDF'}
                  </Button>

                </div>
              </div>
              <p className="text-muted">
                Track the progress of your research project by creating and managing milestones.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {isLoading ? (
        <Row>
          <Col className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading milestone data...</p>
          </Col>
        </Row>
      ) : error ? (
        <Row>
          <Col>
            <Alert variant="danger">{error}</Alert>
          </Col>
        </Row>
      ) : (
        <>
          <Row className="mb-4">
            <Col md={8}>
              <Card >
                <Card.Body>
                  <h5 className="mb-3">Milestone Timeline</h5>
                  {milestones.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="display-6 text-muted mb-3">No milestones yet</div>
                      <p>Create your first milestone to start tracking project progress.</p>
                      <Button variant="primary" onClick={openNewMilestoneModal}>
                        <FiPlus className="me-1" /> Add First Milestone
                      </Button>
                    </div>
                  ) : (
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Due Date</th>
                          <th>Assigned To</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {milestones.map((milestone) => (
                          <tr key={milestone._id}>
                            <td>
                              <div className="fw-bold">{milestone.title}</div>
                              <small className="text-muted">{milestone.description}</small>
                            </td>
                            <td>{formatDate(milestone.dueDate)}</td>
                            <td>{milestone.assignedTo}</td>
                            <td>
                              <Form.Select
                                size="sm"
                                value={milestone.status}
                                onChange={(e) => updateMilestoneStatus(milestone._id as string, e.target.value as 'not started' | 'in progress' | 'completed')}
                                className={`bg-${getStatusVariant(milestone.status)}`}
                                style={{ maxWidth: '150px' }}
                              >
                                <option value="not started">Not Started</option>
                                <option value="in progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </Form.Select>
                            </td>
<td className="d-flex">
  <Button
    variant="outline-primary"
    size="sm"
    className="me-2"
    onClick={() => editMilestone(milestone)}
  >
    <FiEdit2 />
  </Button>
  <Button
    variant="outline-danger"
    size="sm"
    onClick={() => deleteMilestone(milestone._id as string)}
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
            </Col>
            <Col md={4}>
              <Card className="mb-4">
                <Card.Body>
                  <h5 className="mb-3">Project Progress</h5>
                  {milestones.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={stats}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={70}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {stats.map((_entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span>Overall Completion</span>
                          <span>{completedPercentage}%</span>
                        </div>
                        <ProgressBar now={completedPercentage} variant="success" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted">Add milestones to see project progress</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
              <Card>
<Card.Body className="fs-6">
  <h5 className="mb-3 small">Milestone Statistics</h5>
  <div className="d-flex justify-content-between mb-2 small">
    <span>Total Milestones</span>
    <span>{milestones.length}</span>
  </div>
  <div className="d-flex justify-content-between mb-2 small">
    <span>Completed</span>
    <Badge bg="success">{stats[2].value}</Badge>
  </div>
  <div className="d-flex justify-content-between mb-2 small">
    <span>In Progress</span>
    <Badge bg="warning">{stats[1].value}</Badge>
  </div>
  <div className="d-flex justify-content-between small">
    <span>Not Started</span>
    <Badge bg="danger">{stats[0].value}</Badge>
  </div>
</Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Milestone Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit Milestone' : 'Create New Milestone'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={currentMilestone.title}
                onChange={handleInputChange}
                placeholder="Enter milestone title"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={currentMilestone.description}
                onChange={handleInputChange}
                placeholder="Describe the milestone"
                rows={3}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Due Date</Form.Label>
              <Form.Control
                type="date"
                name="dueDate"
                value={currentMilestone.dueDate}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={currentMilestone.status}
                onChange={handleInputChange}
              >
                <option value="not started">Not Started</option>
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Assigned To</Form.Label>
              <Form.Control
                type="text"
                name="assignedTo"
                value={currentMilestone.assignedTo}
                onChange={handleInputChange}
                placeholder="Enter person responsible"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveMilestone}>
            {isEditing ? 'Update Milestone' : 'Create Milestone'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MilestoneDashboard;