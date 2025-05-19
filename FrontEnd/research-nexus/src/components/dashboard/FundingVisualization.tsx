import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { 
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';

export interface FundingDetails {
  projectId: number;
  projectTitle: string;
  funder: string;
  awarded: number;
  spent: number;
  remaining: number;
  endDate: string;
  fundstatus: 'Active' | 'Expired' | 'Low Funds'| 'Out Of Funds';
}

export interface Expense {
  id: string;
  projectId: number;
  description: string;
  amount: number;
  date: string;
  category: string;
}

interface FundingVisualizationProps {
  fundingDetails: FundingDetails[];
  expenses: Expense[];
  selectedProject: FundingDetails | null;
  formatCurrency: (amount: number) => string;
}

const FundingVisualization: React.FC<FundingVisualizationProps> = ({
  fundingDetails,
  expenses,
  selectedProject,
  formatCurrency
}) => {
  const [chartType, setChartType] = useState<'allocation' | 'timeline' | 'category' | 'comparison'>('allocation');
  const [timeFrame, setTimeFrame] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const reportRef = useRef<HTMLDivElement>(null);
   const [exporting, setExporting] = useState(false);
  // Prepare data for allocation chart (how remaining vs spent)
  const getAllocationData = () => {
    if (!selectedProject) {
      return [];
    }
    
    return [
      { name: 'Spent', value: selectedProject.spent, fill: '#ff7675' },
      { name: 'Remaining', value: selectedProject.remaining, fill: '#55efc4' }
    ];
  };
  
const handleExportPDF = async () => {
  if (!reportRef.current) return;

  setExporting(true);

  try {
    // @ts-ignore
    const html2canvas = window.html2canvas;
    // @ts-ignore
    const { jsPDF } = window.jspdf;

    const canvas = await html2canvas(reportRef.current, {
      useCORS: true, 
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

  // Prepare data for expense categories
  const getCategoryData = () => {
    if (!selectedProject) {
      return [];
    }
    
    const projectExpenses = expenses.filter(exp => exp.projectId === selectedProject.projectId);
    const categoryMap = new Map<string, number>();
    
    projectExpenses.forEach(expense => {
      const current = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, current + expense.amount);
    });
    
    const colors = ['#74b9ff', '#a29bfe', '#fd79a8', '#fdcb6e', '#55efc4', '#636e72'];
    
    return Array.from(categoryMap.entries()).map(([category, amount], index) => ({
      name: category,
      value: amount,
      fill: colors[index % colors.length]
    }));
  };
  
  // Prepare timeline data for spending over time
  const getTimelineData = () => {
    if (!selectedProject) {
      return [];
    }
    
    const projectExpenses = expenses.filter(exp => exp.projectId === selectedProject.projectId);
    
    // Sort expenses by date
    projectExpenses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Group by time period
    const timeGrouped = new Map<string, number>();
    const runningTotal = new Map<string, number>();
    let cumulativeTotal = 0;
    
    projectExpenses.forEach(expense => {
      const date = new Date(expense.date);
      let timePeriod: string;
      
      if (timeFrame === 'monthly') {
        timePeriod = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (timeFrame === 'quarterly') {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        timePeriod = `${date.getFullYear()}-Q${quarter}`;
      } else {
        timePeriod = `${date.getFullYear()}`;
      }
      
      const current = timeGrouped.get(timePeriod) || 0;
      timeGrouped.set(timePeriod, current + expense.amount);
      
      cumulativeTotal += expense.amount;
      runningTotal.set(timePeriod, cumulativeTotal);
    });
    
    return Array.from(timeGrouped.keys()).map(period => ({
      name: period,
      spending: timeGrouped.get(period) || 0,
      cumulative: runningTotal.get(period) || 0
    }));
  };
  
  // Prepare comparison data across projects
  const getComparisonData = () => {
    return fundingDetails.map(fund => ({
      name: fund.projectTitle.length > 15 ? fund.projectTitle.substring(0, 15) + '...' : fund.projectTitle,
      awarded: fund.awarded,
      spent: fund.spent,
      remaining: fund.remaining
    }));
  };
  
  const renderChart = () => {
    switch(chartType) {
      case 'allocation':
        return (
          <Card>
            <Card.Body>
              <h5 className="mb-4">Budget Allocation</h5>
              {selectedProject ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={getAllocationData()}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      labelLine={true}
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center p-5" 
                data-testid="no-project-message">
                  <p>Select a project to view budget allocation</p>
                </div>
              )}
            </Card.Body>
          </Card>
        );
        
      case 'category':
        return (
          <Card>
            <Card.Body>
              <h5 className="mb-4">Expense Categories</h5>
              {selectedProject ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={getCategoryData()}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      labelLine={true}
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center p-5">
                  <p>Select a project to view expense categories</p>
                </div>
              )}
            </Card.Body>
          </Card>
        );
        
      case 'timeline':
        return (
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Spending Timeline</h5>
                <Form.Select 
                  style={{ width: 'auto' }}
                  value={timeFrame}
                  onChange={(e) => setTimeFrame(e.target.value as 'monthly' | 'quarterly' | 'yearly')}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </Form.Select>
              </div>
              
              {selectedProject ? (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={getTimelineData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatCurrency(value).replace('$', '')} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="spending" 
                      name="Period Spending" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulative" 
                      name="Cumulative Spending" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      fillOpacity={0.3} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center p-5">
                  <p>Select a project to view spending timeline</p>
                </div>
              )}
            </Card.Body>
          </Card>
        );
        
      case 'comparison':
        return (
          <Card>
            <Card.Body>
              <h5 className="mb-4">Project Comparison</h5>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={getComparisonData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatCurrency(value).replace('$', '')} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="awarded" name="Awarded" fill="#3498db" />
                  <Bar dataKey="spent" name="Spent" fill="#e74c3c" />
                  <Bar dataKey="remaining" name="Remaining" fill="#2ecc71" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        );
    }
  };
  
  // Calculate overall metrics for the funding summary
  const calculateMetrics = () => {
    const totalAwarded = fundingDetails.reduce((sum, fund) => sum + fund.awarded, 0);
    const totalSpent = fundingDetails.reduce((sum, fund) => sum + fund.spent, 0);
    const totalRemaining = fundingDetails.reduce((sum, fund) => sum + fund.remaining, 0);
    const activeProjects = fundingDetails.filter(fund => fund.fundstatus === 'Active').length;
    const expiredProjects = fundingDetails.filter(fund => fund.fundstatus === 'Expired').length;
    const lowFundsProjects = fundingDetails.filter(fund => fund.fundstatus === 'Low Funds').length;
    
    return {
      totalAwarded,
      totalSpent,
      totalRemaining,
      spendingRate: totalAwarded > 0 ? (totalSpent / totalAwarded) * 100 : 0,
      activeProjects,
      expiredProjects,
      lowFundsProjects
    };
  };
  
  const metrics = calculateMetrics();
  
  return (
    <Container fluid ref={reportRef}>
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <h5 className="mb-4">Funding Summary</h5>
              <Row>
                <Col md={3}>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-primary rounded-circle p-3 me-3">
                      <span className="text-white">$</span>
                    </div>
                    <div>
                      <div className="text-muted">Total Awarded</div>
                      <h5>{formatCurrency(metrics.totalAwarded)}</h5>
                    </div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-danger rounded-circle p-3 me-3">
                      <span className="text-white">$</span>
                    </div>
                    <div>
                      <div className="text-muted">Total Spent</div>
                      <h5>{formatCurrency(metrics.totalSpent)}</h5>
                    </div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-success rounded-circle p-3 me-3">
                      <span className="text-white">$</span>
                    </div>
                    <div>
                      <div className="text-muted">Total Remaining</div>
                      <h5>{formatCurrency(metrics.totalRemaining)}</h5>
                    </div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-info rounded-circle p-3 me-3">
                      <span className="text-white">%</span>
                    </div>
                    <div>
                      <div className="text-muted">Spending Rate</div>
                      <h5>{metrics.spendingRate.toFixed(1)}%</h5>
                    </div>
                  </div>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col md={4}>
                  <div className="text-center p-2 border rounded">
                    <span className="badge bg-success me-2">{metrics.activeProjects}</span>
                    Active Projects
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-2 border rounded">
                    <span className="badge bg-warning me-2">{metrics.lowFundsProjects}</span>
                    Low Funds Projects
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-2 border rounded">
                    <span className="badge bg-danger me-2">{metrics.expiredProjects}</span>
                    Expired Projects
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-3">
        <Col>
          <div className="d-flex justify-content-center">
            <div className="btn-group">
              <Button 
                variant={chartType === 'allocation' ? 'primary' : 'outline-primary'}
                onClick={() => setChartType('allocation')}
              >
                Budget Allocation
              </Button>
              <Button 
                variant={chartType === 'category' ? 'primary' : 'outline-primary'}
                onClick={() => setChartType('category')}
              >
                Expense Categories
              </Button>
              <Button 
                variant={chartType === 'timeline' ? 'primary' : 'outline-primary'}
                onClick={() => setChartType('timeline')}
              >
                Spending Timeline
              </Button>
              <Button 
                variant={chartType === 'comparison' ? 'primary' : 'outline-primary'}
                onClick={() => setChartType('comparison')}
              >
                Project Comparison
              </Button>
            </div>
          </div>
        </Col>
      </Row>
      
      <Row>
        <Col>
          {renderChart()}
        </Col>
      </Row>
       <div style={{ display: 'flex' }}>
      <Button 
        onClick={handleExportPDF} 
        disabled={exporting}
        style={{ marginLeft: 'auto' }}
      >
        {exporting ? 'Exporting...' : 'Export as PDF'}
      </Button>
    </div>

    </Container>
  );
};

export default FundingVisualization;