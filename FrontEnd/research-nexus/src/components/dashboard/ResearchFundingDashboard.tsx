import React, { useState, useEffect, useContext, useRef } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Nav } from 'react-bootstrap';
import { FiDollarSign, FiPlus, FiInfo, FiPieChart, FiBarChart2 } from 'react-icons/fi';
import AuthContext from '../../context/AuthContext';
import axios from 'axios';
import config from '../../config';
import FundingVisualization from './FundingVisualization';

interface Project {
  _id: string;
  title: string;
  funding_available: boolean;
  funding_amount: string | null;
  funder:string;
  awarded:Number;
  spent:Number;
  remaining:Number;
  end_date: string;
  fundstatus:string;
}

interface FundingDetails {
  projectId: number;
  projectTitle: string;
  funder: string;
  awarded: number;
  spent: number;
  remaining: number;
  endDate: string;
  fundstatus: 'Active' | 'Expired' | 'Low Funds'| 'Out Of Funds';
}

interface Expense {
  id: string;
  projectId: number;
  description: string;
  amount: number;
  date: string;
  category: string;
}

const ResearchFundingDashboard: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState<Project[]>([]);
  const [fundingDetails, setFundingDetails] = useState<FundingDetails[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedProject, setSelectedProject] = useState<FundingDetails | null>(null);
  const [selectedProjectExpenses, setSelectedProjectExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeView, setActiveView] = useState<'summary' | 'details' | 'visualization'>('summary');
  
  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showFundingModal, setShowFundingModal] = useState(false);
  
  const reportRef = useRef<HTMLDivElement>(null);
  
   const [exporting, setExporting] = useState(false);
  
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
  
    setExporting(true);
  
    try {
      // @ts-ignore
      const html2canvas = window.html2canvas;
      // @ts-ignore
      const { jsPDF } = window.jspdf;
  
      const canvas = await html2canvas(reportRef.current, {
        useCORS: true, // Support for external images/fonts
      });
  
      const imgData = canvas.toDataURL('image/jpeg', 0.7);
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
          
          const Data = response.data.map((project: Project) => {
            return {
              projectId: project._id,
              projectTitle: project.title,
              funder: project.funder,
              awarded: project.awarded,
              spent: project.spent,
              remaining: project.remaining,
              endDate: project.end_date,
              fundstatus: project.fundstatus
            };
          });
          
          setFundingDetails(Data);
       const allExpenses: Expense[] = [];

        for (const project of response.data) {
          try {
            const expenseRes = await fetch(`${config.API_URL}/api/expense/project/${project._id}`);
            if (!expenseRes.ok) throw new Error('Failed to fetch expenses');
            const expenseData: Expense[] = await expenseRes.json();
            allExpenses.push(...expenseData);
          } catch (err) {
            console.error(`Error fetching expenses for project ${project._id}:`, err);
          }
        }

        setExpenses(allExpenses);
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
    setActiveView('details');
  };
  
  const viewProjectVisualizations = (project: FundingDetails) => {
    setSelectedProject(project);
    setSelectedProjectExpenses(expenses.filter(exp => exp.projectId === project.projectId));
    setActiveView('visualization');
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
      case 'Out Of Funds':
        return 'danger';
      default:
        return 'secondary';
    }
  };
  
