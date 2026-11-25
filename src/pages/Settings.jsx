import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Bell,
  Moon,
  Sun,
  Lock,
  Shield,
  LogOut,
  Save,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Settings = () => {
  const { theme, setTheme, currentUser, logout, showToast } = useApp();
  const navigate = useNavigate();

  // Notification toggles
  const [notifPrefs, setNotifPrefs] = useState({
    hearingReminders: true,
    documentUploads: true,
    caseStatusChanges: true,
    dailyDigest: false,
    smsAlerts: true
  });

  // Password fields
  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirmPass: ''
  });
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState('');

  const handleToggle = (key) => {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    showToast("Notification preferences updated.");
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess(false);

    if (!passwords.current) {
      setPassError('Please enter your current password.');
      return;
    }
    if (passwords.newPass.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }
    if (passwords.newPass !== passwords.confirmPass) {
      setPassError('New passwords do not match.');
      return;
    }

    setPassSuccess(true);
    setPasswords({ current: '', newPass: '', confirmPass: '' });
    showToast("Password updated successfully.");
    setTimeout(() => setPassSuccess(false), 3500);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#142B4A] dark:text-white">
          Application & Account Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure notifications, judicial interface preferences, and authentication security
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme Preferences */}
        <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="p-2.5 bg-[#142B4A]/10 text-[#142B4A] dark:bg-sky-950 dark:text-gold rounded-xl">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">Theme & Display Mode</h2>
              <p className="text-xs text-slate-500">Toggle between Light and Dark interface modes</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                theme === 'light'
                  ? 'border-[#142B4A] bg-[#142B4A]/5 ring-2 ring-[#142B4A]/20 font-bold'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Light Mode</p>
                  <p className="text-[10px] text-slate-400">Clean SaaS palette</p>
                </div>
              </div>
              {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-[#142B4A]" />}
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                theme === 'dark'
                  ? 'border-[#C6A15B] bg-[#C6A15B]/10 ring-2 ring-[#C6A15B]/20 font-bold'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-[#C6A15B]" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Dark Mode</p>
                  <p className="text-[10px] text-slate-400">Low-glare night work</p>
                </div>
              </div>
              {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-[#C6A15B]" />}
            </button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="p-2.5 bg-[#C6A15B]/20 text-[#B08B42] rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">Hearing & Case Alerts</h2>
              <p className="text-xs text-slate-500">Configure which judicial events notify your device</p>
            </div>
          </div>

          <div className="space-y-3 max-w-xl text-xs">
            {[
              { key: 'hearingReminders', title: 'Upcoming Hearing Reminders', desc: 'Alerts 24 hours and 2 hours prior to scheduled cause list call' },
              { key: 'caseStatusChanges', title: 'Case Milestone & Status Updates', desc: 'When cases move between registration, evidence, or decree' },
              { key: 'documentUploads', title: 'Document & Evidence Filings', desc: 'Notice when adversary or counsel submits verified records' },
              { key: 'smsAlerts', title: 'SMS Urgency Dispatch', desc: 'Mobile message for emergency stays and order pronouncements' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{item.title}</p>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs[item.key]}
                  onChange={() => handleToggle(item.key)}
                  className="rounded text-[#142B4A] focus:ring-[#142B4A] w-4 h-4"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Change Password UI */}
        <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="p-2.5 bg-[#142B4A]/10 text-[#142B4A] dark:bg-sky-950 dark:text-gold rounded-xl">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">Security & Password</h2>
              <p className="text-xs text-slate-500">Update your access credential token</p>
            </div>
          </div>

          {passSuccess && (
            <div className="p-3.5 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs">
              Password successfully changed!
            </div>
          )}

          {passError && (
            <div className="p-3.5 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs">
              {passError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md text-xs">
            <div>
              <label className="block font-semibold mb-1">Current Password</label>
              <input
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                placeholder="••••••••"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">New Password</label>
              <input
                type="password"
                value={passwords.newPass}
                onChange={(e) => setPasswords(prev => ({ ...prev, newPass: e.target.value }))}
                placeholder="Min 6 characters"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirmPass}
                onChange={(e) => setPasswords(prev => ({ ...prev, confirmPass: e.target.value }))}
                placeholder="Repeat new password"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                required
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#142B4A] hover:bg-[#24466B] text-white rounded-xl font-bold uppercase tracking-wider transition-all"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Account Termination & Session Termination */}
        <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950/50 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Active Session</h3>
            <p className="text-xs text-slate-500">
              Signed in as {currentUser?.fullName} ({currentUser?.role}) • ID: {currentUser?.id}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white border border-rose-200 text-rose-600 dark:text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
