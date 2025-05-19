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
    creator: { _id: string, role: string };
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
    department: string;
    researchExperience: string;
    researcharea: string;
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
  type: string;
}

const CollaboratorInvitesPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [applications, setApplications] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      fetchInvites();
      fetchApplications();
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

  const fetchApplications = async () => {
  try {
    const res = await axios.get(`${config.API_URL}/api/collaborator/request/${user?.id}`);
    setApplications(res.data);
  } catch (err) {
    console.error('Error fetching applications:', err);
    setApplications([]);
  }
};


const acceptInvite = async (inviteId: string,projectId: string, type: string) => {
  try {
    if (type === 'application') {
      // Creator is accepting someone's request
      await axios.put(`${config.API_URL}/api/collaborator/${inviteId}/acceptapplication`);
    } else if (type === 'invite') {
      // I am accepting an invite to join someone else's project
      await axios.put(`${config.API_URL}/api/collaborator/${inviteId}/accept`);
    }

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
        <Spinner animation="border" />
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
                    acceptInvite(invite._id, invite.project._id, invite.type)
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
                {user?.id === invite.project.creator._id
                  ? '✅ New collaborator added!'
                  : '✅ Welcome to the team!'}
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
      <h2 className="messages-title mt-5">Collaboration Requests</h2>
    {applications.length === 0 ? (
      <div className="no-messages">No requests yet.</div>
    ) : (
      applications.map((app) => {
        const isSender = app.sender._id === user?.id; // or app.sender.id
        return (
          <Card
      key={app._id}
      className="message-card mb-4 shadow-sm"
      onClick={() => {
        if (app.status === 'Accepted') {
          goToChat(app.project._id);
        }
      }}
      style={{
        cursor: app.status === 'Accepted' ? 'pointer' : 'default',
      }}
    >
    <Card.Body>
      {!isSender ? (
        <>
          <div className="d-flex align-items-center mb-3">
            <div
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0"
              style={{
                width: 50,
                height: 50,
                fontSize: 20,
                fontWeight: '700',
                marginRight: 15,
                userSelect: 'none',
              }}
              aria-label={`Avatar of ${app.sender.fname}`}
            >
              {app.sender.fname.charAt(0).toUpperCase()}
            </div>
            <div>
              <h5 className="mb-1">
                {app.sender.fname} {app.sender.lname}{' '}
                <small className="text-muted">wants to join your project:</small>
              </h5>
              <h6 className="mb-0 fw-bold">{app.project.title}</h6>
            </div>
          </div>

          <div className="mb-3">
            <div>
              <strong>Role: </strong>
              <span className="text-secondary">{app.sender.role}</span>
            </div>
            <div>
              <strong>Research Experience: </strong>
              <span className="text-secondary">{app.sender.researchExperience}</span>
            </div>
            <div>
              <strong>Research Area: </strong>
              <span className="text-secondary">{app.sender.researcharea}</span>
            </div>
            <div>
              <strong>Status: </strong>
              <span
                className={
                  app.status === 'Pending'
                    ? 'text-warning'
                    : app.status === 'Accepted'
                    ? 'text-success'
                    : 'text-muted'
                }
              >
                {app.status}
              </span>
            </div>
          </div>

          <div className="mb-4" style={{ whiteSpace: 'pre-wrap' }}>
            Message: {app.message}
          </div>

          {app.status === 'Pending' && (
            <div className="d-flex gap-2">
              <Button
                size="sm"
                variant="success"
                onClick={async (e) => {
                  e.stopPropagation();
                  await acceptInvite(app._id, app.project._id, app.type);
                  setApplications((prevApps) =>
                    prevApps.map((a) =>
                      a._id === app._id ? { ...a, status: 'Accepted' } : a
                    )
                  );
                }}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline-danger"
                onClick={async (e) => {
                  e.stopPropagation();
                  await declineInvite(app._id);
                  setApplications((prevApps) =>
                    prevApps.map((a) =>
                      a._id === app._id ? { ...a, status: 'Declined' } : a
                    )
                  );
                }}
              >
                Decline
              </Button>
            </div>
          )}

          {app.status === 'Accepted' && (
            <div className="text-success fw-semibold mt-3">
              ✅ You accepted this request.
              <Button
                size="sm"
                variant="success"
                className="ms-3"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent parent click
                  goToChat(app.project._id);
                }}
              >
                Go to Group Chat
              </Button>
            </div>
          )}

          {app.status === 'Declined' && (
            <div className="text-muted fst-italic">❌ You declined this request.</div>
          )}
        </>
      ) : (
        <div className="text-muted fst-italic">
          You sent a request to join <strong>{app.project.title}</strong>
          <br />
          <span>Status: </span>
          {app.status === 'Pending' ? (
            <span className="text-warning fw-semibold">⏳ Awaiting approval</span>
          ) : app.status === 'Accepted' ? (
            <span className="text-success fw-semibold">✅ Accepted</span>
          ) : (
            <span className="text-muted fw-semibold">❌ Declined</span>
          )}
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