const handleAddExpense = async () => {
  if (!selectedProject) return;

  setIsLoading(true);
  setError('');

  try {
    const payload = {
      projectId: selectedProject.projectId,
      description: newExpense.description,
      amount: newExpense.amount,
      date: newExpense.date,
      category: newExpense.category
    };

    // 1. POST the new expense
    const response = await axios.post(`${config.API_URL}/api/expense`, payload, {
      withCredentials: true
    });

    const newExpenseItem = response.data;

    // 2. Update local expense states
    setExpenses(prev => [...prev, newExpenseItem]);
    setSelectedProjectExpenses(prev => [...prev, newExpenseItem]);

    // 3. Update project 'spent' and 'remaining' on the backend
    const fund = fundingDetails.find(f => f.projectId === selectedProject.projectId);
    if (fund) {
      const newSpent = fund.spent + newExpense.amount;
      const newRemaining = fund.awarded - newSpent;
      
        let newStatus=fund.fundstatus;
         if (newRemaining <= 0) {
          newStatus = 'Out Of Funds';
        }


      await axios.put(
        `${config.API_URL}/api/createproject/projects/${selectedProject.projectId}`,
        {
          spent: newSpent,
          remaining: newRemaining,
          fundstatus:newStatus
        },
        { withCredentials: true }
      );
    }

    // 4. Fetch updated project info from backend
    const projectResponse = await axios.get(`${config.API_URL}/api/createproject/projects/${selectedProject.projectId}`, {
      withCredentials: true
    });

    const updatedProjectData = projectResponse.data;

    // 5. Replace local fundingDetails with updated data from backend
    const newFundingDetails = fundingDetails.map(fund => {
      if (fund.projectId === selectedProject.projectId) {
        return {
          ...fund,
          spent: updatedProjectData.spent,
          remaining: updatedProjectData.remaining,
          fundstatus: updatedProjectData.fundstatus
        };
      }
      return fund;
    });

    setFundingDetails(newFundingDetails);

    // 6. Update selected project info
    const updatedProject = newFundingDetails.find(f => f.projectId === selectedProject.projectId);
    if (updatedProject) {
      setSelectedProject(updatedProject);
    }

    // 7. Reset the modal form
    setNewExpense({
      description: '',
      amount: 0,
      category: 'Equipment',
      date: new Date().toISOString().split('T')[0]
    });
    setShowExpenseModal(false);

  } catch (error) {
    console.error('Error adding expense:', error);
    setError('Failed to add expense');
  } finally {
    setIsLoading(false);
  }
};



