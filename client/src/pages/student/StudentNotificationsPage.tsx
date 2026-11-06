import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Clock, ExternalLink, Wallet, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Notification } from '../../types';
import { useAuth } from '../../app/providers';

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

export const StudentNotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = () => {
    setLoading(true);
    api.getNotifications()
      .then(setNotifications)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch (err) {}
  };

  const displayNotifications = user?.role === 'admin'
    ? notifications.filter(n => ADMIN_ALLOWED_TYPES.includes(n.type))
    : user?.role === 'teacher'
    ? notifications.filter(n => TEACHER_ALLOWED_TYPES.includes(n.type))
    : notifications;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {user?.role === 'admin'
              ? 'Admin Action & Notification Center'
              : user?.role === 'teacher'
              ? 'Faculty Notification & Submission Center'
              : 'Notification Center'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {user?.role === 'admin'
              ? 'Faculty salary requests, student payments, and institutional clearances'
              : user?.role === 'teacher'
              ? 'Student submission alerts, compensation disbursements, and instructional notices'
              : 'Announcements, evaluations, and course reminders'}
          </p>
        </div>

        {displayNotifications.some(n => !n.read_at) && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-xl border border-brand-200 transition flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {displayNotifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            {user?.role === 'admin'
              ? 'No pending administrative notifications on record.'
              : user?.role === 'teacher'
              ? 'No faculty alerts or submission notifications on record.'
              : 'No notifications on record.'}
          </div>
        ) : (
          displayNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition ${
                !n.read_at ? 'bg-brand-50/20' : 'hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {user?.role === 'admin' && (
                  <div className="mt-0.5">
                    {n.type === 'salary_request' || n.type === 'salary_disbursed' ? (
                      <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                        <Wallet className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                    {!n.read_at && (
                      <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                    {n.link && (
                      <Link to={n.link} className="text-brand-600 hover:underline flex items-center gap-1 font-semibold">
                        Open <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {!n.read_at && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 whitespace-nowrap"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
