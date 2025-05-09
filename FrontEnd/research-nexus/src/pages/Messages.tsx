import React, { useEffect, useState, useContext } from 'react';
import { Card, Button, Spinner, Container, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import config from '../config';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './Notifications.css';

interface Message {
  _id: string;
  sender: { _id: string; fname: string; lname: string; role: string };
  receiver: { _id: string; fname: string; lname: string ; role: string};
  projectId: string;
  content: string;
  delivered: boolean;
  read: boolean;
  
}

const MessageInvitesPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [activeProjectIds, setActiveProjectIds] = useState<string[]>([]);
  const [invites, setInvites] = useState<Message[]>([]);
  const [acceptedProjects, setAcceptedProjects] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvites();
    fetchUserInvites();
    fetchProjectDetails();
  }, []);


  useEffect(() => {
    if (invites.length > 0) {
      checkActiveProjects(invites);
    }
  }, [invites]);
  
  useEffect(() => {
    if (invites.length > 0) {
      fetchProjectDetails();
    }
  }, [invites]);  
  
  const fetchInvites = async () => {
    try {
      const res = await axios.get(`${config.API_URL}/api/message/user/${user?.id}`);
      const uniqueInvites = res.data.reduce((acc: Message[], message: Message) => {
        if (!acc.some(msg => msg.projectId === message.projectId)) {
          acc.push(message);
        }
        return acc;
      }, []);
      setInvites(uniqueInvites);
    } catch (error) {
      console.error('Error fetching invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkActiveProjects = async (messages: Message[]) => {
    try {
      const checks = await Promise.all(
        messages.map(msg =>
          axios.get(`${config.API_URL}/api/createproject/projects/${msg.projectId}`)
        )
      );

      const activeIds = checks
        .filter(res => res.data.status === 'Active Collab')
        .map(res => res.data._id);

      setActiveProjectIds(activeIds);
    } catch (error) {
      console.error('Error checking active projects:', error);
    }
  };

  const acceptInvite = async (message: Message) => {
    try {
      await axios.put(`${config.API_URL}/api/createproject/projects/${message.projectId}`, {
        status: 'Active Collab',
        collaborators: [ user?.id] ,
      });

      setAcceptedProjects(prev => [...prev, message.projectId]);
      setActiveProjectIds(prev => [...prev, message.projectId]);

      setInvites(prev =>
        prev.map(invite =>
          invite.projectId === message.projectId
            ? { ...invite } 
            : invite
        )
      );      
    } catch (error) {
      console.error('Failed to accept invite:', error);
    }
  };

  const deleteInvite = async (id: string) => {
    try {
      const deletedMessage = invites.find(invite => invite._id === id);
      if (!deletedMessage) return;
      await axios.delete(`${config.API_URL}/api/message/${id}`);
      await axios.post(`${config.API_URL}/api/notifications`, {
        user: deletedMessage.sender._id,
        type: 'InviteDeclined',
        message: `${user?.name?.split(' ')[0]} ${user?.name?.split(' ')[1]} has declined your invitation to collaborate on "${projectDetails[deletedMessage.projectId]?.title || 'a project'}".`,
        
      });
      setInvites(prev => prev.filter(invite => invite._id !== id));
    } catch (error) {
      console.error('Failed to delete invite and notify sender:', error);
    }
  };
  

  const markMessagesAsRead = async (projectId: string) => {
    try {
      const projectMessages = invites.filter(
        (msg) => msg.projectId === projectId && msg.receiver._id === user?.id && !msg.read
      );
  
      await Promise.all(
        projectMessages.map((msg) =>
          axios.put(`${config.API_URL}/api/message/read/${msg._id}`)
        )
      );
  
      // Update local state
      setInvites((prev) =>
        prev.map((msg) =>
          msg.projectId === projectId && msg.receiver._id === user?.id
            ? { ...msg, read: true }
            : msg
        )
      );
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const [senderRole, setSenderRoles] = useState<{ [projectId: string]: string }>({});

  const fetchUserInvites = async () => {
    try {
      const res = await axios.get(`${config.API_URL}/api/message/user/${user?.id}`);
  
      const roleMap: { [projectId: string]: string } = {};
      const seenProjects = new Set();
      const uniqueInvites: Message[] = [];
  
      for (const message of res.data) {
        if (!seenProjects.has(message.projectId)) {
          seenProjects.add(message.projectId);
          uniqueInvites.push(message);
  
          try {
            const projectRes = await axios.get(`${config.API_URL}/api/createproject/projects/${message.projectId}`);

              roleMap[message.projectId] = projectRes.data.creator.role;
            
          } catch (error) {
            console.error(`Error fetching project ${message.projectId} data:`, error);
          }
        }
      }
  
      setInvites(uniqueInvites);        // Only first message per project
      setSenderRoles(roleMap);          // Only store role if user is the creator
    } catch (error) {
      console.error('Error fetching invites:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const [projectDetails, setProjectDetails] = useState<Record<string, any>>({});

  const fetchProjectDetails = async () => {
    const seenProjects = new Set<string>();
    const projectDetailsMap: Record<string, any> = {};
  
    for (const message of invites) {  // <-- use invites here
      const projectId = message.projectId;
  
      if (!seenProjects.has(projectId)) {
        seenProjects.add(projectId);
        try {
          const projectRes = await axios.get(`${config.API_URL}/api/createproject/projects/${projectId}`);
          const project = projectRes.data;
  
          projectDetailsMap[projectId] = project;
        } catch (error) {
          console.error(`Error fetching project ${projectId} data:`, error);
        }
      }
    }
  
    setProjectDetails(projectDetailsMap);
  };
  
  
  
  const goToChat = async (message: Message) => {
    await markMessagesAsRead(message.projectId);
    navigate(`/chat/${message.projectId}`);
  };

  if (loading) return <div className="messages-spinner"><Spinner animation="border" /></div>;

  return (
    <Container className="messages-container">
       <Row className="mb-4">
              <Col>
                <Card>
                  <Card.Body>
                  <h2 className="messages-title">Messages</h2>
                    <p className="text-muted">
                    Conversations that keep your research moving.
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
      {invites.length === 0 ? (
        <div className="no-messages">No messages yet.</div>
      ) : (
        invites.map((message) => {
          const senderInitial = message.sender.fname.charAt(0).toUpperCase();
          const isActive = activeProjectIds.includes(message.projectId);
          const isReceiver = user?.id === message.receiver._id;
          const isSender = user?.id === message.sender._id;

          return (
            <Card
              key={message._id}
              className={`message-card ${isActive ? 'clickable' : ''}`}
              onClick={() => isActive && goToChat(message)}
            >
              <Card.Body>
                <div className="message-header d-flex align-items-center mb-3">
                  <div
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                    style={{
                      width: 50,
                      height: 50,
                      fontSize: 20,
                      fontWeight: 'bold',
                      marginRight: '10px',
                    }}
                  >
                    {senderInitial}
                  </div>
                  <div>
                    <strong>{message.sender.fname} {message.sender.lname}</strong>
                  </div>
                  <div className="role-label">
                    {senderRole[message.projectId] && (
                      <>{senderRole[message.projectId]}</>
                    )}
                  </div>
                  <div className="project-title">
                    <h5>Project Title:{projectDetails[message.projectId]?.title || 'Untitled Project'}</h5>
                  </div>
                  <div className="funding_amount">
                    <h5>Funding:${projectDetails[message.projectId]?.funding_amount || 'No funding'}</h5>
                  </div>


                  <div className="project-status">
                    {isActive ? "Active Collab" : "Pending"}
                  </div>
                </div>
                <small className="text-muted">Message:</small>
                <div className="message-content">{message.content}</div>

                {projectDetails[message.projectId] && !projectDetails[message.projectId].collaborators?.includes(user?.id) ? (

                  isReceiver ? (
                    <div className="message-actions">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          acceptInvite(message);
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteInvite(message._id);
                        }}
                      >
                        Decline
                      </Button>
                    </div>
                  ) : isSender ? (
                    <div className="message-actions">
                      <div
                        className="awaiting-box"
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          backgroundColor: '#f0f0f0',
                          display: 'inline-block',
                          color: '#555',
                          fontSize: '14px',
                        }}
                      >
                        Awaiting approval from receiver
                      </div>
                    </div>
                  ) : null
                ) : (
                  <div className="accepted-label text-success">Accepted — Click to open chat</div>
                )}
              </Card.Body>
            </Card>
          );
        })
      )}
    </Container>
  );
};

export default MessageInvitesPage;
