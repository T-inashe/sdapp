import React, { useContext, useEffect, useRef, useState } from 'react';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import config from '../config';
import './Chat.css';
import {FiArrowLeft} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

interface Message {
  _id: string;
  sender: { _id: string; fname: string; lname: string; role:string };
  receiver: string;
  content: string;
  projectId: string;
  createdAt: string;
  delivered: boolean;
  read: boolean;
}

interface ChatPageProps {
  setActiveTab?: (tab: string) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ setActiveTab }) => {
  const { user } = useContext(AuthContext);
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      fetchMessages();
    }
  }, [user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${config.API_URL}/api/message/project/${id}`);
      const fetchedMessages: Message[] = response.data;
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  };

  const sendMessage = async () => {
  if (!newMessage.trim()) return;

  const otherUserId = messages.length
    ? (messages[0].sender._id !== user?.id
        ? messages[0].sender._id
        : messages[0].receiver)
    : null;

  if (!otherUserId) {
    console.error('Cannot determine receiver');
    return;
  }

  try {
    const response = await axios.post(`${config.API_URL}/api/message`, {
      sender: user?.id,
      receiver: otherUserId,
      projectId: id,
      content: newMessage,
    });

    const sentMessage = response.data;

    // Immediately mark as delivered
    await axios.patch(`${config.API_URL}/api/message/delivered/${sentMessage._id}`);

    const newMsg = {
      ...response.data,
      sender: {
        _id: user?.id,
        fname: user?.name?.split(' ')[0],
        lname: user?.name?.split(' ')[1],
      },
    };
    setMessages((prev) => [...prev, newMsg]);
    setNewMessage('');
  } catch (error) {
    console.error('Error sending message', error);
  }
};


  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="page-container">
      
      <div>
      <Link to="/collaboratordashboard" className="btn btn-link text-decoration-none ps-0">
        <FiArrowLeft /> Back to Dashboard
        </Link>
          <h2 className="mt-2 mb-0">Chat</h2>
          <p className="text-muted">
            Communicate with your collaborators
          </p>
            </div>
    <div className="whatsapp-chat-container">
      <div className="chat-header">
        <div className="user-info">
          <strong>
            {messages.length > 0 && messages[0].sender.fname} {messages.length > 0 && messages[0].sender.lname}
          </strong>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`chat-message ${msg.sender._id === user?.id ? 'sent' : 'received'}`}
          >
            <div className="message-content">{msg.content}</div>
            <div className="message-time">
              {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}

              {/* Show read/delivered only for messages sent by this user */}
              {msg.sender._id === user?.id && (
                <span 
                  className="read-status" 
                  data-testid={`read-status-${msg._id}`}
                  data-read={msg.read ? 'true' : 'false'}
                >
                  {msg.read ? '✔️✔️' : '✔️'}
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <input
          type="text"
          placeholder="Type a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button className="send-btn" onClick={sendMessage}>
          &#9658;
        </button>
      </div>
    </div>
    </div>
  );
};

export default ChatPage;