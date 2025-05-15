import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './context/AuthProvider';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import AuthContext from './context/AuthContext';
import NotificationsPage from './pages/NotificationsPage';
import ChatPage from './pages/Chat';
import MessagesPage from './pages/Messages';
import Collaborators from './components/Collaborators';
import ResearchCollabLanding from './pages/ResearchCollabLanding';
import './App.css';
import CreateProject from './components/CreateProject';
import UserProjects from './components/UserProjects';
import EditProject from './components/EditProject';
import Signup from './components/auth/SignUp';
import ProjectDetail from './components/ProjectDetails';
import CollaboratorDashboard from './components/dashboard/CollaboratorDashboard';
import ReviewerDashboard from './components/dashboard/ReviewerDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useContext(AuthContext);
  
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
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/register" element={<Register />} />
          <Route path="/collaboratordashboard" element={<CollaboratorDashboard />} />
          <Route path="/admindashboard" element={<AdminDashboard />} />
          <Route path="/reviewerdashboard" element={<ReviewerDashboard />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/Collaborators/:id" element={<Collaborators />} />
          <Route path="/chat/:id" element={<ChatPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/projects/create" element={<CreateProject />} />
          <Route path="/projects" element={<UserProjects />} />
          {/* Routes for viewing and editing specific projects */}
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/:id/edit" element={<EditProject />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

        {/* Routes for viewing and editing specific projects */}
        {/* <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/projects/:id/edit" element={<EditProject />} /> */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;