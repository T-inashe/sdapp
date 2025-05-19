import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditProject from '../components/EditProject';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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
  _id: '123',
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
  file: {
    data: 'base64-string',
    contentType: 'application/pdf',
    originalName: 'proposal.pdf',
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

    expect(screen.getByText(/Loading project data/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Edited Project')).toBeInTheDocument();
    });
  });

  test('loads form fields with project data including file link', async () => {
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
      expect(screen.getByText(/Download proposal.pdf/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Upload Project Image\/File/i)).toBeInTheDocument();
    });
  });

  test('toggles conditional fields based on checkbox input', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { ...sampleProject, funding_available: false, collaborators_needed: false } });

    render(
      <MemoryRouter initialEntries={['/projects/123/edit']}>
        <Routes>
          <Route path="/projects/:id/edit" element={<EditProject />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Funding Available/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/Funding Available/i));
    expect(screen.getByLabelText(/Funding Amount/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Seeking Collaborators/i));
    expect(screen.getByLabelText(/Collaborator Roles Needed/i)).toBeInTheDocument();
  });

  test('submits updated form and navigates on success', async () => {
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
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Final description' } });
    fireEvent.change(screen.getByLabelText(/Research Goals/i), { target: { value: 'Final goals' } });
    fireEvent.change(screen.getByLabelText(/Research Area/i), { target: { value: 'Machine Learning' } });
    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2025-01-01' } });
    fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: '2025-12-31' } });
    fireEvent.change(screen.getByLabelText(/Funding Amount/i), { target: { value: '15000' } });
    fireEvent.change(screen.getByLabelText(/Collaborator Roles Needed/i), { target: { value: 'Data Analyst' } });
    fireEvent.change(screen.getByLabelText(/Institution/i), { target: { value: 'Updated Uni' } });
    fireEvent.change(screen.getByLabelText(/Contact Email/i), { target: { value: 'updated@uni.edu' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/projects/123');
    });
  });

  test('displays error if update fails', async () => {
  mockedAxios.get.mockResolvedValueOnce({ data: sampleProject });

  mockedAxios.put.mockRejectedValueOnce({
    response: {
      data: {
        message: 'Update failed',
      },
    },
  });

  render(
    <MemoryRouter initialEntries={['/projects/123/edit']}>
      <Routes>
        <Route path="/projects/:id/edit" element={<EditProject />} />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByDisplayValue('Edited Project')).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

  await waitFor(() => {
    const alert = screen.getByTestId('update-error');
    expect(alert).toHaveTextContent(/update failed/i);
  }, { timeout: 3000 });
});

});
