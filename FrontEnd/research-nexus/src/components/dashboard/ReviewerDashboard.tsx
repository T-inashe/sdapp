import React, { useContext, useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Nav, Form, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { FiFileText, FiLogOut, FiEye, FiCheckCircle } from 'react-icons/fi';
import axios from 'axios';
import config from '../../config';

interface Proposal {
  _id: string;
  title: string;
  description: string;
  research_goals: string;
  research_area: string;
  creator_email: string;
  creator_name?: string;
  institution: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

interface Evaluation {
  scientific_merit: number;
  methodology: number;
  feasibility: number;
  impact: number;
  comments: string;
  recommendation: string;
}

const ReviewerDashboard: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [assignedProposals, setAssignedProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showEvaluationForm, setShowEvaluationForm] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [evaluation, setEvaluation] = useState<Evaluation>({
    scientific_merit: 3,
    methodology: 3,
    feasibility: 3,
    impact: 3,
    comments: '',
    recommendation: 'Revise'
  });

  useEffect(() => {
    const fetchAssignedProposals = async () => {
      setIsLoading(true);
      try {
        // Fetch proposals assigned to this reviewer
        const response = await axios.get(`${config.API_URL}/api/reviewer/assigned-proposals`, {
          withCredentials: true
        });
        
        if (response.data) {
          setAssignedProposals(response.data);
        }
      } catch (error) {
        console.error('Error fetching assigned proposals:', error);
        setErrorMessage('Error connecting to server');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignedProposals();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setShowEvaluationForm(false);
  };

  const handleStartEvaluation = () => {
    setShowEvaluationForm(true);
  };

  const handleEvaluationChange = (field: keyof Evaluation, value: any) => {
    setEvaluation(prev => ({ ...prev, [field]: value }));
  };

  const submitEvaluation = async () => {
    if (!selectedProposal) return;
    
    try {
      await axios.post(`${config.API_URL}/api/evaluations`, {
        proposal_id: selectedProposal._id,
        reviewer_id: user?._id,
        ...evaluation
      }, {
        withCredentials: true
      });
      
      // Update proposal status based on recommendation
      await axios.put(`${config.API_URL}/api/createproject/${selectedProposal._id}/status`, {
        status: evaluation.recommendation === 'Approve' ? 'Approved' : 
               evaluation.recommendation === 'Reject' ? 'Rejected' : 'Revisions Requested'
      }, {
        withCredentials: true
      });
      
      // Update local state
      setAssignedProposals(prevProposals => 
        prevProposals.map(p => 
          p._id === selectedProposal._id ? 
          { ...p, status: evaluation.recommendation === 'Approve' ? 'Approved' : 
                   evaluation.recommendation === 'Reject' ? 'Rejected' : 'Revisions Requested' } : 
          p
        )
      );
      
      setSuccessMessage('Evaluation submitted successfully');
      setShowEvaluationForm(false);
      
      // Reset form
      setEvaluation({
        scientific_merit: 3,
        methodology: 3,
        feasibility: 3,
        impact: 3,
        comments: '',
        recommendation: 'Revise'
      });
      
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      setErrorMessage('Failed to submit evaluation');
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
          <p className="mt-2">Loading reviewer dashboard...</p>
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
                {user?.name?.charAt(0) || 'R'}
              </div>
            )}
          </div>
          <h5>{user?.name}</h5>
          <p className="text-muted small">{user?.institution}</p>
          <Badge bg="warning">Reviewer</Badge>
        </div>
        <Nav className="flex-column sidebar-nav">
          <Nav.Link active>
            <FiFileText className="me-2" /> Assigned Proposals
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
          <h2>Reviewer Dashboard</h2>
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

        <Container fluid>
          <Row>
            <Col md={selectedProposal ? 6 : 12}>
              <Card className="mb-4">
                <Card.Body>
                  <h4>Assigned Proposals</h4>
                  <p className="text-muted">Review and evaluate research proposals assigned to you.</p>
                  
                  {assignedProposals.length === 0 ? (
                    <Alert variant="info">
                      You don't have any proposals assigned for review yet.
                    </Alert>
                  ) : (
                    assignedProposals.map(proposal => (
                      <Card 
                        key={proposal._id} 
                        className="mb-3 proposal-card"
                        onClick={() => handleViewProposal(proposal)}
                      >
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h5>{proposal.title}</h5>
                              <Badge bg="primary" className="me-2">{proposal.research_area}</Badge>
                              <Badge bg={
                                proposal.status === 'Approved' ? 'success' :
                                proposal.status === 'Rejected' ? 'danger' :
                                proposal.status === 'Revisions Requested' ? 'warning' : 'info'
                              }>
                                {proposal.status || 'Pending Review'}
                              </Badge>
                              <p className="text-muted mt-2 mb-0">
                                <small>From: {proposal.institution} • Submitted: {formatDate(proposal.created_at)}</small>
                              </p>
                            </div>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewProposal(proposal);
                              }}
                            >
                              <FiEye className="me-1" /> View
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    ))
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            {selectedProposal && (
              <Col md={6}>
                <Card className="mb-4">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Proposal Details</h5>
                    <div>
                      {!showEvaluationForm && (
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={handleStartEvaluation}
                          disabled={selectedProposal.status === 'Approved' || selectedProposal.status === 'Rejected'}
                        >
                          Evaluate Proposal
                        </Button>
                      )}
                    </div>
                  </Card.Header>
                  
                  {!showEvaluationForm ? (
                    <Card.Body>
                      <h4>{selectedProposal.title}</h4>
                      <Badge bg="primary" className="mb-3">{selectedProposal.research_area}</Badge>
                      
                      <h5>Description</h5>
                      <p>{selectedProposal.description}</p>
                      
                      <h5>Research Goals</h5>
                      <p>{selectedProposal.research_goals}</p>
                      
                      <div className="d-flex justify-content-between">
                        <div>
                          <h5>Institution</h5>
                          <p>{selectedProposal.institution}</p>
                        </div>
                        <div>
                          <h5>Timeline</h5>
                          <p>{formatDate(selectedProposal.start_date)} - {formatDate(selectedProposal.end_date)}</p>
                        </div>
                      </div>
                      
                      <h5>Submitted By</h5>
                      <p>{selectedProposal.creator_name || selectedProposal.creator_email}</p>
                      
                      <div className="mt-3">
                        <h5>Current Status</h5>
                        <Badge bg={
                          selectedProposal.status === 'Approved' ? 'success' :
                          selectedProposal.status === 'Rejected' ? 'danger' :
                          selectedProposal.status === 'Revisions Requested' ? 'warning' : 'info'
                        } className="p-2">
                          {selectedProposal.status || 'Pending Review'}
                        </Badge>
                        
                        {(selectedProposal.status === 'Approved' || selectedProposal.status === 'Rejected') && (
                          <p className="mt-2 text-muted">
                            This proposal has already been evaluated.
                          </p>
                        )}
                      </div>
                    </Card.Body>
                  ) : (
                    <Card.Body>
                      <h4>Evaluate: {selectedProposal.title}</h4>
                      
                      <Form className="mt-3">
                        <h5>Scientific Merit</h5>
                        <Form.Group className="mb-3">
                          <div className="d-flex justify-content-between">
                            <Form.Label>Score (1-5)</Form.Label>
                            <span>{evaluation.scientific_merit}</span>
                          </div>
                          <Form.Range 
                            min={1} 
                            max={5} 
                            step={1} 
                            value={evaluation.scientific_merit}
                            onChange={(e) => handleEvaluationChange('scientific_merit', parseInt(e.target.value))}
                          />
                          <div className="d-flex justify-content-between">
                            <small>Poor</small>
                            <small>Excellent</small>
                          </div>
                        </Form.Group>
                        
                        <h5>Methodology</h5>
                        <Form.Group className="mb-3">
                          <div className="d-flex justify-content-between">
                            <Form.Label>Score (1-5)</Form.Label>
                            <span>{evaluation.methodology}</span>
                          </div>
                          <Form.Range 
                            min={1} 
                            max={5} 
                            step={1} 
                            value={evaluation.methodology}
                            onChange={(e) => handleEvaluationChange('methodology', parseInt(e.target.value))}
                          />
                          <div className="d-flex justify-content-between">
                            <small>Poor</small>
                            <small>Excellent</small>
                          </div>
                        </Form.Group>
                        
                        <h5>Feasibility</h5>
                        <Form.Group className="mb-3">
                          <div className="d-flex justify-content-between">
                            <Form.Label>Score (1-5)</Form.Label>
                            <span>{evaluation.feasibility}</span>
                          </div>
                          <Form.Range 
                            min={1} 
                            max={5} 
                            step={1} 
                            value={evaluation.feasibility}
                            onChange={(e) => handleEvaluationChange('feasibility', parseInt(e.target.value))}
                          />
                          <div className="d-flex justify-content-between">
                            <small>Poor</small>
                            <small>Excellent</small>
                          </div>
                        </Form.Group>
                        
                        <h5>Potential Impact</h5>
                        <Form.Group className="mb-3">
                          <div className="d-flex justify-content-between">
                            <Form.Label>Score (1-5)</Form.Label>
                            <span>{evaluation.impact}</span>
                          </div>
                          <Form.Range 
                            min={1} 
                            max={5} 
                            step={1} 
                            value={evaluation.impact}
                            onChange={(e) => handleEvaluationChange('impact', parseInt(e.target.value))}
                          />
                          <div className="d-flex justify-content-between">
                            <small>Poor</small>
                            <small>Excellent</small>
                          </div>
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>Comments and Feedback</Form.Label>
                          <Form.Control 
                            as="textarea" 
                            rows={4} 
                            value={evaluation.comments}
                            onChange={(e) => handleEvaluationChange('comments', e.target.value)}
                            placeholder="Provide detailed feedback for the researchers..."
                          />
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>Recommendation</Form.Label>
                          <Form.Select 
                            value={evaluation.recommendation}
                            onChange={(e) => handleEvaluationChange('recommendation', e.target.value)}
                          >
                            <option value="Approve">Approve</option>
                            <option value="Revise">Request Revisions</option>
                            <option value="Reject">Reject</option>
                          </Form.Select>
                        </Form.Group>
                        
                        <div className="d-flex justify-content-end mt-4">
                          <Button 
                            variant="secondary" 
                            className="me-2"
                            onClick={() => setShowEvaluationForm(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="primary" 
                            onClick={submitEvaluation}
                          >
                            <FiCheckCircle className="me-1" /> Submit Evaluation
                          </Button>
                        </div>
                      </Form>
                    </Card.Body>
                  )}
                </Card>
              </Col>
            )}
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default ReviewerDashboard;