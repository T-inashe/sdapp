import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form } from 'react-bootstrap';
import { FiDollarSign, FiPlus, FiInfo } from 'react-icons/fi';
import AuthContext from '../../context/AuthContext';
import axios from 'axios';
import config from '../../config';

interface Project {
  _id: number;
  title: string;
  funding_available: boolean;
  funding_amount: string | null;
  end_date: string;
}

interface FundingDetails {
  projectId: number;
  projectTitle: string;
  funder: string;
  awarded: number;
  spent: number;
  remaining: number;
  endDate: string;
  status: 'Active' | 'Expired' | 'Low Funds';
}

interface Expense {
  id: string;
  projectId: number;
  description: string;
  amount: number;
  date: string;
  category: string;
}

const FundingTracker: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState<Project[]>([]);
  const [fundingDetails, setFundingDetails] = useState<FundingDetails[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedProject, setSelectedProject] = useState<FundingDetails | null>(null);
  const [selectedProjectExpenses, setSelectedProjectExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showFundingModal, setShowFundingModal] = useState(false);
  
  // Form states
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: 0,
    category: 'Equipment',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [newFunding, setNewFunding] = useState({
    funder: '',
    amount: 0,
    endDate: '',
    notes: ''
  });

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${config.API_URL}/api/createproject/creator/${user?.id}`, {
          withCredentials: true
        });
        
        if (response.data) {
          setProjects(response.data);
          
          // Generate mock funding data based on projects
          const mockFundingData = response.data.map((project: Project) => {
            const fundingAmount = project.funding_amount 
              ? parseFloat(project.funding_amount.replace(/[^0-9.-]+/g, '')) 
              : 0;
            
            // Random spent amount between 0 and funding
            const spent = fundingAmount > 0 
              ? Math.floor(Math.random() * (fundingAmount * 0.8))
              : 0;
            
            const remaining = fundingAmount - spent;
            let status: 'Active' | 'Expired' | 'Low Funds' = 'Active';
            
            if (new Date(project.end_date) < new Date()) {
              status = 'Expired';
            } else if (remaining < fundingAmount * 0.2) {
              status = 'Low Funds';
            }
            
            return {
              projectId: project._id,
              projectTitle: project.title,
              funder: ['National Science Foundation', 'NIH', 'University Grant', 'Industry Partner'][Math.floor(Math.random() * 4)],
              awarded: fundingAmount,
              spent: spent,
              remaining: remaining,
              endDate: project.end_date,
              status: status
            };
          });
          
          setFundingDetails(mockFundingData);
          
          // Generate mock expense data
          const mockExpenses: Expense[] = [];
          mockFundingData.forEach((funding: { spent: number; projectId: any; }) => {
            const expenseCount = Math.floor(Math.random() * 5) + 1;
            const categories = ['Equipment', 'Personnel', 'Travel', 'Supplies', 'Other'];
            
            for (let i = 0; i < expenseCount; i++) {
              const amount = Math.floor(Math.random() * (funding.spent / expenseCount));
              mockExpenses.push({
                id: `exp-${funding.projectId}-${i}`,
                projectId: funding.projectId,
                description: `${categories[i % categories.length]} expense ${i + 1}`,
                amount: amount,
                date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
                category: categories[i % categories.length]
              });
            }
          });
          
          setExpenses(mockExpenses);
        } else {
          console.error('Failed to load projects:', response.data);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Error connecting to server');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjects();
  }, [user?.id]);
  
  const viewProjectDetails = (project: FundingDetails) => {
    setSelectedProject(project);
    setSelectedProjectExpenses(expenses.filter(exp => exp.projectId === project.projectId));
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Expired':
        return 'danger';
      case 'Low Funds':
        return 'warning';
      default:
        return 'secondary';
    }
  };
  
  const handleAddExpense = () => {
    if (!selectedProject) return;
    
    const newExpenseItem: Expense = {
      id: `exp-${selectedProject.projectId}-${Date.now()}`,
      projectId: selectedProject.projectId,
      description: newExpense.description,
      amount: newExpense.amount,
      date: newExpense.date,
      category: newExpense.category
    };
    
    // Update expenses
    setExpenses([...expenses, newExpenseItem]);
    setSelectedProjectExpenses([...selectedProjectExpenses, newExpenseItem]);
    
    // Update funding details
    const updatedFundingDetails = fundingDetails.map(fund => {
      if (fund.projectId === selectedProject.projectId) {
        const newSpent = fund.spent + newExpense.amount;
        const newRemaining = fund.awarded - newSpent;
        
        let newStatus = fund.status;
        if (newRemaining <= 0) {
          newStatus = 'Low Funds';
        }
        
        return {
          ...fund,
          spent: newSpent,
          remaining: newRemaining,
          status: newStatus
        };
      }
      return fund;
    });
    
    setFundingDetails(updatedFundingDetails);
    
    // Update selected project
    const updatedProject = updatedFundingDetails.find(fund => fund.projectId === selectedProject.projectId);
    if (updatedProject) {
      setSelectedProject(updatedProject);
    }
    
    // Reset and close modal
    setNewExpense({
      description: '',
      amount: 0,
      category: 'Equipment',
      date: new Date().toISOString().split('T')[0]
    });
    setShowExpenseModal(false);
  };
  
  const handleAddFunding = () => {
    if (!selectedProject) return;
    
    // Update funding details
    const updatedFundingDetails = fundingDetails.map(fund => {
      if (fund.projectId === selectedProject.projectId) {
        const newAwarded = fund.awarded + newFunding.amount;
        const newRemaining = fund.remaining + newFunding.amount;
        
        let newStatus = 'Active';
        if (new Date(fund.endDate) < new Date()) {
          newStatus = 'Expired';
        } else if (newRemaining < newAwarded * 0.2) {
          newStatus = 'Low Funds';
        }
        
        return {
          ...fund,
          awarded: newAwarded,
          remaining: newRemaining,
          status: newStatus as 'Active' | 'Expired' | 'Low Funds',
          endDate: newFunding.endDate || fund.endDate
        };
      }
      return fund;
    });
    
    setFundingDetails(updatedFundingDetails);
    
    // Update selected project
    const updatedProject = updatedFundingDetails.find(fund => fund.projectId === selectedProject.projectId);
    if (updatedProject) {
      setSelectedProject(updatedProject);
    }
    
    // Reset and close modal
    setNewFunding({
      funder: '',
      amount: 0,
      endDate: '',
      notes: ''
    });
    setShowFundingModal(false);
  };
  
  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading funding data...</p>
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
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h4>Research Funding Tracker</h4>
          <p className="text-muted">
            Monitor and manage funding for all your research projects.
          </p>
        </Col>
      </Row>
      
      {!selectedProject ? (
        <Row>
          <Col>
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Project Funding Summary</h5>
                </div>
                
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Project Title</th>
                      <th>Funder</th>
                      <th>Awarded</th>
                      <th>Spent</th>
                      <th>Remaining</th>
                      <th>End Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fundingDetails.map((fund) => (
                      <tr key={fund.projectId}>
                        <td>{fund.projectTitle}</td>
                        <td>{fund.funder}</td>
                        <td>{formatCurrency(fund.awarded)}</td>
                        <td>{formatCurrency(fund.spent)}</td>
                        <td className={fund.remaining < fund.awarded * 0.2 ? 'text-danger fw-bold' : ''}>
                          {formatCurrency(fund.remaining)}
                        </td>
                        <td>{new Date(fund.endDate).toLocaleDateString()}</td>
                        <td>
                          <Badge bg={getStatusBadge(fund.status)}>{fund.status}</Badge>
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => viewProjectDetails(fund)}
                          >
                            Details
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
      ) : (
        <>
          <Row className="mb-3">
            <Col>
              <Button variant="outline-secondary" onClick={() => setSelectedProject(null)}>
                Back to All Projects
              </Button>
            </Col>
          </Row>
          
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">{selectedProject.projectTitle}</h5>
                    <div>
                      <Button 
                        variant="outline-success" 
                        className="me-2"
                        onClick={() => setShowFundingModal(true)}
                      >
                        <FiDollarSign className="me-1" /> Add Funding
                      </Button>
                      <Button 
                        variant="outline-primary"
                        onClick={() => setShowExpenseModal(true)}
                      >
                        <FiPlus className="me-1" /> Add Expense
                      </Button>
                    </div>
                  </div>
                  
                  <Row className="mb-4">
                    <Col md={3}>
                      <Card bg="light">
                        <Card.Body className="text-center">
                          <h6>Total Awarded</h6>
                          <h4>{formatCurrency(selectedProject.awarded)}</h4>
                          <div>Funder: {selectedProject.funder}</div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card bg="light">
                        <Card.Body className="text-center">
                          <h6>Total Spent</h6>
                          <h4>{formatCurrency(selectedProject.spent)}</h4>
                          <div>{((selectedProject.spent / selectedProject.awarded) * 100).toFixed(1)}% of budget</div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card bg="light">
                        <Card.Body className="text-center">
                          <h6>Remaining Balance</h6>
                          <h4 className={selectedProject.remaining < selectedProject.awarded * 0.2 ? 'text-danger' : ''}>
                            {formatCurrency(selectedProject.remaining)}
                          </h4>
                          <div>{((selectedProject.remaining / selectedProject.awarded) * 100).toFixed(1)}% remaining</div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card bg={getStatusBadge(selectedProject.status)}>
                        <Card.Body className="text-center text-white">
                          <h6>Funding Status</h6>
                          <h4>{selectedProject.status}</h4>
                          <div>Expires: {new Date(selectedProject.endDate).toLocaleDateString()}</div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  
                  <h6>Expense Breakdown</h6>
                  {selectedProjectExpenses.length > 0 ? (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Category</th>
                          <th>Date</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProjectExpenses.map((expense) => (
                          <tr key={expense.id}>
                            <td>{expense.description}</td>
                            <td>
                              <Badge bg="secondary">{expense.category}</Badge>
                            </td>
                            <td>{new Date(expense.date).toLocaleDateString()}</td>
                            <td>{formatCurrency(expense.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <div className="text-center p-4">
                      <FiInfo className="text-muted mb-2" size={24} />
                      <p>No expenses recorded yet</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
      
      {/* Add Expense Modal */}
      <Modal show={showExpenseModal} onHide={() => setShowExpenseModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Expense</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control 
                type="text" 
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control 
                type="number" 
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select 
                value={newExpense.category}
                onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
              >
                <option value="Equipment">Equipment</option>
                <option value="Personnel">Personnel</option>
                <option value="Travel">Travel</option>
                <option value="Supplies">Supplies</option>
                <option value="Services">Services</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control 
                type="date" 
                value={newExpense.date}
                onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExpenseModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddExpense}
            disabled={!newExpense.description || newExpense.amount <= 0}
          >
            Add Expense
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Add Funding Modal */}
      <Modal show={showFundingModal} onHide={() => setShowFundingModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Funding</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Funding Source</Form.Label>
              <Form.Control 
                type="text" 
                value={newFunding.funder}
                onChange={(e) => setNewFunding({...newFunding, funder: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control 
                type="number" 
                value={newFunding.amount}
                onChange={(e) => setNewFunding({...newFunding, amount: parseFloat(e.target.value)})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>End Date</Form.Label>
              <Form.Control 
                type="date" 
                value={newFunding.endDate}
                onChange={(e) => setNewFunding({...newFunding, endDate: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                value={newFunding.notes}
                onChange={(e) => setNewFunding({...newFunding, notes: e.target.value})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFundingModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddFunding}
            disabled={!newFunding.funder || newFunding.amount <= 0}
          >
            Add Funding
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default FundingTracker;