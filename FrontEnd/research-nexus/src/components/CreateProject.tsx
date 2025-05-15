import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

type CreateProjectResponse = {
  success: boolean;
  message?: string;
};

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    const value = target.type === 'checkbox'
      ? (target as HTMLInputElement).checked
      : target.value;
    const name = target.name;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    // Conditional field validation
    if (
      (formData.fundingAvailable && (!formData.fundingAmount || Number(formData.fundingAmount) <= 0)) ||
      (formData.collaboratorsNeeded && !formData.collaboratorRoles.trim())
    ) {
      setError('Please fill in all required fields for funding/collaborators.');
      setValidated(true);
      return;
    }

    // Date validation
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('End date cannot be earlier than start date.');
      setValidated(true);
      return;
    }

    setIsSubmitting(true);
    setError('');

    const sanitizedData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      researchGoals: formData.researchGoals.trim(),
      researchArea: formData.researchArea.trim(),
      institution: formData.institution.trim(),
      contactEmail: formData.contactEmail.trim(),
      fundingAmount: formData.fundingAvailable ? formData.fundingAmount : null,
      collaboratorRoles: formData.collaboratorsNeeded ? formData.collaboratorRoles.trim() : null
    };

    try {
      const response = await axios.post<CreateProjectResponse>(
        `${process.env.BACKEND_URL}/api/projects/create`,  // update API URL
        sanitizedData,
        { withCredentials: true }
      );

      if (response.data.success) {
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Failed to create project');
      }
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Server error. Please try again later.');
      } else {
        setError('Unexpected error. Please try again.');
      }
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
                    name="researchGoals"
                    value={formData.researchGoals}
                    onChange={handleChange}
                    required
                    placeholder="List the key research goals and objectives"
                    maxLength={800}
                    isInvalid={validated && !formData.researchGoals}
                  />
                  <Form.Text muted>Max 800 characters</Form.Text>
                  <Form.Control.Feedback type="invalid">
                    Please provide research goals.
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label htmlFor="researchArea">Research Area *</Form.Label>
                  <Form.Select
                    id="researchArea"
                    name="researchArea"
                    value={formData.researchArea}
                    onChange={handleChange}
                    required
                    isInvalid={validated && !formData.researchArea}
                  >
                    <option value="">Select Research Area</option>
                    {researchAreas.map((area) => (
                      <option key={area} value={area}>{area}</option>
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
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                        isInvalid={validated && !formData.startDate}
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
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        required
                        isInvalid={validated && !formData.endDate}
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
                    name="fundingAvailable"
                    checked={formData.fundingAvailable}
                    onChange={handleChange}
                  />
                </Form.Group>

                {formData.fundingAvailable && (
                  <Form.Group className="mb-3">
                    <Form.Label htmlFor="fundingAmount">Funding Amount ($)</Form.Label>
                    <Form.Control
                      id="fundingAmount"
                      type="number"
                      name="fundingAmount"
                      value={formData.fundingAmount}
                      onChange={handleChange}
                      required={formData.fundingAvailable}
                      isInvalid={validated && formData.fundingAvailable && !formData.fundingAmount}
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
                    name="collaboratorsNeeded"
                    checked={formData.collaboratorsNeeded}
                    onChange={handleChange}
                  />
                </Form.Group>

                {formData.collaboratorsNeeded && (
                  <Form.Group className="mb-3">
                    <Form.Label htmlFor="collaboratorRoles">Collaborator Roles Needed</Form.Label>
                    <Form.Control
                      id="collaboratorRoles"
                      as="textarea"
                      rows={2}
                      name="collaboratorRoles"
                      value={formData.collaboratorRoles}
                      onChange={handleChange}
                      placeholder="Describe the roles and expertise you're looking for"
                      required={formData.collaboratorsNeeded}
                      isInvalid={validated && formData.collaboratorsNeeded && !formData.collaboratorRoles}
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
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="Email for project inquiries"
                    required
                    isInvalid={validated && !formData.contactEmail}
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
