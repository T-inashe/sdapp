import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditProject from '../components/EditProject';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '123' }),
}));

const sampleProject = {
  success: true,
  project: {
    title: 'Edited Project',
    description: 'Updated description',
    research_goals: 'Updated goals',
    research_area: 'Machine Learning',
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    funding_available: true,
    funding_amount: '10000',
    collaborators_needed: true,
    collaborator_roles: 'ML Engineer',
    institution: 'Tech Uni',
    contact_email: 'edit@tech.edu',
  },
};

describe('EditProject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays loading spinner initially', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: sampleProject });

    render(
      <MemoryRouter initialEntries={['/projects/123/edit']}>
        <Routes>
          <Route path="/projects/:id/edit" element={<EditProject />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading project data.../i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByDisplayValue(/Edited Project/i)).toBeInTheDocument();
    });
  });

  test('loads form fields with project data', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: sampleProject });

    render(
      <MemoryRouter initialEntries={['/projects/123/edit']}>
        <Routes>
          <Route path="/projects/:id/edit" element={<EditProject />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Edited Project')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Updated description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Updated goals')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('ML Engineer')).toBeInTheDocument();
      expect(screen.getByDisplayValue('edit@tech.edu')).toBeInTheDocument();
    });
  });

  test('submits updated form and navigates', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: sampleProject });
    mockedAxios.put.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter initialEntries={['/projects/123/edit']}>
        <Routes>
          <Route path="/projects/:id/edit" element={<EditProject />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByDisplayValue('Edited Project'));

    fireEvent.change(screen.getByLabelText(/Project Title/i), { target: { value: 'Final Project Title' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/projects/123');
    });
  });

  test('displays error if project update fails', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: sampleProject });
    mockedAxios.put.mockResolvedValueOnce({ data: { success: false, message: 'Update failed' } });

    render(
      <MemoryRouter initialEntries={['/projects/123/edit']}>
        <Routes>
          <Route path="/projects/:id/edit" element={<EditProject />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByDisplayValue('Edited Project'));

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/Update failed/i)).toBeInTheDocument();
    });
  });
});
