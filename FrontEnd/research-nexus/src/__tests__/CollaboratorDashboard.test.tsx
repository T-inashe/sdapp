import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CollaboratorDashboard from '../components/dashboard/CollaboratorDashboard';

test('renders CollaboratorDashboard without crashing', () => {
  render(
    <MemoryRouter>
      <CollaboratorDashboard />
    </MemoryRouter>
  );
});
