import React, { useEffect, useState, useContext } from 'react';
import { Card, Button, Spinner, Container } from 'react-bootstrap';
import axios from 'axios';
import config from '../config';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './Notifications.css';

interface Invite {
  _id: string;
  project: {
    _id: string;
    title: string;
    funding_amount: number;
    status: string;
    creator: { role: string };
     file: {
    data: "base64-string",
    contentType: "application/pdf",
    originalName: "proposal.pdf"
  } 
  };
  sender: {
    _id: string;
    fname: string;
    lname: string;
    role: string;
  };
  receiver: {
    _id: string;
    fname: string;
    lname: string;
    role: string;
  };
  message: string;
  status: 'Pending' | 'Accepted' | 'Declined';
  respondedAt?: string;
}

const CollaboratorInvitesPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      fetchInvites();
    }
  }, [user?.id]);

  const fetchInvites = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${config.API_URL}/api/collaborator/receiver/${user?.id}`);
      console.log('Fetched invites:', res.data);
      setInvites(res.data);
    } catch (err) {
      console.error('Error fetching invites:', err);
      setInvites([]);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async (inviteId: string, projectId: string) => {
    try {
      await axios.put(`${config.API_URL}/api/collaborator/${inviteId}/accept`, {
        status: 'Accepted',
      });

      // Optionally update project status
      await axios.put(`${config.API_URL}/api/createproject/projects/${projectId}`, {
        status: 'Active Collab',
      });

      fetchInvites();
    } catch (err) {
      console.error('Error accepting invite:', err);
    }
  };

  const declineInvite = async (inviteId: string) => {
    try {
      await axios.put(`${config.API_URL}/api/collaborator/${inviteId}/decline`, {
        status: 'Declined',
      });

      fetchInvites();
    } catch (err) {
      console.error('Error declining invite:', err);
    }
  };

  const goToChat = (projectId: string) => {
    navigate(`/chat/${projectId}`);
  };

  if (loading) {
    return (
      <div className="messages-spinner">
        <Spinner animation="border" role="status"/>
      </div>
    );
  }
  
  return (
    <Container className="messages-container">
      <h2 className="messages-title">Invitations</h2>
      {invites.length === 0 ? (
        <div className="no-messages">No invites yet.</div>
      ) : (
        invites.map((invite) => {
          const senderInitial = invite.sender.fname.charAt(0).toUpperCase();

          return (
                    <Card
          key={invite._id}
          className={`message-card ${invite.status !== 'Accepted' ? 'card-disabled' : ''}`}
          onClick={() => {
            if (invite.status === 'Accepted') {
              goToChat(invite.project._id);
            }
          }}
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
                <strong>{invite.sender.fname} {invite.sender.lname}</strong>
              </div>
              <div className="role-label">{invite.sender.role}</div>
              <div className="project-title">
                <h5>Project Title: {invite.project.title}</h5>
              </div>
              <div className="download-link-container">
                <a
                  className="download-link"
                  href={`${config.API_URL}/api/createproject/${invite.project._id}/download/`}
                  download
                  onClick={(e) => e.stopPropagation()}
                >
                  📄 Download {invite.project.file.originalName}
                </a>
              </div>
              <div className="funding_amount">
                <h5>Funding: ${invite.project.funding_amount || 'No funding'}</h5>
              </div>
              <div className="project-status">{invite.status}</div>
            </div>

            <small className="text-muted">Message:</small>
            <div className="message-content">{invite.message}</div>

            {invite.status === 'Pending' ? (
              <div className="message-actions">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    acceptInvite(invite._id, invite.project._id);
                  }}
                >
                  Accept
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    declineInvite(invite._id);
                  }}
                >
                  Decline
                </Button>
              </div>
            ) : invite.status === 'Accepted' ? (
              <div className="accepted-label text-success mt-4 d-flex flex-column justify-content-center align-items-center">
                ✅ Welcome to the team!
                <Button
                  size="sm"
                  variant="success"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToChat(invite.project._id);
                  }}
                >
                  Go to group Chat
                </Button>
              </div>
            ) : (
              <div className="declined-label text-muted mt-2">
                ❌ You declined this invitation.
              </div>
            )}
          </Card.Body>
        </Card>

          );
        })
      )}
    </Container>
  );
};

export default CollaboratorInvitesPage;
