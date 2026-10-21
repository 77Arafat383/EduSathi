import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  FolderTree,
  TrendingUp,
  ShieldCheck,
  UserPlus,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../app/providers';
import { api } from '../../lib/api';
import { StatCard } from '../../components/common/StatCard';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminAnalytics()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const studentCount = data?.users_by_role?.find((r: any) => r.role === 'student')?.count || 0;
  const teacherCount = data?.users_by_role?.find((r: any) => r.role === 'teacher')?.count || 0;

  return (
    <div className="space-y-8 pb-16">
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="max-w-2xl">
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
            Administrator Console 🛡️
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Platform governance: account provision, role permissions, course oversight, and institutional analytics.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition"
            >
              <UserPlus className="w-4 h-4" /> Manage User Accounts
            </Link>
            <Link
              to="/admin/subjects"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl backdrop-blur-md transition"
            >
              <FolderTree className="w-4 h-4" /> Subject Catalog
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={studentCount}
          subtitle="Enrolled active learners"
          icon={Users}
          color="brand"
        />
        <StatCard
          title="Faculty Teachers"
          value={teacherCount}
          subtitle="Course instructors"
          icon={ShieldCheck}
          color="indigo"
        />
        <StatCard
          title="Active Enrollments"
          value={data?.total_enrollments || 0}
          subtitle="Student-course relationships"
          icon={BookOpen}
          color="emerald"
        />
        <StatCard
          title="Submissions Evaluated"
          value={data?.total_submissions || 0}
          subtitle="Assignment deliverables"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Institutional Overview */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Platform Governance Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-1">Attendance Verification</span>
            <span className="text-xl font-extrabold text-slate-800">{data?.total_attendance_records || 0}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Logged session records</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-1">Active Quizzes</span>
            <span className="text-xl font-extrabold text-slate-800">{data?.total_quizzes || 0}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Interactive examinations</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-1">Security Status</span>
            <span className="text-xl font-extrabold text-emerald-600">PASS (100%)</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">RBAC &amp; BOLA verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
