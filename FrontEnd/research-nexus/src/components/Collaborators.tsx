import React, { useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Form } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import config from '../config';
import { useNavigate, useParams } from 'react-router-dom';
import './dashboard/Dashboard.css';

interface User {
  _id: string;
  fname: string;
  lname: string;
  avatar?: string;
  academicRole: string;
  department: string;
  researchExperience: string;
  researcharea: string;
}

const Collaborators: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [messages, setMessages] = useState<Record<string, string>>({});
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${config.API_URL}/api/users`, {
          withCredentials: true
        });
        const allUsers = response.data || [];
        const otherUsers = allUsers.filter((u: User) => u._id !== user?.id);
        setUsers(otherUsers);
        setFilteredUsers(otherUsers);
      } catch (err) {
        setError('Failed to fetch users.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
  
    const filtered = users.filter(user => {
      const name = user.fname?.toLowerCase() || '';
      const area = user.researcharea?.toLowerCase() || '';
      const dept = user.department?.toLowerCase() || '';
      const Experience = user.researchExperience?.toLowerCase() || '';
  
      return name.includes(value) || area.includes(value) || dept.includes(value) || Experience.includes(value);
    });
  
    setFilteredUsers(filtered);
  };
  

  const handleSendMessage = async (receiverId: string) => {
    console.log('Send button clicked for:', receiverId); // ✅ Add this
  
    const content = messages[receiverId];
  
    if (!content || !id || !user?.id) {
      console.log('Missing data:', { content, id, userId: user?.id }); // ✅ Log missing values
      return;
    }
  
    try {
      await axios.post(`${config.API_URL}/api/message`, {
        sender: user.id,
        receiver: receiverId,
        projectId: id,
        content
      }, {
        withCredentials: true
      });
  
      alert('Message sent!');
      navigate('/collaboratordashboard');
      setMessages(prev => ({ ...prev, [receiverId]: '' }));
  
    } catch (err) {
      console.error('Failed to send message', err);
      alert('Failed to send message');
    }
  };
  

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading researchers...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <h4>Find Researchers</h4>
              <Form.Control
                type="text"
                placeholder="Search by name, department, research area, or research experience"
                value={searchText}
                onChange={handleSearchChange}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <h5>{filteredUsers.length} Researchers Found</h5>
          {filteredUsers.map(user => (
            <Card key={user._id} className="mb-3 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fname}
                        className="rounded-circle me-3"
                        width="60"
                        height="60"
                      />
                    ) : (
                      <div className="rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center me-3" style={{ width: 60, height: 60 }}>
                        {user.fname.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h5 className="mb-1">{user.fname} {user.lname}</h5>
                      <p className="mb-0 text-muted">{user.academicRole} • {user.department}</p>
                    </div>
                  </div>
                  <Badge bg="info" className="text-white">{user.researcharea}</Badge>
                </div>

                <div className="mb-3">
                  <small className="text-muted">Research Experience:</small>
                  <p>{user.researchExperience}</p>
                </div>

                <div className="d-flex">
                  <Form.Control
                    type="text"
                    placeholder="Type your message..."
                    className="me-2"
                    value={messages[user._id] || ''}
                    onChange={(e) => setMessages(prev => ({ ...prev, [user._id]: e.target.value }))}
                  />
                  <Button variant="primary" onClick={() => handleSendMessage(user._id)}>
                    Send
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </Col>
      </Row>
    </Container>
  );
};

export default Collaborators;
