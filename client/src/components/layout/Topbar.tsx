import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Bell,
  LogOut,
  CheckCheck,
  Camera,
  Mail,
  KeyRound,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../app/providers';
import { api } from '../../lib/api';
import { Notification } from '../../types';
import { ProfileModal, ProfileTab } from './ProfileModal';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
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

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch (err) { }
  };

  const openProfileTab = (tab: ProfileTab) => {
    setProfileModalTab(tab);
    setIsProfileModalOpen(true);
    setShowUserDropdown(false);
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
