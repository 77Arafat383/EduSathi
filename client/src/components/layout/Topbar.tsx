import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  LogOut,
  CheckCheck,
  Camera,
  Mail,
  KeyRound,
  ChevronRight,
  Wallet,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../app/providers';
import { api } from '../../lib/api';
import { Notification } from '../../types';
import { ProfileModal, ProfileTab } from './ProfileModal';

interface TopbarProps {
  onToggleSidebar: () => void;
}

const ADMIN_ALLOWED_TYPES = [
  'salary_request',
  'new_payment',
  'payment_received',
  'student_payment',
  'salary_disbursed',
  'admin_alert',
  'system_alert'
];

const TEACHER_ALLOWED_TYPES = [
  'submission',
  'assignment_submitted',
  'salary_disbursed',
  'salary_request',
  'comment',
  'doubt',
  'teacher_alert',
  'faculty_alert',
  'system_alert',
  'enrollment'
];

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Profile management modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<ProfileTab>('photo');

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then(data => setNotifications(data || []))
        .catch(() => { });
    }
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter notifications by role:
  // - Admin: financial clearances, student payments, salary disbursement vouchers, system alerts
  // - Teacher: student submissions, salary disbursements, discussions, instructional circulars
  // - Others: general notifications
  const displayNotifications = user?.role === 'admin'
    ? notifications.filter(n => ADMIN_ALLOWED_TYPES.includes(n.type))
    : user?.role === 'teacher'
    ? notifications.filter(n => TEACHER_ALLOWED_TYPES.includes(n.type))
    : notifications;

  const unreadCount = displayNotifications.filter(n => !n.read_at).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch (err) { }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read_at) {
      try {
        await api.markNotificationRead(n.id);
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read_at: new Date().toISOString() } : item));
      } catch (err) { }
    }
    setShowNotifDropdown(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  const openProfileTab = (tab: ProfileTab) => {
    setProfileModalTab(tab);
    setIsProfileModalOpen(true);
    setShowUserDropdown(false);
  };

  const renderNotifIcon = (type: string) => {
    if (type === 'salary_request' || type === 'salary_disbursed') {
      return (
        <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
          <Wallet className="w-3.5 h-3.5" />
        </div>
      );
    }
    if (type === 'new_payment' || type === 'payment_received' || type === 'student_payment') {
      return (
        <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
          <CreditCard className="w-3.5 h-3.5" />
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center shrink-0">
        <Bell className="w-3.5 h-3.5" />
      </div>
    );
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
            Welcome back, <span className="text-brand-600">{user?.full_name}</span>
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notification Bell */}
        <div className="relative" ref={notifDropdownRef}>
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
                  <span className="text-xs font-bold text-slate-800">
                    {user?.role === 'admin' ? 'Admin Action Alerts' : 'Notifications'}
                  </span>
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
                {displayNotifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    {user?.role === 'admin'
                      ? 'No pending administrative alerts'
                      : user?.role === 'teacher'
                      ? 'No faculty alerts or submission notifications'
                      : 'No notifications yet'}
                  </div>
                ) : (
                  displayNotifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full p-3 sm:px-4 hover:bg-slate-50 transition text-left flex items-start gap-3 cursor-pointer ${
                        !n.read_at ? 'bg-brand-50/20' : ''
                      }`}
                    >
                      {renderNotifIcon(n.type)}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-xs ${!n.read_at ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'} truncate`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Quick Navigation Footer */}
              <div className="pt-2.5 px-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
                {user?.role === 'admin' ? (
                  <>
                    <Link
                      to="/admin/salaries"
                      onClick={() => setShowNotifDropdown(false)}
                      className="text-amber-700 hover:text-amber-800 flex items-center gap-1 font-bold"
                    >
                      <span>Faculty Salaries</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to="/admin/student-payments"
                      onClick={() => setShowNotifDropdown(false)}
                      className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-bold"
                    >
                      <span>Student Payments</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </>
                ) : (
                  <Link
                    to={`/${user?.role}/notifications`}
                    onClick={() => setShowNotifDropdown(false)}
                    className="text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    <span>View Notification Center</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User circular avatar & dropdown */}
        <div className="relative" ref={userDropdownRef}>
          {/* ONLY profile image is shown on topbar */}
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-brand-500 hover:ring-offset-2 transition-all focus:outline-none"
            title={`${user?.full_name || 'Account'} (${user?.role})`}
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user?.full_name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200/90 shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white font-bold text-xs ring-2 ring-brand-200 shadow-sm flex items-center justify-center">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
            )}
          </button>

          {/* Dropdown Menu */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-fade-in divide-y divide-slate-100">
              {/* Profile Card Header */}
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="relative group shrink-0">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user?.full_name}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-200"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-brand-50 text-brand-700 font-extrabold text-sm ring-2 ring-brand-200 flex items-center justify-center">
                      {user?.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <button
                    onClick={() => openProfileTab('photo')}
                    className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition"
                    title="Change Photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.full_name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {user?.email}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md bg-brand-50 text-brand-700 border border-brand-200">
                    {user?.role}
                  </span>
                </div>
              </div>

              {/* Management Options */}
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => openProfileTab('photo')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <span>Account Settings</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                </button>
              </div>

              {/* Sign Out */}
              <div className="p-1.5">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <LogOut className="w-3.5 h-3.5" />
                  </div>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Settings Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        initialTab={profileModalTab}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </header>
  );
};
