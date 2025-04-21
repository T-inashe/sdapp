import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CreateProject() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    researchGoals: '',
    researchArea: '',
    startDate: '',
    endDate: '',
    fundingAvailable: false,
    fundingAmount: '',
    collaboratorsNeeded: false,
    collaboratorRoles: '',
    institution: '',
    contactEmail: ''
  });

  const [validated, setValidated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const researchAreas = [
    'Artificial Intelligence',
    'Data Science',
    'Machine Learning',
    'Natural Language Processing',
    'Computer Vision',
    'Bioinformatics',
    'Environmental Science',
    'Physics',
    'Chemistry',
    'Mathematics',
    'Social Sciences',
    'Psychology',
    'Economics',
    'Medicine',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8081/api/projects/create', formData, {
        withCredentials: true
      });
      
      if (response.data.success) {
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Failed to create project');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Project creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h2 className="mb-0">Create New Research Project</h2>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <div className="alert alert-danger">{error}</div>}
              
              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Project Title *</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Enter the title of your research project"
                  />
                  <Form.Control.Feedback type="invalid">
                    Please provide a project title.
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    placeholder="Provide a comprehensive description of your research project"
                  />
                  <Form.Control.Feedback type="invalid">
                    Please provide a project description.
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Research Goals *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="researchGoals"
                    value={formData.researchGoals}
                    onChange={handleChange}
                    required
                    placeholder="List the key research goals and objectives"
                  />
                  <Form.Control.Feedback type="invalid">
                    Please provide research goals.
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Research Area *</Form.Label>
                  <Form.Select
                    name="researchArea"
                    value={formData.researchArea}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Research Area</option>
                    {researchAreas.map((area, index) => (
                      <option key={index} value={area}>{area}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    Please select a research area.
                  </Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Start Date *</Form.Label>
                      <Form.Control
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Please select a start date.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>End Date *</Form.Label>
                      <Form.Control
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Please select an end date.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Funding Available"
                    name="fundingAvailable"
                    checked={formData.fundingAvailable}
                    onChange={handleChange}
                  />
                </Form.Group>

                {formData.fundingAvailable && (
                  <Form.Group className="mb-3">
                    <Form.Label>Funding Amount ($)</Form.Label>
                    <Form.Control
                      type="number"
                      name="fundingAmount"
                      value={formData.fundingAmount}
                      onChange={handleChange}
                      placeholder="Enter the available funding amount"
                    />
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Seeking Collaborators"
                    name="collaboratorsNeeded"
                    checked={formData.collaboratorsNeeded}
                    onChange={handleChange}
                  />
                </Form.Group>

                {formData.collaboratorsNeeded && (
                  <Form.Group className="mb-3">
                    <Form.Label>Collaborator Roles Needed</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="collaboratorRoles"
                      value={formData.collaboratorRoles}
                      onChange={handleChange}
                      placeholder="Describe the roles and expertise you're looking for"
                    />
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Institution/University</Form.Label>
                  <Form.Control
                    type="text"
                    name="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    placeholder="Your affiliated institution"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Contact Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="Email for project inquiries"
                  />
                </Form.Group>

                <div className="d-grid gap-2 mt-4">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating Project...' : 'Create Project'}
                  </Button>
                  <Button 
                    variant="outline-secondary"
                    size="lg"
                    onClick={() => navigate('/dashboard')}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default CreateProject;