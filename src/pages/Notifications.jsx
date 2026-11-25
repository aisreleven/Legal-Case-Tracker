import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Trash2,
  Clock,
  Briefcase,
  FileText,
  AlertCircle,
  ExternalLink,
  CheckCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Notifications = () => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    unreadNotificationCount
  } = useApp();
  const navigate = useNavigate();

  const [filterType, setFilterType] = useState('all'); // 'all', 'unread', 'hearing', 'case', 'document'

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filterType === 'unread') return !n.read;
      if (filterType === 'hearing') return n.type === 'hearing';
      if (filterType === 'case') return n.type === 'case';
      if (filterType === 'document') return n.type === 'document';
      return true;
    });
  }, [notifications, filterType]);

  const getIcon = (type) => {
    switch (type) {
      case 'hearing':
        return <Clock className="w-4 h-4 text-[#C6A15B]" />;
      case 'document':
        return <FileText className="w-4 h-4 text-sky-500" />;
      case 'case':
        return <Briefcase className="w-4 h-4 text-[#142B4A] dark:text-gold" />;
      default:
        return <Bell className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#142B4A] dark:text-white">
              Notifications & Case Alerts
            </h1>
            {unreadNotificationCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 text-xs font-bold">
                {unreadNotificationCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time court hearing reminders, file submissions, and milestone status notices
          </p>
        </div>

        {unreadNotificationCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-[#C6A15B]" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { label: 'All Alerts', val: 'all' },
          { label: `Unread (${unreadNotificationCount})`, val: 'unread' },
          { label: 'Hearing Reminders', val: 'hearing' },
          { label: 'Case Status Changes', val: 'case' },
          { label: 'Document Uploads', val: 'document' },
        ].map(item => (
          <button
            key={item.val}
            onClick={() => setFilterType(item.val)}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all ${
              filterType === item.val
                ? 'bg-[#142B4A] text-white shadow-sm font-semibold'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(n => (
            <div
              key={n.id}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors ${
                !n.read ? 'bg-amber-50/20 dark:bg-amber-950/15' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-2xl flex-shrink-0 mt-0.5 ${
                  !n.read ? 'bg-[#C6A15B]/20 ring-2 ring-[#C6A15B]/30' : 'bg-slate-100 dark:bg-slate-800'
                }`}>
                  {getIcon(n.type)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#142B4A] dark:text-white">
                      {n.title}
                    </h3>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-2 block font-medium">
                    {n.timestamp}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                {n.link && (
                  <button
                    onClick={() => {
                      markNotificationRead(n.id);
                      navigate(n.link);
                    }}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-[#142B4A] hover:text-white rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}

                {!n.read && (
                  <button
                    onClick={() => markNotificationRead(n.id)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Mark as read"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => deleteNotification(n.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Delete alert"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">No notifications match this filter.</p>
            <p className="text-xs text-slate-400 mt-1">You are all caught up with your judicial notices.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
