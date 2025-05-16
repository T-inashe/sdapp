import React, { useContext, useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Nav, Modal, Form, Table, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { FiUsers, FiFileText, FiSettings, FiLogOut, FiCheckCircle, FiX, FiMessageSquare } from 'react-icons/fi';
import axios from 'axios';
import config from '../../config';

interface User {
  _id: string;
  fname: string;
  email: string;
  role: string;
  contact:string;
  department: string;
  createdAt: string;
}

interface Proposal {
  _id: string;
  title: string;
  description: string;
  research_goals: string;
  research_area: string;
  creator_email: string;
  creator: { _id: string; fname: string; lname: string; role:string };
  institution: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  assigned_reviewers?: string[];
  file: {
    data: "base64-string",
    contentType: "application/pdf",
    originalName: "proposal.pdf"
  } 
}

interface Reviewer {
  _id: string;
  fname: string;
  lname: string;
  expertise: string[];
  department: string;
}

const AdminDashboard: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
  const [showReviewerModal, setShowReviewerModal] = useState<boolean>(false);
  const [newRole, setNewRole] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      setIsLoading(true);
      try {
        // Fetch users data
        const usersResponse = await axios.get(`${config.API_URL}/api/users`, {
          withCredentials: true
        });
        if (usersResponse.data) {
          setUsers(usersResponse.data);
        }

        // Fetch proposals data
        const proposalsResponse = await axios.get(`${config.API_URL}/api/createproject/projects`, {
          withCredentials: true
        });
        if (proposalsResponse.data) {
          console.log(proposalsResponse.data)
          setProposals(proposalsResponse.data);
        }

        // Fetch reviewers (users with Reviewer role)
        const reviewersResponse = await axios.get(`${config.API_URL}/api/users/reviewer`, {
          withCredentials: true
        });
        if (reviewersResponse.data) {
          setReviewers(reviewersResponse.data);
        }

      } catch (error) {
        console.error('Error fetching admin data:', error);
        setErrorMessage('Error connecting to server');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRoleChange = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const submitRoleChange = async () => {
    if (!selectedUser) return;
    
    try {
      await axios.put(`${config.API_URL}/api/users/${selectedUser._id}`, {
        role: newRole
      }, {
        withCredentials: true
      });
      
      // Update local state
      setUsers(prevUsers => prevUsers.map(u => 
        u._id === selectedUser._id ? { ...u, role: newRole } : u
      ));
      
      setSuccessMessage(`${selectedUser.fname}'s role updated to ${newRole}`);
      
      // Close modal
      setShowRoleModal(false);
      
      // If user was made reviewer, refresh reviewers list
      if (newRole === 'Reviewer') {
        const updatedReviewers = await axios.get(`${config.API_URL}/api/users?role=Reviewer`, {
          withCredentials: true
        });
        setReviewers(updatedReviewers.data);
      }
    } catch (error) {
      console.error('Error updating role:', error);
      setErrorMessage('Failed to update user role');
    }
  };

  const handleViewProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
  };

  const handleAssignReviewers = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setSelectedReviewers(proposal.assigned_reviewers || []);
    setShowReviewerModal(true);
  };

  const handleReviewerSelection = (reviewerId: string) => {
    setSelectedReviewers(prev => {
      if (prev.includes(reviewerId)) {
        return prev.filter(id => id !== reviewerId);
      } else {
        return [...prev, reviewerId];
      }
    });
  };

  const submitReviewerAssignment = async () => {
    if (!selectedProposal || selectedReviewers.length === 0) return;
  
    try {
      // Loop through each selected reviewer and assign the proposal
      for (const reviewerId of selectedReviewers) {
        const reviewData = {
          reviewer: reviewerId,
          projectId:selectedProposal._id,
          creator: selectedProposal.creator._id,
          project_title: selectedProposal.title,
          research_goals:selectedProposal.research_goals,
          research_area: selectedProposal.research_area,
          description:selectedProposal.description,
          start_date: selectedProposal.start_date,
          end_date: selectedProposal.end_date,
          institution: selectedProposal.institution,
          status: selectedProposal.status,
          file: {
            data: selectedProposal.file.data,
            contentType: selectedProposal.file.contentType,
            originalName: selectedProposal.file.originalName
          },
          assigned: true,
        };
  
        const messageData = {
          user: reviewerId,
          message: `You've been assigned to review proposal: ${selectedProposal.title}`,
          type: 'AssignedReview',
          date: new Date().toISOString(),
        };
        console.log("Sending review data:", reviewData);
        console.log("Sending review data:", messageData);
  
        // Create review assignment
        await axios.post(`${config.API_URL}/api/review`, reviewData, {
          withCredentials: true,
        });
  
        // Send notification to reviewer
        await axios.post(`${config.API_URL}/api/notifications`,messageData, {
          withCredentials: true,
        });
      }
  
      // Update local proposal state with all assigned reviewers
      setProposals(prevProposals =>
        prevProposals.map(p =>
          p._id === selectedProposal._id
            ? { ...p, assigned_reviewers: selectedReviewers }
            : p
        )
      );
  
      setSuccessMessage(`Reviewers assigned to proposal: ${selectedProposal.title}`);
      setShowReviewerModal(false);
    } catch (error) {
      console.error('Error assigning reviewers:', error);
      setErrorMessage('Failed to assign reviewers');
    }
  };
  
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading admin dashboard...</p>
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
                {user?.name?.charAt(0) || 'A'}
              </div>
            )}
          </div>
          <h5>{user?.name}</h5>
          <p className="text-muted small">{user?.institution}</p>
          <Badge bg="danger">Administrator</Badge>
        </div>
        <Nav className="flex-column sidebar-nav">
          <Nav.Link
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            <FiUsers className="me-2" /> User Management
          </Nav.Link>
          <Nav.Link
            className={activeTab === 'proposals' ? 'active' : ''}
            onClick={() => setActiveTab('proposals')}
          >
            <FiFileText className="me-2" /> Proposals
          </Nav.Link>
          <Nav className="flex-column sidebar-nav">
                  <Nav.Link href="/allmessages">
                    <FiMessageSquare className="me-2" /> Message Users
                  </Nav.Link>
                  </Nav>
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
          <h2>Admin Dashboard</h2>
        </div>

        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
            {successMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="danger" onClose={() => setErrorMessage('')} dismissible>
            {errorMessage}
          </Alert>
        )}

        {activeTab === 'users' && (
          <Container fluid>
            <Row className="mb-4">
              <Col>
                <Card>
                  <Card.Body>
                    <h4>User Management</h4>
                    <p className="text-muted">View and manage user roles for the platform.</p>
                    
                    <Table responsive striped hover>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Institution</th>
                          <th>Contact</th>
                          <th>Joined</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(user => (
                          <tr key={user._id}>
                            <td>{user.fname}</td>
                            <td>{user.department}</td>
                            <td>{user.contact}</td>
                            <td>{user.role}</td>
                            <td>
                              <Badge bg={
                                user.role === 'Admin' ? 'danger' :
                                user.role === 'Reviewer' ? 'warning' : 'primary'
                              }>
                                {user.role}
                              </Badge>
                            </td>
                            <td>{formatDate(user.createdAt)}</td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => handleRoleChange(user)}
                              >
                                Edit Role
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        )}
        
        {activeTab === 'proposals' && (
          <Container fluid>
            <Row className="mb-4">
              <Col>
                <Card>
                  <Card.Body>
                    <h4>Research Proposals</h4>
                    <p className="text-muted">Review submitted proposals and assign reviewers.</p>
                    
                    <Table responsive striped hover>
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Research Area</th>
                          <th>Created By</th>
                          <th>Institution</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proposals.map(proposal => (
                          <tr key={proposal._id}>
                            <td>{proposal.title}</td>
                            <td>{proposal.research_area}</td>
                            <td>{proposal.creator.fname }  {proposal.creator.lname }</td>
                            <td>{proposal.institution}</td>
                            <td>
                              <Badge bg={
                                proposal.status === 'Approved' ? 'success' :
                                proposal.status === 'Rejected' ? 'danger' :
                                proposal.status === 'Under Review' ? 'warning' : 'info'
                              }>
                                {proposal.status || 'Pending'}
                              </Badge>
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                className="me-2"
                                onClick={() => handleViewProposal(proposal)}
                              >
                                View
                              </Button>
                              <Button 
                                variant="primary" 
                                size="sm"
                                onClick={() => handleAssignReviewers(proposal)}
                              >
                                Assign Reviewers
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {selectedProposal && (
              <Row className="mb-4">
                <Col>
                  <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Proposal Details</h5>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => setSelectedProposal(null)}
                      >
                        <FiX />
                      </Button>
                    </Card.Header>
                    <Card.Body>
                      <h4>{selectedProposal.title}</h4>
                      <Badge bg="primary" className="mb-3">{selectedProposal.research_area}</Badge>
                      
                      <p><strong>Description:</strong> {selectedProposal.description}</p>
                      <p><strong>Research Goals:</strong> {selectedProposal.research_goals}</p>
                      <p><strong>Institution:</strong> {selectedProposal.institution}</p>
                      <p><strong>Timeline:</strong> {formatDate(selectedProposal.start_date)} - {formatDate(selectedProposal.end_date)}</p>
                      <p><strong>Submitted By:</strong> {selectedProposal.creator.fname || selectedProposal.creator_email}</p>
                      
                      <div className="mt-3">
                        <h5>Assigned Reviewers</h5>
                        {selectedProposal.assigned_reviewers && selectedProposal.assigned_reviewers.length > 0 ? (
                          <ul>
                            {selectedProposal.assigned_reviewers.map(reviewerId => {
                              const reviewer = reviewers.find(r => r._id === reviewerId);
                              return (
                                <li key={reviewerId}>
                                  {reviewer ? reviewer.lname : reviewerId} 
                                  {reviewer && ` (${reviewer.department})`}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="text-muted">No reviewers assigned yet</p>
                        )}
                        <Button 
                          variant="primary" 
                          className="mt-2"
                          onClick={() => handleAssignReviewers(selectedProposal)}
                        >
                          Assign Reviewers
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Container>
        )}

        {activeTab === 'settings' && (
          <Container fluid>
            <Row className="mb-4">
              <Col>
                <Card>
                  <Card.Body>
                    <h4>Admin Settings</h4>
                    <p className="text-muted">
                      Configure platform settings and administrative options.
                    </p>
                    <div className="text-center py-5">
                      <p>Settings section is under development.</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        )}
      </div>

      {/* Role Change Modal */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Change User Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <p>
                Change role for <strong>{selectedUser.fname}</strong> ({selectedUser.email})
              </p>
              <Form.Group className="mb-3">
                <Form.Label>Select New Role</Form.Label>
                <Form.Select 
                  value={newRole} 
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="Researcher">Researcher</option>
                  <option value="Reviewer">Reviewer</option>
                  <option value="Admin">Admin</option>
                </Form.Select>
              </Form.Group>
              <Alert variant="warning">
                <strong>Warning:</strong> Changing a user's role will modify their permissions and access to platform features.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submitRoleChange}>
            <FiCheckCircle className="me-1" /> Confirm Change
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Assign Reviewer Modal */}
      <Modal show={showReviewerModal} onHide={() => setShowReviewerModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Assign Reviewers</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProposal && (
            <>
              <p>
                Assign reviewers to <strong>{selectedProposal.title}</strong>
              </p>
              
              <Form.Group className="mb-3">
                <Form.Label>Filter Reviewers by Expertise</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Type to filter by expertise..."
                  // Functionality could be expanded here
                />
              </Form.Group>
              
              <div className="reviewer-list">
                {reviewers.length === 0 ? (
                  <Alert variant="info">
                    No reviewers available. Promote users to Reviewer role first.
                  </Alert>
                ) : (
                  reviewers.map(reviewer => (
                    <Card key={reviewer._id} className="mb-2">
                      <Card.Body className="py-2">
                        <Form.Check
                          type="checkbox"
                          id={`reviewer-${reviewer._id}`}
                          label={
                            <div>
                              <strong>{reviewer.fname} {reviewer.lname}</strong>
                              <span className="text-muted"> ({reviewer.department})</span>
                              <div>
                                {reviewer.expertise?.map((exp, idx) => (
                                  <Badge bg="light" text="dark" className="me-1" key={idx}>
                                    {exp}
                                  </Badge>
                                ))}
                                {!reviewer.expertise?.length && <span className="text-muted small">No expertise listed</span>}
                              </div>
                            </div>
                          }
                          checked={selectedReviewers.includes(reviewer._id)}
                          onChange={() => handleReviewerSelection(reviewer._id)}
                        />
                      </Card.Body>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReviewerModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submitReviewerAssignment}>
            <FiCheckCircle className="me-1" /> Assign Selected Reviewers
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminDashboard;