import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import CheckInPage from './pages/CheckInPage';
import StaffCheckInPage from './pages/StaffCheckInPage';
import AthleteManagementPage from './pages/AthleteManagementPage';
import EventManagementPage from './pages/EventManagementPage';
import LoginPage from './pages/LoginPage';
import AdminPanel from './pages/AdminPanel';
import ErrorBoundary from './components/ErrorBoundary';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-nova-purple"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-nova-purple"></div>
      </div>
    );
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-black">
          <AuthProvider>
            <Routes>
              {/* Public check-in route */}
              <Route path="/checkin" element={<CheckInPage />} />
              
              {/* Login route */}
              <Route path="/login" element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="dashboard" element={<Navigate to="/admin" />} />
                <Route path="staff-checkin" element={<StaffCheckInPage />} />
                <Route path="athletes" element={<AthleteManagementPage />} />
                <Route path="events" element={<EventManagementPage />} />
                <Route path="admin" element={<AdminPanel />} />
              </Route>
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </AuthProvider>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
