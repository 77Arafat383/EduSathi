import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  CalendarCheck2,
  TrendingUp,
  Bot,
  Bell,
  Users,
  FolderTree,
  FileCheck2,
  GraduationCap,
  Sparkles,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../app/providers';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  to: string;
  icon: any;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'student';

  const studentLinks: NavItem[] = [
    { label: 'Overview', to: '/student', icon: LayoutDashboard },
    { label: 'My Courses', to: '/student/courses', icon: BookOpen },
    { label: 'Assignments', to: '/student/assignments', icon: FileText },
    { label: 'Progress & Grades', to: '/student/progress', icon: TrendingUp },
    { label: 'Attendance', to: '/student/attendance', icon: CalendarCheck2 },
    { label: 'AI Study Assistant', to: '/student/ai-assistant', icon: Bot },
    { label: 'Notifications', to: '/student/notifications', icon: Bell },
  ];

  const teacherLinks: NavItem[] = [
    { label: 'Overview', to: '/teacher', icon: LayoutDashboard },
    { label: 'Course Studio', to: '/teacher/courses', icon: BookOpen },
    { label: 'Quiz Builder', to: '/teacher/quizzes', icon: HelpCircle },
    { label: 'Assignments', to: '/teacher/assignments', icon: FileText },
    { label: 'Gradebook', to: '/teacher/gradebook', icon: FileCheck2 },
    { label: 'Attendance Register', to: '/teacher/attendance', icon: CalendarCheck2 },
    { label: 'Class Analytics', to: '/teacher/analytics', icon: TrendingUp },
  ];

  const adminLinks: NavItem[] = [
    { label: 'Overview', to: '/admin', icon: LayoutDashboard },
    { label: 'User Directory', to: '/admin/users', icon: Users },
    { label: 'Courses Management', to: '/admin/courses', icon: BookOpen },
    { label: 'Subject Catalog', to: '/admin/subjects', icon: FolderTree },
    { label: 'Reports & Analytics', to: '/admin/reports', icon: TrendingUp },
    { label: 'Settings', to: '/admin/settings', icon: Settings },
  ];

  const links = role === 'admin' ? adminLinks : role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80 bg-slate-950/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-base tracking-tight">EduSathi</span>
            </div>
            <p className="text-[11px] text-slate-400 capitalize">{role} Portal</p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Navigation Menu
          </div>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/student' || link.to === '/teacher' || link.to === '/admin'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  } ${link.highlight ? 'ring-1 ring-brand-500/30' : ''}`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{link.label}</span>

              </NavLink>
            );
          })}
        </div>

        {/* Footer info card */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <div className="p-3 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60">
            <div className="flex items-center gap-2 text-brand-400 mb-1">

              <span className="text-[11px] font-bold">EduSathi</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Real-time curriculum guidance & automated scoring active.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
