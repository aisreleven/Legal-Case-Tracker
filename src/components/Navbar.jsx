import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  HelpCircle,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Shield,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Navbar = ({ onToggleSidebar, isSidebarCollapsed }) => {
  const {
    currentUser,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    theme,
    setTheme,
    logout,
    cases
  } = useApp();

  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global search filtering
  useEffect(() => {
    if (globalSearch.trim().length > 1) {
      const q = globalSearch.toLowerCase();
      const results = cases.filter(c =>
        c.caseNumber.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.clientName.toLowerCase().includes(q) ||
        c.assignedLawyer.toLowerCase().includes(q) ||
        c.courtName.toLowerCase().includes(q)
      ).slice(0, 5);
      setSearchResults(results);
      setIsSearching(true);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [globalSearch, cases]);

  // 6. Implement proper sign-out using supabase.auth.signOut().
  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[#E5EAF0] dark:border-slate-800 h-16 px-4 sm:px-6 flex items-center justify-between">
        {/* Left Side: Mobile toggle + Global Search */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global Search Bar */}
          <div ref={searchRef} className="relative flex-1 max-w-md hidden sm:block">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onFocus={() => globalSearch.trim().length > 1 && setIsSearching(true)}
                placeholder="Global search by docket, title, court, or client..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#142B4A]/20 focus:border-[#142B4A] transition-all"
              />
            </div>

            {/* Global Search Results Dropdown */}
            {isSearching && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-dropdown border border-[#E5EAF0] dark:border-slate-800 py-2 z-50 animate-fade-in">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  Case Docket Results ({searchResults.length})
                </div>
                {searchResults.length > 0 ? (
                  searchResults.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        navigate(`/cases/${item.id}`);
                        setIsSearching(false);
                        setGlobalSearch('');
                      }}
                      className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#142B4A] dark:text-gold">{item.caseNumber}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300">{item.category}</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-200 truncate max-w-xs">{item.title}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-slate-500 text-center">
                    No matching cases found for "{globalSearch}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Authenticated Role Indicator */}
          {currentUser?.role && (
            <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 gap-1.5 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400">Portal:</span>
              <span className="font-semibold text-[#142B4A] dark:text-[#C6A15B]">
                {currentUser.role}
              </span>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[#C6A15B]" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Help Button */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="System Architecture & Capstone Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Notifications Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Notifications Menu */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-dropdown border border-[#E5EAF0] dark:border-slate-800 py-3 z-50 animate-fade-in">
                <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#142B4A] dark:text-white">Notifications</span>
                    {unreadNotificationCount > 0 && (
                      <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unreadNotificationCount} new
                      </span>
                    )}
                  </div>
                  {unreadNotificationCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-xs text-[#C6A15B] hover:text-[#92732B] font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.slice(0, 5).map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        setShowNotifMenu(false);
                        if (n.link) navigate(n.link);
                      }}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                        !n.read ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-[#142B4A] dark:text-slate-100">{n.title}</p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.timestamp.split(' ')[0]}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 px-4 border-t border-slate-100 dark:border-slate-800 text-center">
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifMenu(false)}
                    className="text-xs font-semibold text-[#142B4A] dark:text-gold hover:underline inline-flex items-center gap-1"
                  >
                    View all notifications →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* User Profile Avatar Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <img
                src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
                alt={currentUser?.fullName || "User"}
                className="w-8 h-8 rounded-xl object-cover ring-2 ring-[#C6A15B]/30"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-[#142B4A] dark:text-white leading-tight">
                  {currentUser?.fullName || "Legal Officer"}
                </p>
                <p className="text-[10px] font-medium text-[#C6A15B] uppercase tracking-wider">
                  {currentUser?.role || "Admin"}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-dropdown border border-[#E5EAF0] dark:border-slate-800 py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-[#142B4A] dark:text-white">{currentUser?.fullName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser?.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Account Settings</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 py-1">
                  <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Current Role
                  </div>
                  <div className="px-4 py-1.5 text-xs text-[#142B4A] dark:text-[#C6A15B] font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C6A15B]" />
                    {currentUser?.role} Portal
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Capstone Project Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#142B4A]/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-[#E5EAF0] dark:border-slate-800 shadow-2xl">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 bg-[#C6A15B]/20 text-[#B08B42] rounded-xl">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#142B4A] dark:text-white">LegalTech SaaS Platform Guide</h3>
                <p className="text-xs text-slate-500">B.Tech CS Capstone Demonstration Overview</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <span className="font-bold text-[#142B4A] dark:text-gold block mb-1">Role-Based Demonstration</span>
                Switch instantly between <strong>Admin</strong>, <strong>Lawyer</strong>, and <strong>Client</strong> using the top bar pills or profile dropdown to examine distinct permissions and customized layouts.
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <span className="font-bold text-[#142B4A] dark:text-gold block mb-1">State & Data Persistence</span>
                All cases created, hearings scheduled/rescheduled, documents uploaded, and users modified are persisted in browser <strong>LocalStorage</strong> and reflected across dashboards and charts.
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <span className="font-bold text-[#142B4A] dark:text-gold block mb-1">Key Modules</span>
                Case Management CRUD, Hearing Calendar with Month/Week/Day views, Drag-and-drop Document Repository with live text/blob downloads, Recharts Analytics, and User Governance.
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-[#142B4A] text-white text-xs font-semibold rounded-xl hover:bg-[#24466B] transition-colors"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
