// // ResearchBridgeLanding.jsx
// import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
// import image from '../assets/Hluma Nziweni.jpg'
import { Navbar, Nav, Container, Button, Card, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function ResearchBridgeLanding() {
  return (
    <>
      {/* Fixed Navigation Bar */}
      <Navbar bg="dark" variant="dark" expand="lg" fixed="top">
        <Container>
          <Navbar.Brand href="#home">ResearchBridge</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link href="#features">Features</Nav.Link>
              <Nav.Link href="#how-it-works">How It Works</Nav.Link>
              <Nav.Link href="#testimonials">Testimonials</Nav.Link>
              <Link to="/Login" className="text-decoration-none">
              <Button variant="outline-light" className="ms-2">Sign In</Button>
              </Link>
              <Link to="/Register" className="text-decoration-none">
              <Button variant="primary" className="ms-2">Register</Button>
              </Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <section id="home" className="bg-primary text-white py-5 " style={{  minHeight: '87vh', display: 'flex', alignItems: 'center' }}>
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <h1 className="display-4 fw-bold mb-4">Connect. Collaborate. Innovate.</h1>
              <p className="lead mb-4">
                A comprehensive platform for university researchers to find collaborators, 
                manage resources, and track project progress efficiently.
              </p>
              <div>
                <Button variant="light" size="lg" className="me-3">Start a Project</Button>
                <Button variant="outline-light" size="lg">Find Collaborators</Button>
              </div>
            </Col>
            <Col lg={4} >
              <img 
                // src={image} 
                alt="Researchers collaborating" 
                className="img-fluid rounded shadow-lg" 
              />
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="py-5 bg-light">
        <Container>
          <h2 className="text-center mb-5">Key Features</h2>
          <Row>
            <Col md={3} sm={6} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="mb-3">📋</div>
                  <Card.Title>Research Project Postings</Card.Title>
                  <Card.Text>
                    Create and discover research projects seeking collaborators
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="mb-3">🔄</div>
                  <Card.Title>Collaboration Tools</Card.Title>
                  <Card.Text>
                    Built-in messaging, document sharing, and milestone tracking
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="mb-3">💰</div>
                  <Card.Title>Funding Tracking</Card.Title>
                  <Card.Text>
                    Monitor grants, spending, and funding requirements
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="mb-3">📊</div>
                  <Card.Title>Reporting</Card.Title>
                  <Card.Text>
                    Generate customizable reports exportable as CSV or PDF
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <div className="text-center mt-4">
            <Button variant="primary" size="lg">Learn More About Features</Button>
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-5">
        <Container>
          <h2 className="text-center mb-5">How It Works</h2>
          <Row className="align-items-center mb-5">
            <Col md={6} className="mb-4 mb-md-0">
              <img 
                src="/api/placeholder/500/300" 
                alt="Creating a research project" 
                className="img-fluid rounded shadow" 
              />
            </Col>
            <Col md={6}>
              <h3>Create Your Research Profile</h3>
              <p className="lead">
                Set up your academic profile with your expertise, publications, and research interests
                to help others find you for potential collaborations.
              </p>
              <ul className="list-unstyled">
                <li className="mb-2">✓ Add your research specialties</li>
                <li className="mb-2">✓ Link your publications</li>
                <li className="mb-2">✓ Specify your academic affiliations</li>
              </ul>
            </Col>
          </Row>
          <Row className="align-items-center mb-5 flex-md-row-reverse">
            <Col md={6} className="mb-4 mb-md-0">
              <img 
                src="/api/placeholder/500/300" 
                alt="Finding collaborators" 
                className="img-fluid rounded shadow" 
              />
            </Col>
            <Col md={6}>
              <h3>Find Collaborators or Join Projects</h3>
              <p className="lead">
                Search for ongoing research projects that need your expertise or find
                researchers with complementary skills for your own projects.
              </p>
              <ul className="list-unstyled">
                <li className="mb-2">✓ Search by discipline, institution, or keyword</li>
                <li className="mb-2">✓ View researcher profiles and project details</li>
                <li className="mb-2">✓ Send collaboration requests with custom messages</li>
              </ul>
            </Col>
          </Row>
          <Row className="align-items-center">
            <Col md={6} className="mb-4 mb-md-0">
              <img 
                src="/api/placeholder/500/300" 
                alt="Managing research projects" 
                className="img-fluid rounded shadow" 
              />
            </Col>
            <Col md={6}>
              <h3>Manage Your Research Work</h3>
              <p className="lead">
                Use integrated tools to coordinate with team members, track progress,
                and manage funding across multiple research initiatives.
              </p>
              <ul className="list-unstyled">
                <li className="mb-2">✓ Set project milestones and deadlines</li>
                <li className="mb-2">✓ Share and collaborate on documents</li>
                <li className="mb-2">✓ Track grant usage and generate reports</li>
              </ul>
            </Col>
          </Row>
          <div className="text-center mt-5">
            <Button variant="primary" size="lg">Get Started Today</Button>
          </div>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-5 bg-light">
        <Container>
          <h2 className="text-center mb-5">What Researchers Say</h2>
          <Row>
            <Col lg={4} md={6} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body className="p-4">
                  <div className="mb-3 text-warning">★★★★★</div>
                  <Card.Text className="mb-4">
                    "ResearchBridge has transformed how our department manages multi-university projects. 
                    The funding tracking feature alone has saved us countless hours of administrative work."
                  </Card.Text>
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" 
                         style={{ width: '50px', height: '50px' }}>
                      DR
                    </div>
                    <div className="ms-3">
                      <p className="mb-0 fw-bold">Dr. Rebecca Johnson</p>
                      <p className="mb-0 text-muted">Neuroscience, Stanford University</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body className="p-4">
                  <div className="mb-3 text-warning">★★★★★</div>
                  <Card.Text className="mb-4">
                    "Finding the right collaborators used to be based on chance encounters at conferences. 
                    Now I can search for exactly the expertise I need for my research projects."
                  </Card.Text>
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" 
                         style={{ width: '50px', height: '50px' }}>
                      MC
                    </div>
                    <div className="ms-3">
                      <p className="mb-0 fw-bold">Prof. Miguel Cortez</p>
                      <p className="mb-0 text-muted">Computer Science, MIT</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6} className="mb-4 mx-auto">
              <Card className="h-100 shadow-sm">
                <Card.Body className="p-4">
                  <div className="mb-3 text-warning">★★★★★</div>
                  <Card.Text className="mb-4">
                    "The milestone tracking and reporting features have made it so much easier
                    to keep our research teams aligned and to prepare updates for our funding agencies."
                  </Card.Text>
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" 
                         style={{ width: '50px', height: '50px' }}>
                      SA
                    </div>
                    <div className="ms-3">
                      <p className="mb-0 fw-bold">Dr. Sarah Ahmed</p>
                      <p className="mb-0 text-muted">Environmental Science, UC Berkeley</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-4">
        <Container>
          <Row>
            <Col md={4} className="mb-4 mb-md-0">
              <h5>ResearchBridge</h5>
              <p className="mb-0">Connecting researchers worldwide to advance academic collaboration</p>
            </Col>
            <Col md={4} className="mb-4 mb-md-0">
              <h5>Quick Links</h5>
              <ul className="list-unstyled">
                <li><a href="#features" className="text-white text-decoration-none">Features</a></li>
                <li><a href="#how-it-works" className="text-white text-decoration-none">How It Works</a></li>
                <li><a href="#testimonials" className="text-white text-decoration-none">Testimonials</a></li>
              </ul>
            </Col>
            <Col md={4}>
              <h5>Contact</h5>
              <ul className="list-unstyled">
                <li>support@ResearchBridge.com</li>
                <li>+1 (555) 123-4567</li>
              </ul>
            </Col>
          </Row>
          <hr className="my-4" />
          <div className="text-center">
            <p className="mb-0">&copy; {new Date().getFullYear()} ResearchBridge. All rights reserved.</p>
          </div>
        </Container>
      </footer>
    </>
  );
}

export default ResearchBridgeLanding;