const handleAddFunding = async () => {
  if (!selectedProject) return;

  try {
    setIsLoading(true);

    const updatedFundingDetails = await Promise.all(fundingDetails.map(async (fund) => {
      if (fund.projectId === selectedProject.projectId) {
        const newAwarded = fund.awarded + newFunding.amount;
        const newRemaining = fund.remaining + newFunding.amount;

        let newStatus=fund.fundstatus;
        if (new Date(fund.endDate) < new Date()) {
          newStatus = 'Expired';
        } else if (newRemaining < newAwarded * 0.2) {
          newStatus = 'Low Funds';
        }
        else if(newRemaining> fund.spent){
          newStatus = 'Active'
        }

        // Perform only PUT to update funding info
        const putPayload = {
          funder: newFunding.funder,
          awarded: newAwarded,
          remaining: newRemaining,
          fundstatus: newStatus,
          end_date: newFunding.endDate || fund.endDate,
        };

        console.log(putPayload)
        await axios.put(
        `${config.API_URL}/api/createproject/projects/${fund.projectId}`,
          putPayload,
        { withCredentials: true }
      );


      const projectResponse = await axios.get(`${config.API_URL}/api/createproject/projects/${selectedProject.projectId}`, {
      withCredentials: true
    });
      const updatedProject = projectResponse.data;

        return {
          ...fund,
          funder:updatedProject.funder,
          awarded: updatedProject.awarded,
          remaining: updatedProject.remaining,
          fundstatus: updatedProject.fundstatus,
          endDate: updatedProject.end_date,
          updatedFundingAmount: updatedProject.funding_amount,
        };
      }
      return fund;
    }));

    setFundingDetails(updatedFundingDetails);

    const updatedProject = updatedFundingDetails.find(fund => fund.projectId === selectedProject.projectId);
    if (updatedProject) {
      setSelectedProject(updatedProject);
    }

    setNewFunding({
      funder: '',
      amount: 0,
      endDate: '',
    });

    setShowFundingModal(false);

  } catch (error) {
    console.error('Error updating funding:', error);
    setError('Failed to update funding. Please try again.');
  } finally {
    setIsLoading(false);
  }
};


  const renderBackButton = () => (
    <Row className="mb-3">
      <Col>
        <Button variant="outline-secondary" onClick={() => {
          setSelectedProject(null);
          setActiveView('summary');
        }}>
          Back to All Projects
        </Button>
      </Col>
    </Row>
  );
  
  const renderProjectNavigation = () => (
    <Row className="mb-3">
      <Col>
        <Nav variant="tabs">
          <Nav.Item>
            <Nav.Link 
              active={activeView === 'details'} 
              onClick={() => setActiveView('details')}
            >
              Project Details
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={activeView === 'visualization'} 
              onClick={() => setActiveView('visualization')}
            >
              <FiPieChart className="me-1" /> Visualizations
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Col>
    </Row>
  );
  
  const renderProjectDetails = () => (
    <Container>
    <Card>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">{selectedProject?.projectTitle}</h5>
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
                <h4>{formatCurrency(selectedProject?.awarded || 0)}</h4>
                <div>Funder: {selectedProject?.funder}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card bg="light">
              <Card.Body className="text-center">
                <h6>Total Spent</h6>
                <h4>{formatCurrency(selectedProject?.spent || 0)}</h4>
                <div>
                  {((selectedProject?.spent || 0) / (selectedProject?.awarded || 1) * 100).toFixed(1)}% of budget
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card bg="light">
              <Card.Body className="text-center">
                <h6>Remaining Balance</h6>
                <h4 className={(selectedProject?.remaining || 0) < (selectedProject?.awarded || 0) * 0.2 ? 'text-danger' : ''}>
                  {formatCurrency(selectedProject?.remaining || 0)}
                </h4>
                <div>
                  {((selectedProject?.remaining || 0) / (selectedProject?.awarded || 1) * 100).toFixed(1)}% remaining
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card bg={getStatusBadge(selectedProject?.fundstatus || 'Active')}>
              <Card.Body className="text-center text-white">
                <h6>Funding Status</h6>
                <h4>{selectedProject?.fundstatus}</h4>
                <div>Expires: {selectedProject ? new Date(selectedProject.endDate).toLocaleDateString() : ''}</div>
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
    <Button 
      onClick={handleExportPDF} 
      disabled={exporting}
      style={{ marginLeft: 'auto' }}
    >
      {exporting ? 'Exporting...' : 'Export as PDF'}
    </Button>
    </Container>
  );
  
  const renderVisualization = () => (
    <FundingVisualization 
      fundingDetails={fundingDetails}
      expenses={expenses}
      selectedProject={selectedProject}
      formatCurrency={formatCurrency}
    />
  );
  
  const renderProjectView = () => {
    if (activeView === 'details') {
      return renderProjectDetails();
    } else if (activeView === 'visualization') {
      return renderVisualization();
    }
    return null;
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
    <Container fluid  ref={reportRef}>
      <Row className="mb-4">
        <Col>
          <h4>Research Funding Dashboard</h4>
          <p className="text-muted">
            Monitor, manage, and visualize funding for all your research projects.
          </p>
        </Col>
      </Row>
      
      {!selectedProject ? (
        <>
          <Row className="mb-3">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <h5>Project Funding Summary</h5>
                {fundingDetails.length > 0 && (
                  <Button 
                    variant="outline-primary" 
                    onClick={() => {
                      setActiveView('visualization');
                      setSelectedProject(null);
                    }}
                  >
                    <FiBarChart2 className="me-1" /> Overall Analytics
                  </Button>
                )}
              </div>
            </Col>
          </Row>
          
          {activeView === 'visualization' && !selectedProject ? (
            <FundingVisualization 
              fundingDetails={fundingDetails}
              expenses={expenses}
              selectedProject={null}
              formatCurrency={formatCurrency}
            />
          ) : (
            <Row>
              <Col>
                <Card>
                  <Card.Body>
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
                              <Badge bg={getStatusBadge(fund.fundstatus)}>{fund.fundstatus}</Badge>
                            </td>
                            <td>
                              <div className="btn-group">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => viewProjectDetails(fund)}
                                >
                                  Details
                                </Button>
                                <Button 
                                  variant="outline-info" 
                                  size="sm"
                                  onClick={() => viewProjectVisualizations(fund)}
                                >
                                  <FiPieChart />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </>
      ) : (
        <>
          {renderBackButton()}
          {renderProjectNavigation()}
          <Row className="mb-4">
            <Col>
              {renderProjectView()}
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

export default ResearchFundingDashboard;