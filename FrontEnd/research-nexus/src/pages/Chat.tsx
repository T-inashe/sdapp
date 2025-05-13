import React, { useContext, useEffect, useRef, useState } from 'react';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import config from '../config';
import './Chat.css';
import {FiArrowLeft, FiPaperclip} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

interface Message {
  _id: string;
  sender: { _id: string; fname: string; lname: string; role:string };
  receiver: { _id: string; fname: string; lname: string; role:string };
  content: string;
  projectId: string;
  createdAt: string;
  delivered: boolean;
  read: boolean;
  file: {
    data: "base64-string",
    contentType: "application/pdf",
    originalName: "proposal.pdf"
  } 
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
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [showFileInput, setShowFileInput] = useState(false);
  const [receiver, setReceiver] = useState<{ fname: string; lname: string } | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchMessages();
    }
    fetchMessagesbyUsers();
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchMessagesbyUsers();
    }
  }, [user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  

useEffect(() => {
  const fetchReceiverDetails = async () => {
    try {
      const response = await axios.get(`${config.API_URL}/api/users/${id}`); // Assuming your API returns user details by ID
      setReceiver(response.data); // Set the receiver's details
    } catch (error) {
      console.error('Failed to fetch receiver details', error);
    }
  };

  if (id) {
    fetchReceiverDetails();
  }
}, [id]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${config.API_URL}/api/message/project/${id}`);
      const fetchedMessages: Message[] = response.data;
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  };
  
  const fetchMessagesbyUsers = async () => {
  const userA = user?.id;
  const userB = id; // from route params

  if (!userA || !userB) {
    console.warn('Both userA and userB are required to fetch messages.');
    return;
  }

  try {
    const response = await axios.get(`${config.API_URL}/api/message`, {
      params: { userA, userB },
    });
    const fetchedMessages: Message[] = response.data;
    setMessages(fetchedMessages);
  } catch (error) {
    console.error('Failed to fetch messages', error);
  }
};

const getDashboardTitle = () => {
    const role = user?.role;
    if (role === 'Researcher') return '/collaboratordashboard';
    if (role === 'Reviewer') return '/reviewerdashboard';
    if (role === 'Admin') return '/admindashboard';
    return '/'; 
  };

  const sendMessage = async () => {
  if (!newMessage.trim()) return;

  const otherUserId = messages.length
    ? (messages[0].sender._id !== user?.id
        ? messages[0].sender._id
        : messages[0].receiver._id)
    : id;

  if (!otherUserId) {
    console.error('Cannot determine receiver');
    return;
  }


  try {
    const formData = new FormData();
    formData.append('sender', user?.id || '');
    formData.append('receiver', otherUserId);
    formData.append('projectId', id || '');
    if (newMessage) formData.append('content', newMessage);
    if (attachedFile) formData.append('file', attachedFile);
    const response = await axios.post(`${config.API_URL}/api/message`, formData, {
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
    setShowFileInput(false);
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
        <Link to={getDashboardTitle()} className="btn btn-link text-decoration-none ps-0">
          <FiArrowLeft /> Back to Dashboard
        </Link>
        <h2 className="mt-2 mb-0">Chat</h2>
        <p className="text-muted">Communicate with your collaborators</p>
      </div>

      <div className="whatsapp-chat-container">
        <div className="chat-header">
          <div className="user-info">
            <strong>
                <strong>
      {receiver 
        ? `${receiver.fname} ${receiver.lname}` 
        : (messages.length > 0 ? `${messages[0].receiver.fname} ${messages[0].receiver.lname}` : "Loading...")}
    </strong>
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
              {msg.file && (
                <a href={`${config.API_URL}/api/message/${msg._id}/download/`} download>
                  Download {msg.file.originalName}
                </a>
              )}
              <div className="message-time">
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {msg.sender._id === user?.id && (
                  <span className="read-status">
                    {msg.read ? '✔️✔️' : '✔️'}
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-wrapper">
          {showFileInput && (
            <div className="file-upload-slide">
              <input
                type="file"
                onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
              />
            </div>
          )}
          <div className="chat-input-area">
            <input
              type="text"
              placeholder="Type a message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
            />
              <button
              className="clip-btn"
              onClick={() => setShowFileInput((prev) => !prev)}
              title="Attach file"
            >
              <FiPaperclip size={20} />
            </button>
            <button className="send-btn" onClick={sendMessage}>
              &#9658;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
