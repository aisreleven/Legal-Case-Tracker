import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  Calendar,
  Clock,
  FileText,
  Bell,
  BarChart3,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Scale,
  Shield,
  UserCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Sidebar = ({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) => {
  const { currentUser, logout, unreadNotificationCount } = useApp();
  const navigate = useNavigate();

  const role = currentUser?.role?.toLowerCase() || 'admin';

  // Navigation items tailored per role
  const getNavItems = () => {
    if (role === 'client') {
      return [
        { label: 'Client Portal', path: '/client', icon: LayoutDashboard },
        { label: 'My Legal Cases', path: '/cases', icon: Briefcase },
        { label: 'Hearing Schedule', path: '/hearings', icon: Clock },
        { label: 'Shared Documents', path: '/documents', icon: FileText },
        { label: 'Notifications', path: '/notifications', icon: Bell, badge: unreadNotificationCount },
        { label: 'Profile & Settings', path: '/settings', icon: Settings },
      ];
    }

    if (role === 'lawyer') {
      return [
        { label: 'Lawyer Dashboard', path: '/lawyer', icon: LayoutDashboard },
        { label: 'My Assigned Cases', path: '/cases', icon: Briefcase },
        { label: 'Add New Case', path: '/cases/new', icon: PlusCircle },
        { label: 'Hearing Calendar', path: '/calendar', icon: Calendar },
        { label: 'Upcoming Hearings', path: '/hearings', icon: Clock },
        { label: 'Legal Documents', path: '/documents', icon: FileText },
        { label: 'Notifications', path: '/notifications', icon: Bell, badge: unreadNotificationCount },
        { label: 'Analytics & Reports', path: '/reports', icon: BarChart3 },
        { label: 'Settings', path: '/settings', icon: Settings },
      ];
    }

    // Default: Admin
    return [
      { label: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
      { label: 'All Cases', path: '/cases', icon: Briefcase },
      { label: 'Add New Case', path: '/cases/new', icon: PlusCircle },
      { label: 'Hearing Calendar', path: '/calendar', icon: Calendar },
      { label: 'Hearings Management', path: '/hearings', icon: Clock },
      { label: 'Document Repository', path: '/documents', icon: FileText },
      { label: 'Notifications', path: '/notifications', icon: Bell, badge: unreadNotificationCount },
      { label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
      { label: 'User Management', path: '/users', icon: Users },
      { label: 'System Settings', path: '/settings', icon: Settings },
    ];
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#142B4A]/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#142B4A] text-white transition-all duration-300 ease-in-out border-r border-[#1D3B63] select-none ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand / Logo Area */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#1D3B63]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C6A15B] to-[#92732B] flex items-center justify-center shadow-md flex-shrink-0">
              <Scale className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-base tracking-tight text-white leading-tight">
                  Juris<span className="text-[#C6A15B]">Track</span>
                </span>
                <span className="text-[10px] text-slate-300 tracking-wider uppercase font-semibold">
                  LegalTech SaaS
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-[#24466B] transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Role Badge Banner */}
        <div className={`px-4 py-2.5 bg-[#0F1E33]/70 border-b border-[#1D3B63] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {currentUser?.role || 'Admin'} Workspace
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </>
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-[#C6A15B]" title={`${currentUser?.role} Mode`} />
          )}
        </div>

        {/* Navigation Items (Scrollable independently) */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin' || item.path === '/lawyer' || item.path === '/client'}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-[#C6A15B] to-[#B08B42] text-white shadow-md font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-[#24466B]/60'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                
                {item.badge > 0 && !isCollapsed && (
                  <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </span>
                )}
                {item.badge > 0 && isCollapsed && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-[#1D3B63] space-y-1">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-rose-300 hover:text-white hover:bg-rose-950/40 transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="Sign Out of Session"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
