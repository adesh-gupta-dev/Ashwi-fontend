import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import About from './pages/About';
import ChatDashboard from './pages/ChatDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import DashboardOverview from './pages/admin/DashboardOverview';
import UserManagement from './pages/admin/UserManagement';
import ChatMonitoring from './pages/admin/ChatMonitoring';
import SystemLogs from './pages/admin/SystemLogs';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/chat" replace />;
  }

  return children;
};

const App = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-on-background)] transition-colors duration-300 selection:bg-[var(--color-primary-container)] selection:text-[var(--color-on-primary-container)]">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/about" element={<About />} />

                {/* Protected Client Route */}
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <ChatDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat/history"
                  element={
                    <ProtectedRoute>
                      <ChatDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardOverview />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="chats" element={<ChatMonitoring />} />
                  <Route path="logs" element={<SystemLogs />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/chat" replace />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
