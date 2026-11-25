import React, { useState } from 'react';
import { Outlet, useLocation, Link, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useApp } from '../context/AppContext';
import { ChevronRight, Home, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const MainLayout = ({ allowedRoles = [] }) => {
  const { currentUser, authLoading, toast } = useApp();
  const location = useLocation();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // If session is still resolving, show loader
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

  // If user is not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check role authorization if allowedRoles are specified
  if (allowedRoles.length > 0) {
    const userRole = (currentUser.role || '').toLowerCase();
    const isAllowed = allowedRoles.some(r => r.toLowerCase() === userRole);
    if (!isAllowed) {
      if (userRole === 'admin') return <Navigate to="/admin" replace />;
      if (userRole === 'lawyer') return <Navigate to="/lawyer" replace />;
      return <Navigate to="/client" replace />;
    }
  }

  // Generate breadcrumbs from location path
  const pathnames = location.pathname.split('/').filter(x => x);

  const getBreadcrumbName = (path) => {
    const map = {
      admin: 'Admin Dashboard',
      lawyer: 'Lawyer Dashboard',
      client: 'Client Portal',
      cases: 'Case Management',
      new: 'Register New Case',
      calendar: 'Hearing Calendar',
      hearings: 'Hearing Schedule',
      documents: 'Document Repository',
      notifications: 'Notifications',
      reports: 'Reports & Analytics',
      users: 'User Management',
      profile: 'User Profile',
      settings: 'Settings',
    };
    return map[path] || (path.startsWith('case-') ? `Case #${path}` : path);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-slate-950 flex flex-col antialiased">
      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce duration-1000 max-w-sm">
          <div className={`p-4 rounded-xl shadow-xl border flex items-center gap-3 ${
            toast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950 border-rose-200 text-rose-800 dark:text-rose-200'
              : toast.type === 'info'
              ? 'bg-sky-50 dark:bg-sky-950 border-sky-200 text-sky-800 dark:text-sky-200'
              : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 text-emerald-800 dark:text-emerald-200'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            ) : toast.type === 'info' ? (
              <Info className="w-5 h-5 flex-shrink-0 text-sky-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
            )}
            <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Fixed Sidebar */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        setIsOpen={setIsMobileSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Container with Independent Scrolling */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Sticky Navbar */}
        <Navbar
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Breadcrumbs Navigation */}
          {pathnames.length > 0 && (
            <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-5 overflow-x-auto whitespace-nowrap">
              <Link
                to={currentUser.role === 'Admin' ? '/admin' : currentUser.role === 'Lawyer' ? '/lawyer' : '/client'}
                className="hover:text-[#142B4A] dark:hover:text-gold flex items-center gap-1 transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </Link>
              {pathnames.map((name, index) => {
                const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                return (
                  <React.Fragment key={routeTo}>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {isLast ? (
                      <span className="font-semibold text-[#142B4A] dark:text-slate-200 capitalize">
                        {getBreadcrumbName(name)}
                      </span>
                    ) : (
                      <Link
                        to={routeTo}
                        className="hover:text-[#142B4A] dark:hover:text-gold transition-colors capitalize"
                      >
                        {getBreadcrumbName(name)}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          )}

          {/* Dynamic Page Outlet */}
          <Outlet />
        </main>

        {/* Professional Minimalist Footer */}
        <footer className="mt-auto py-4 px-6 border-t border-[#E5EAF0] dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 JurisTrack LegalTech Management System. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Security Compliant (256-bit AES)</span>
            <span>•</span>
            <span>B.Tech CS Capstone Edition</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
