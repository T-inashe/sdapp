import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Card, Dropdown } from 'react-bootstrap';
import { FiBell } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import config from '../config';
import './Notifications.css';
import AuthContext from '../context/AuthContext';

interface User {
  _id: string;
  fname: string;
  lname: string;
  role: string;
  unreadCount?: number; // optional in case some users have no unread messages
}

interface Message {
  _id: string;
  sender: { _id: string; fname: string; lname: string; role: string };
  receiver: { _id: string; fname: string; lname: string ; role: string};
  projectId: string;
  content: string;
  delivered: boolean;
  read: boolean;
}


const Allm: React.FC = () => {
  const { user } = useContext(AuthContext); 
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchUsers();
     fetchMessages();
  }, []);

  useEffect(() => {
    if (selectedRole === 'All') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(
        users.filter(user => user.role.toLowerCase() === selectedRole.toLowerCase())
      );
    }
  }, [selectedRole, users]);

  const fetchMessages = async () => {
  const receiverId = user?.id;
  if (!receiverId) return;

  try {
    const response = await axios.get(`${config.API_URL}/api/message/user/${receiverId}`);
    if (Array.isArray(response.data)) {
      setMessages(response.data);
      fetchUnreadCounts(receiverId);
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
  }
};



  const fetchUnreadCounts = async (receiverId: string) => {
  try {
    const response = await axios.get(`${config.API_URL}/api/message/unread-counts/${receiverId}`);
    const counts: Record<string, number> = {};
    response.data.forEach((item: { senderId: string; unreadCount: number }) => {
      counts[item.senderId] = item.unreadCount;
    });
    setUnreadCounts(counts);
  } catch (error) {
    console.error('Error fetching unread message counts:', error);
  }
};

const markMessageAsRead = async (messageId: string) => {
  try {
    await axios.put(`${config.API_URL}/api/message/read/${messageId}`);
    setMessages(prev =>
      prev.map(msg => msg._id === messageId ? { ...msg, read: true } : msg)
    );
  } catch (err) {
    console.error('Failed to mark message as read:', err);
  }
};


  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${config.API_URL}/api/users`);
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error connecting to Users API');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (fname: string, lname: string): string => {
    return `${fname[0] ?? ''}${lname[0] ?? ''}`.toUpperCase();
  };
  
const getDashboardTitle = () => {
    const role = user?.role;
    if (role === 'Researcher') return '/collaboratordashboard';
    if (role === 'Reviewer') return '/reviewerdashboard';
    if (role === 'Admin') return '/admindashboard';
    return '/'; 
  };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0">All Users</h5>
          <Link to={getDashboardTitle()} className="text-decoration-none text-primary small">
            ← Back to Dashboard
          </Link>
        </div>

        <Dropdown>
          <Dropdown.Toggle variant="outline-secondary" size="sm">
            Filter: {selectedRole}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => setSelectedRole('All')}>All</Dropdown.Item>
            <Dropdown.Item onClick={() => setSelectedRole('Reviewer')}>Reviewer</Dropdown.Item>
            <Dropdown.Item onClick={() => setSelectedRole('Researcher')}>Researcher</Dropdown.Item>
            <Dropdown.Item onClick={() => setSelectedRole('Admin')}>Admin</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Card.Header>

      <Card.Body className="p-0">
        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading users...</p>
          </div>
        ) : error ? (
          <div className="text-center py-5 text-danger">
            <p>{error}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-5">
            <FiBell size={48} className="text-muted mb-3" />
            <h4>No Users Found</h4>
          </div>
        ) : (
          filteredUsers.map(users => (
            <Link
              key={users._id}
              to={`/individualchat/${users._id}`}
              className="text-decoration-none text-dark"
             onClick={() => {
            if (messages.length > 0) {
              messages.forEach(message => {
                // Check if the message is sent by the current user
                if (message.sender._id !== user?.id) {
                  markMessageAsRead(message._id); 
                }
              });
            }
          }}

            >
              <div className="d-flex align-items-center justify-content-between border-bottom px-3 py-2 hover-bg-light">
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: '40px',
                      height: '40px',
                      fontSize: '16px',
                      fontWeight: 600,
                    }}
                  >
                    {getInitials(users.fname, users.lname)}
                  </div>
                  <div>
                    <h6 className="mb-0">{users.fname} {users.lname}</h6>
                    <small className="text-muted">{users.role}</small>
                  </div>
                </div>

             {unreadCounts[users._id] > 0 && (
              <span className="badge bg-danger">{unreadCounts[users._id]}</span>
            )}

              </div>
            </Link>
          ))
        )}
      </Card.Body>
    </Card>
  );
};

export default Allm;
