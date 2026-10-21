import React, { useState, useEffect } from 'react';
import { Menu, Bell, LogOut, ChevronDown, CheckCheck, Sparkles, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../app/providers';
import { api } from '../../lib/api';
import { Notification } from '../../types';
import { Link } from 'react-router-dom';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, switchDemoUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then(data => setNotifications(data || []))
        .catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch (err) {}
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <h2 className="text-sm font-bold text-slate-800">
            Welcome back, <span className="text-brand-600">{user?.full_name?.split(' ')[0]}</span> 👋
          </h2>
          <p className="text-[11px] text-slate-400 capitalize">
            Active Workspace: {user?.department || 'Academic Portal'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Fast Role Switcher for Academic Demonstration Review */}
        <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Demo Switcher:</span>
          <button
            onClick={() => switchDemoUser('student')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              user?.role === 'student' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student
          </button>
          <button
            onClick={() => switchDemoUser('teacher')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              user?.role === 'teacher' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Teacher
          </button>
          <button
            onClick={() => switchDemoUser('admin')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              user?.role === 'admin' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl relative transition"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-3 z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 hover:bg-slate-50 transition text-left ${!n.read_at ? 'bg-brand-50/30' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-800">{n.title}</p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(n.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-snug">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar & dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition"
          >
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.full_name}
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
            />
            <div className="hidden sm:block text-left pr-1">
              <span className="block text-xs font-bold text-slate-800 leading-tight">
                {user?.full_name}
              </span>
              <span className="block text-[10px] text-brand-600 font-bold uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.full_name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>

              <div className="p-1">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
