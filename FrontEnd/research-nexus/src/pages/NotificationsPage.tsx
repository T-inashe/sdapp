import React, { useContext, useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import config from '../config';
import { FiArrowLeft, FiBell, FiCheckCircle, FiTrash2, FiFilter } from 'react-icons/fi';
import './Notifications.css';

interface Notification {
  _id: string;
  message: string;
  type: 'booking' | 'message' | 'reminder' | 'success' | 'general';
  read: boolean;
  date: string;
  createdAt: string;
}

const NotificationsPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showReadStatus, setShowReadStatus] = useState<string>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const userId = user?.id;
      const response = await axios.get(`${config.API_URL}/api/notifications?user=${userId}`);
      
      if (Array.isArray(response.data)) {
        setNotifications(response.data);
      } else {
        setError('Invalid response from server');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Error connecting to notifications API');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await axios.put(`${config.API_URL}/api/notifications/read/${id}`);
      setNotifications(notifications.map(notification => 
        notification._id === id ? { ...notification, read: true } : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to update notification');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await axios.delete(`${config.API_URL}/api/notifications/${id}`);
      setNotifications(notifications.filter(notification => notification._id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification');
    }
  };

  const handleSelectNotification = (id: string) => {
    if (selectedNotifications.includes(id)) {
      setSelectedNotifications(selectedNotifications.filter(notifId => notifId !== id));
    } else {
      setSelectedNotifications([...selectedNotifications, id]);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedNotifications(filteredNotifications.map(notif => notif._id));
    } else {
      setSelectedNotifications([]);
    }
  };

  const markSelectedAsRead = async () => {
    try {
      const promises = selectedNotifications.map(id => 
        axios.put(`${config.API_URL}/api/notifications/read/${id}`)
      );
      await Promise.all(promises);
      
      setNotifications(notifications.map(notification => 
        selectedNotifications.includes(notification._id) 
          ? { ...notification, read: true } 
          : notification
      ));
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      setError('Failed to update notifications');
    }
  };

  const deleteSelected = async () => {
    try {
      const promises = selectedNotifications.map(id => 
        axios.delete(`${config.API_URL}/api/notifications/${id}`)
      );
      await Promise.all(promises);
      
      setNotifications(notifications.filter(notification => 
        !selectedNotifications.includes(notification._id)
      ));
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error deleting notifications:', error);
      setError('Failed to delete notifications');
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'booking':
        return 'primary';
      case 'message':
        return 'info';
      case 'reminder':
        return 'warning';
      case 'success':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Apply filters
  const filteredNotifications = notifications.filter(notification => {
    const typeMatch = filterType === 'all' || notification.type === filterType;
    const readStatusMatch = 
      showReadStatus === 'all' || 
      (showReadStatus === 'read' && notification.read) ||
      (showReadStatus === 'unread' && !notification.read);
    
    return typeMatch && readStatusMatch;
  });

  // Group notifications by date
  const groupNotificationsByDate = () => {
    const groups: { [key: string]: Notification[] } = {};
    
    filteredNotifications.forEach(notification => {
      const date = new Date(notification.date || notification.createdAt);
      const dateKey = date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(notification);
    });
    
    return groups;
  };
  
  const getDashboardTitle = () => {
    const role = user?.role;
    if (role === 'Researcher') return '/collaboratordashboard';
    if (role === 'Reviewer') return '/reviewerdashboard';
    if (role === 'Admin') return '/admindashboard';
    return '/'; 
  };
  const groupedNotifications = groupNotificationsByDate();
  const dateGroups = Object.keys(groupedNotifications).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const allSelected = filteredNotifications.length > 0 && 
    filteredNotifications.every(notif => selectedNotifications.includes(notif._id));

  return (
    <Container className="py-4 notifications-page">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
            <Link to={getDashboardTitle()} className="btn btn-link text-decoration-none ps-0">
              <FiArrowLeft /> Back to Dashboard
            </Link>
              <h2 className="mt-2 mb-0">Notifications</h2>
              <p className="text-muted">
                Manage your research collaboration notifications
              </p>
            </div>
            <div>
              {selectedNotifications.length > 0 ? (
                <>
                  <Button 
                    variant="outline-primary" 
                    className="me-2"
                    onClick={markSelectedAsRead}
                  >
                    <FiCheckCircle className="me-1" /> Mark as Read
                  </Button>
                  <Button 
                    variant="outline-danger"
                    onClick={deleteSelected}
                  >
                    <FiTrash2 className="me-1" /> Delete
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline-primary"
                  onClick={() => fetchNotifications()}
                >
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <Form.Check 
                    type="checkbox" 
                    className="me-3"
                    checked={allSelected}
                    onChange={handleSelectAll}
                  />
                  <span>Select All</span>
                </div>
                <div className="d-flex gap-3">
                  <Form.Group className="d-flex align-items-center">
                    <FiFilter className="me-2 text-muted" />
                    <Form.Select 
                      size="sm" 
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      style={{ width: '150px' }}
                    >
                      <option value="all">All Types</option>
                      <option value="booking">Booking</option>
                      <option value="message">Message</option>
                      <option value="reminder">Reminder</option>
                      <option value="success">Success</option>
                      <option value="general">General</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="d-flex align-items-center">
                    <Form.Select 
                      size="sm" 
                      value={showReadStatus}
                      onChange={(e) => setShowReadStatus(e.target.value)}
                      style={{ width: '150px' }}
                    >
                      <option value="all">All Status</option>
                      <option value="read">Read</option>
                      <option value="unread">Unread</option>
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {isLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-5">
                  <FiBell size={48} className="text-muted mb-3" />
                  <h4>No Notifications</h4>
                  <p className="text-muted">
                    {notifications.length === 0 
                      ? "You don't have any notifications yet."
                      : "No notifications match your current filters."}
                  </p>
                </div>
              ) : (
                <div className="notification-list">
                  {dateGroups.map(dateGroup => (
                    <div key={dateGroup} className="notification-group">
                      <div className="notification-date-header">
                        <span>{dateGroup}</span>
                      </div>
                      {groupedNotifications[dateGroup].map(notification => (
                        <div 
                          key={notification._id} 
                          className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                        >
                          <div className="d-flex align-items-center">
                            <Form.Check 
                              type="checkbox" 
                              className="me-3"
                              checked={selectedNotifications.includes(notification._id)}
                              onChange={() => handleSelectNotification(notification._id)}
                            />
                            <div className={`notification-indicator bg-${getTypeBadgeVariant(notification.type)}`}></div>
                            <div className="notification-content">
                              <div className="d-flex justify-content-between">
                                <div>
                                  <p className="mb-1">{notification.message}</p>
                                  <div className="notification-meta">
                                    <Badge 
                                      bg={getTypeBadgeVariant(notification.type)}
                                      className="me-2"
                                    >
                                      {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                                    </Badge>
                                    <small className="text-muted">
                                      {formatDate(notification.date || notification.createdAt)}
                                    </small>
                                  </div>
                                </div>
                                <div className="notification-actions">
                                  {!notification.read && (
                                    <Button 
                                      variant="link" 
                                      className="p-0 me-3 text-primary"
                                      onClick={() => markAsRead(notification._id)}
                                    >
                                      <FiCheckCircle /> Mark as Read
                                    </Button>
                                  )}
                                  <Button 
                                    variant="link" 
                                    className="p-0 text-danger"
                                    onClick={() => deleteNotification(notification._id)}
                                  >
                                    <FiTrash2 />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default NotificationsPage;