import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './context/AuthProvider';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import ResearchCollabLanding from './pages/ResearchBridgeLanding';
import './App.css';
import CreateProject from './components/CreateProject';
import UserProjects from './components/UserProjects';
import EditProject from './components/EditProject';
import ProjectDetail from './components/ProjectDetails';
import AuthSuccess from './components/auth/AuthSuccess';

// Protected route component (dev-mode override)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = true; // 👈 Force auth for local dev

  if (!isAuthenticated) {
    return <Navigate to="/ResearchCollabLanding" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<ResearchCollabLanding />} />
          <Route path="/auth-success" element={<AuthSuccess />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/projects/create" element={<CreateProject />} />
          <Route path="/projects" element={<UserProjects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/:id/edit" element={<EditProject />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
