import { useState, useEffect, FormEvent, ChangeEvent, JSX } from 'react';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

interface ProjectFormData {
  title: string;
  description: string;
  researchGoals: string;
  researchArea: string;
  startDate: string;
  endDate: string;
  fundingAvailable: boolean;
  fundingAmount: string;
  collaboratorsNeeded: boolean;
  collaboratorRoles: string;
  institution: string;
  contactEmail: string;
}

function EditProject(): JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<ProjectFormData>({
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

  const [validated, setValidated] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const researchAreas: string[] = [
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

  useEffect(() => {
    const fetchProjectData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:8081/api/projects/${id}`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          const projectData = response.data.project;
          
          // Convert from snake_case database fields to camelCase used in the form
          setFormData({
            title: projectData.title,
            description: projectData.description,
            researchGoals: projectData.research_goals,
            researchArea: projectData.research_area,
            startDate: formatDateForInput(projectData.start_date),
            endDate: formatDateForInput(projectData.end_date),
            fundingAvailable: projectData.funding_available,
            fundingAmount: projectData.funding_amount || '',
            collaboratorsNeeded: projectData.collaborators_needed,
            collaboratorRoles: projectData.collaborator_roles || '',
            institution: projectData.institution || '',
            contactEmail: projectData.contact_email
          });
        } else {
          setError(response.data.message || 'Failed to load project data');
        }
      } catch (err) {
        setError('Server error. Please try again later.');
        console.error('Project loading error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [id]);

  // Format date from database (YYYY-MM-DD) to input field format
  const formatDateForInput = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
      const response = await axios.put(`http://localhost:8081/api/projects/${id}/update`, formData, {
        withCredentials: true
      });
      
      if (response.data.success) {
        navigate(`/projects/${id}`);
      } else {
        setError(response.data.message || 'Failed to update project');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Project update error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading project data...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h2 className="mb-0">Edit Research Project</h2>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <div className="alert alert-danger">{error}</div>}
              
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
                  />
                  <Form.Control.Feedback type="invalid">
                    Please provide a project description.
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label htmlFor="ResearchGoals">Research Goals *</Form.Label>
                  <Form.Control
                    id="ResearchGoals"
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
                  <Form.Label htmlFor="researchArea">Research Area *</Form.Label>
                  <Form.Select
                    id="researchArea"
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
  <Form.Label htmlFor="startDate">Start Date *</Form.Label>
  <Form.Control
    id="startDate"
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
  <Form.Label htmlFor="endDate">End Date *</Form.Label>
  <Form.Control
    id="endDate"
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
id="fundungAvailable"
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
  placeholder="Enter the available funding amount"
/>
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
/>
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
/>
</Form.Group>

<div className="d-grid gap-2 mt-4">
<Button 
type="submit" 
variant="primary" 
size="lg"
disabled={isSubmitting}
>
{isSubmitting ? 'Saving Changes...' : 'Save Changes'}
</Button>
<Button 
variant="outline-secondary"
size="lg"
onClick={() => navigate(`/projects/${id}`)}
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

export default EditProject;