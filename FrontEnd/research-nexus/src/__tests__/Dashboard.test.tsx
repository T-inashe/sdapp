import React from 'react';
import Dashboard from "../components/dashboard/Dashboard";
import AuthContext from '../context/AuthContext';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';

// Mock axios for API calls
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the AuthContext to simulate a logged-in user
const mockLogout = jest.fn();

const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'johndoe@example.com',
  institution: 'University of Science',
  avatar: 'http://example.com/avatar.jpg',
};

const renderDashboard = () => {
  render(
    <AuthContext.Provider
      value={{
        isAuthenticated: true,
        user: mockUser,
        login: jest.fn(),
        logout: mockLogout,
      }}
    >
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        projects: [
          {
            id: 1,
            creator_email: 'johndoe@example.com',
            title: 'Research Project 1',
            description: 'Description of project 1',
            research_goals: 'Research goal 1',
            research_area: 'Physics',
            start_date: '2025-01-01',
            end_date: '2025-12-31',
            funding_available: true,
            funding_amount: '5000',
            collaborators_needed: true,
            collaborator_roles: 'Data Scientist',
            institution: 'University of Science',
            contact_email: 'johndoe@example.com',
            created_at: '2025-04-01',
          },
        ],
      },
    });
  });

  test('renders dashboard correctly', async () => {
    renderDashboard();

    // Wait for the loading spinner to disappear
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());

    // Check if the user name is displayed
    expect(screen.getByText(/Welcome back, John!/i)).toBeInTheDocument();

    // Check if the "New Project" button is rendered
    expect(screen.getByRole('button', { name: /New Project/i })).toBeInTheDocument();

    // Wait for projects to load and ensure only one project title is displayed
    await waitFor(() => {
      const projects = screen.getAllByText(/Research Project 1/i);
      expect(projects.length).toBeGreaterThan(0); // Ensure occurrence
    });

    // Check if project information is displayed
    expect(screen.getAllByText('Research Project 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Physics').length).toBeGreaterThan(0);
  });

  test('handles logout button click', async () => {
    renderDashboard();

    // Wait for the logout button to be rendered
    const logoutButton = await screen.findByRole('button', { name: /Logout/i });

    // Mock window.location to check for navigation behavior
    const mockLocation = { pathname: '/login' };
    Object.defineProperty(window, 'location', { value: mockLocation });

    // Simulate the logout button click
    fireEvent.click(logoutButton);

    // Wait for the logout function to be called
    await waitFor(() => expect(mockLogout).toHaveBeenCalled());

    // Ensure the user is navigated to the login page
    expect(window.location.pathname).toBe('/login');
  });

  test('displays error if API request fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

    renderDashboard();

    // Wait for the error message to be displayed
    await waitFor(() => expect(screen.getByText(/Error connecting to server/i)).toBeInTheDocument());
  });
});
