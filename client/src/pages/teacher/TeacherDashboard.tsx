import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  FileCheck2,
  CalendarCheck2,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../app/providers';
import { api } from '../../lib/api';
import { StatCard } from '../../components/common/StatCard';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTeacherAnalytics()
      .then(setAnalytics)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-16">
      {/* Teacher Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="max-w-2xl">
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Instructor Studio
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
            Welcome, {user?.full_name}! 📚
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Manage your teaching materials, create multi-choice quizzes, evaluate submissions, and record daily class session attendance.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/teacher/courses/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" /> Create New Course
            </Link>
            <Link
              to="/teacher/gradebook"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl backdrop-blur-md transition"
            >
              Pending Submissions ({analytics?.pending_grading_count || 0}) <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title="Active Courses"
          value={analytics?.total_courses || 0}
          subtitle="Assigned teaching curriculum"
          icon={BookOpen}
          color="brand"
        />
        <StatCard
          title="Enrolled Learners"
          value={analytics?.total_students || 0}
          subtitle="Across all assigned courses"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Grading Backlog"
          value={analytics?.pending_grading_count || 0}
          subtitle="Submissions awaiting evaluation"
          icon={FileCheck2}
          color="rose"
        />
      </div>

      {/* Flagged Students Card (Low Scores / Needs Attention) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Academic Attention Indicators</h3>
          </div>
          <span className="text-xs text-slate-400">Rule-based assessment flags (&lt; 60% score)</span>
        </div>

        {!analytics?.flagged_students || analytics.flagged_students.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No students currently flagged for academic attention.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="pb-3">Student Name</th>
                  <th className="pb-3">Course</th>
                  <th className="pb-3">Evaluation Result</th>
                  <th className="pb-3">Trigger Reason</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {analytics.flagged_students.map((st: any) => (
                  <tr key={st.id} className="hover:bg-slate-50/80">
                    <td className="py-3 font-bold text-slate-900">{st.full_name}</td>
                    <td className="py-3 text-slate-500">{st.course_title}</td>
                    <td className="py-3">
                      <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        {st.score} / {st.max_score}
                      </span>
                    </td>
                    <td className="py-3 text-amber-700 font-semibold">{st.reason}</td>
                    <td className="py-3 text-right">
                      <Link
                        to="/teacher/gradebook"
                        className="text-brand-600 hover:underline font-bold"
                      >
                        Review Work →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
