import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

// Layouts
import MainLayout from './layouts/MainLayout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Dashboard Pages
import AdminDashboard from './pages/AdminDashboard';
import LawyerDashboard from './pages/LawyerDashboard';
import ClientDashboard from './pages/ClientDashboard';

// Module Pages
import Cases from './pages/Cases';
import AddCase from './pages/AddCase';
import CaseDetails from './pages/CaseDetails';
import EditCase from './pages/EditCase';
import Hearings from './pages/Hearings';
import HearingCalendar from './pages/HearingCalendar';
import Documents from './pages/Documents';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Dynamic Index Redirector based on verified session role
const HomeRedirect = () => {
  const { currentUser, authLoading } = useApp();
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-[#142B4A]/20 border-t-[#142B4A] dark:border-[#C6A15B]/20 dark:border-t-[#C6A15B] rounded-full animate-spin mb-3"></div>
      </div>
    );
  }
  if (!currentUser) return <Navigate to="/login" replace />;
  const role = currentUser.role?.toLowerCase();
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'lawyer') return <Navigate to="/lawyer" replace />;
  return <Navigate to="/client" replace />;
};

// 8. Protect all dashboard routes using an authentication guard.
const AuthGuard = ({ allowedRoles = [] }) => {
  const { currentUser, authLoading } = useApp();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-[#142B4A]/20 border-t-[#142B4A] dark:border-[#C6A15B]/20 dark:border-t-[#C6A15B] rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Authenticating Judicial Session...
        </p>
      </div>
    );
  }

  // Reject access if user is not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Restrict by role if allowedRoles is specified
  if (allowedRoles.length > 0) {
    const userRole = (currentUser.role || '').toLowerCase();
    const isAllowed = allowedRoles.some(r => r.toLowerCase() === userRole);
    if (!isAllowed) {
      if (userRole === 'admin') return <Navigate to="/admin" replace />;
      if (userRole === 'lawyer') return <Navigate to="/lawyer" replace />;
      return <Navigate to="/client" replace />;
    }
  }

  return <Outlet />;
};

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Root Redirect */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Protected Main Application Routes - Guarded */}
          <Route element={<AuthGuard />}>
            <Route element={<MainLayout />}>
              {/* Dashboards with role guards */}
              <Route element={<AuthGuard allowedRoles={['Admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>

              <Route element={<AuthGuard allowedRoles={['Lawyer', 'Admin']} />}>
                <Route path="/lawyer" element={<LawyerDashboard />} />
              </Route>

              <Route element={<AuthGuard allowedRoles={['Client', 'Admin']} />}>
                <Route path="/client" element={<ClientDashboard />} />
              </Route>

              {/* Case Management */}
              <Route path="/cases" element={<Cases />} />
              <Route path="/cases/new" element={<AddCase />} />
              <Route path="/cases/:id" element={<CaseDetails />} />
              <Route path="/cases/edit/:id" element={<EditCase />} />

              {/* Hearing Management */}
              <Route path="/calendar" element={<HearingCalendar />} />
              <Route path="/hearings" element={<Hearings />} />

              {/* Document Management */}
              <Route path="/documents" element={<Documents />} />

              {/* Notifications */}
              <Route path="/notifications" element={<Notifications />} />

              {/* Reports & Analytics */}
              <Route path="/reports" element={<Reports />} />

              {/* User Management (Admin only) */}
              <Route element={<AuthGuard allowedRoles={['Admin']} />}>
                <Route path="/users" element={<UserManagement />} />
              </Route>

              {/* Profile & Settings */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
