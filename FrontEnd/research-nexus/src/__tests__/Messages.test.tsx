import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import axios from 'axios';
import Messages from '../pages/Messages'; // Adjust path as needed
import AuthContext from '../context/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import React from 'react'; // Only needed for type use or JSX in some versions

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockUser = {
  id: 'user1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'Student',
  institution: 'Test University',
  avatar: 'avatar.png',
};

const mockAuthContext = {
  isAuthenticated: true,
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
};

const mockInvites = [
  {
    _id: 'msg1',
    sender: { _id: 's1', fname: 'Alice', lname: 'Smith', role: 'Professor' },
    receiver: { _id: 'user1', fname: 'John', lname: 'Doe', role: 'Student' },
    projectId: 'p1',
    content: 'Join my project!',
    delivered: true,
    read: false,
  }
];

const mockProject = {
  _id: 'p1',
  title: 'AI Research',
  funding_amount: 50000,
  creator: { role: 'Professor' },
  status: 'Pending',
};

const renderComponent = () =>
  render(
    <AuthContext.Provider value={mockAuthContext}>
      <MemoryRouter>
        <Messages />
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('Messages Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays loading spinner initially', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });

    renderComponent();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('displays "No messages yet" if no invites are found', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/No messages yet/i)).toBeInTheDocument();
    });
  });

  test('renders invite message card with content', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: mockInvites })       // fetchInvites
      .mockResolvedValueOnce({ data: mockInvites })       // fetchUserInvites
      .mockResolvedValueOnce({ data: mockProject });      // fetchProjectDetails
  
    renderComponent();
  
    await waitFor(() => {
        expect(screen.getByText(/Untitled Project/i)).toBeInTheDocument(); // fallback title
        expect(screen.getByText(/Join my project!/i)).toBeInTheDocument();
        expect(screen.getByText(/Funding:\$No funding/i)).toBeInTheDocument();
    });
  });
  
  test('allows accepting an invite', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: mockInvites }) // fetchInvites
      .mockResolvedValueOnce({ data: mockInvites }) // fetchUserInvites
      .mockResolvedValueOnce({ data: mockProject }); // fetchProjectDetails

    mockedAxios.put.mockResolvedValueOnce({});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Accept'));

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalled();
    });
  });

  test('allows declining an invite', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: mockInvites }) // fetchInvites
      .mockResolvedValueOnce({ data: mockInvites }) // fetchUserInvites
      .mockResolvedValueOnce({ data: mockProject }); // fetchProjectDetails

    mockedAxios.delete.mockResolvedValueOnce({});
    mockedAxios.post.mockResolvedValueOnce({});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Decline')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Decline'));

    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalled();
      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });
});
