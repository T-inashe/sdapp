import  { useState, FormEvent, ChangeEvent, JSX } from 'react';
import React, { useContext} from 'react';
import { Container, Row, Col, Form, Button, Card, Spinner } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import config from '../config';

interface ProjectFormData {
  creator?: string;
  title: string;
  description: string;
  research_goals: string;
  research_area: string;
  start_date: string;
  end_date: string;
  funding_available: boolean;
  funding_amount: string;
  collaborators_needed: boolean;
  collaborator_roles: string;
  institution: string;
  contact_email: string;
}

function CreateProject() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [formData, setFormData] = useState<ProjectFormData>({
    creator:'',
    title: '',
    description: '',
    research_goals: '',
    research_area: '',
    start_date: '',
    end_date: '',
    funding_available: false,
    funding_amount: '',
    collaborators_needed: false,
    collaborator_roles: '',
    institution: '',
    contact_email: ''
  });

  const [validated, setValidated] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);


  const research_areas: string[] = [
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

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      creator: user?.id || '',
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
  
    if (form.checkValidity() === false || !file) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
  
    setIsSubmitting(true);
    setError('');
  
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value as string); // cast needed for types
      });
      data.append('file', file); 
  
      for (const [key, value] of data.entries()) {
        console.log(`${key}:`, value);
      }
      const response = await axios.post(`${config.API_URL}/api/createproject/projects`, data, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      console.log('Project created:', response.data);
      navigate('/collaboratordashboard');
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Project creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  const handleCancel = () => {
    const isConfirmed = window.confirm('Are you sure you want to discard the changes?');
    if (isConfirmed) {
      navigate('/dashboard');
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
              {error && (
                <div
                  id="form-error"
                  data-testid="form-error"
                  className="alert alert-danger"
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </div>
              )}

              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="projectTitle">Project Title *</Form.Label>
                  <Form.Control
                    id="projectTitle"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Enter the title of your research project"
                    isInvalid={validated && !formData.title}
                  />
                  <Form.Control.Feedback type="invalid">
                    Please provide a project title.
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label htmlFor="projectDescription">Description *</Form.Label>
                  <Form.Control
                    id="projectDescription"
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    placeholder="Provide a comprehensive description of your research project"
                    maxLength={1000}
                    isInvalid={validated && !formData.description}
                  />
                  <Form.Text muted>Max 1000 characters</Form.Text>
                  <Form.Control.Feedback type="invalid">
                    Please provide a project description.
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label htmlFor="researchGoals">Research Goals *</Form.Label>
                  <Form.Control
                    id="researchGoals"
                    as="textarea"
                    rows={3}
                    name="research_goals"
                    value={formData.research_goals}
                    onChange={handleChange}
                    required
                    placeholder="List the key research goals and objectives"
                    maxLength={800}
                    isInvalid={validated && !formData.research_goals}
                  />
                  <Form.Text muted>Max 800 characters</Form.Text>
                  <Form.Control.Feedback type="invalid">
                    Please provide research goals.
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Upload Project Image/File *</Form.Label>
                  <Form.Control 
                    type="file" 
                    accept="image/*,application/pdf" 
                    onChange={(e) => {
                      const target = e.target as HTMLInputElement;
                      setFile(target.files?.[0] || null);
                    }}
                     
                    required 
                  />
                </Form.Group>
               
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="researchArea">Research Area *</Form.Label>
                  <Form.Select
                    name="research_area"
                    value={formData.research_area}
                    onChange={handleChange}
                    required
                    isInvalid={validated && !formData.research_area}
                  >
                    <option value="">Select Research Area</option>
                    {research_areas.map((area, index) => (
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
                      <Form.Label htmlFor="startDate">Start Date *</Form.Label>
                      <Form.Control
                        id="startDate"
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        required
                        isInvalid={validated && !formData.start_date}
                      />
                      <Form.Control.Feedback type="invalid">
                        Please select a start date.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label htmlFor="endDate">End Date *</Form.Label>
                      <Form.Control
                        id="endDate"
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                        required
                        isInvalid={validated && !formData.end_date}
                      />
                      <Form.Control.Feedback type="invalid">
                        Please select an end date.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Check
                    id="fundingAvailable"
                    type="checkbox"
                    label="Funding Available"
                    name="funding_available"
                    checked={formData.funding_available}
                    onChange={handleChange}
                  />
                </Form.Group>

                {formData.funding_available && (
                  <Form.Group className="mb-3">
                    <Form.Label htmlFor="fundingAmount">Funding Amount ($)</Form.Label>
                    <Form.Control
                      id="fundingAmount"
                      type="number"
                      name="funding_amount"
                      value={formData.funding_amount}
                      onChange={handleChange}
                      required={formData.funding_available}
                      isInvalid={validated && formData.funding_available && !formData.funding_amount}
                      min="0"
                      placeholder="Enter the available funding amount"
                      aria-required="true"
                    />
                    <Form.Control.Feedback type="invalid">
                      Please enter a valid funding amount.
                    </Form.Control.Feedback>
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Check
                    id="collaboratorsNeeded"
                    type="checkbox"
                    label="Seeking Collaborators"
                    name="collaborators_needed"
                    checked={formData.collaborators_needed}
                    onChange={handleChange}
                  />
                </Form.Group>

                {formData.collaborators_needed && (
                  <Form.Group className="mb-3">
                    <Form.Label htmlFor="collaboratorRoles">Collaborator Roles Needed</Form.Label>
                    <Form.Control
                      id="collaboratorRoles"
                      as="textarea"
                      rows={2}
                      name="collaborator_roles"
                      value={formData.collaborator_roles}
                      onChange={handleChange}
                      placeholder="Describe the roles and expertise you're looking for"
                      required={formData.collaborators_needed}
                      isInvalid={validated && formData.collaborators_needed && !formData.collaborator_roles}
                    />
                    <Form.Control.Feedback type="invalid">
                      Please specify the roles needed for collaboration.
                    </Form.Control.Feedback>
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label htmlFor="institution">Institution/University</Form.Label>
                  <Form.Control
                    id="institution"
                    type="text"
                    name="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    placeholder="Your affiliated institution"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label htmlFor="contactEmail">Contact Email</Form.Label>
                  <Form.Control
                    id="contactEmail"
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="Email for project inquiries"
                    required
                    isInvalid={validated && !formData.contact_email}
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter a valid contact email.
                  </Form.Control.Feedback>
                </Form.Group>

                <div className="d-grid gap-2 mt-4">
                  <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />{' '}
                        Creating Project...
                      </>
                    ) : (
                      'Create Project'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    size="lg"
                    onClick={handleCancel}
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
