import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  CalendarCheck2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bot,
} from 'lucide-react';
import { useAuth } from '../../app/providers';
import { api } from '../../lib/api';
import { StatCard } from '../../components/common/StatCard';
import { AttendanceHeatmap } from '../../components/common/AttendanceHeatmap';
import { StudentAnalytics, AttendanceSummary } from '../../types';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getStudentAnalytics().catch(() => null),
      api.getMyAttendance().catch(() => null),
    ]).then(([anaData, attData]) => {
      setAnalytics(anaData);
      setAttendance(attData);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome & AI Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-navy-900 to-brand-950 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            AI-Assisted Study Environment
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name}! 🚀
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            You are enrolled in {analytics?.enrolled_courses || 0} active courses. Stay on top of your upcoming deadlines and ask the AI assistant for personalized revision plans.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/student/ai-assistant"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition"
            >
              <Bot className="w-4 h-4" /> Open AI Study Assistant
            </Link>
            <Link
              to="/student/courses"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl backdrop-blur-md transition"
            >
              Resume Courses <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Enrolled Courses"
          value={analytics?.enrolled_courses || 0}
          subtitle="Active enrolled courses"
          icon={BookOpen}
          color="brand"
        />
        <StatCard
          title="Lesson Completion"
          value={`${analytics?.course_completion_pct || 0}%`}
          subtitle={`${analytics?.completed_lessons || 0} of ${analytics?.total_lessons || 0} lessons done`}
          icon={TrendingUp}
          color="indigo"
        />
        <StatCard
          title="Avg Assessment Score"
          value={`${analytics?.average_quiz_score || 0}%`}
          subtitle="Quiz & test evaluations"
          icon={FileText}
          color="emerald"
        />
        <StatCard
          title="Attendance Rate"
          value={`${attendance?.percentage || 100}%`}
          subtitle={`${attendance?.present_count || 0} attended sessions`}
          icon={CalendarCheck2}
          color="amber"
        />
      </div>

      {/* 365-Day Attendance Heatmap Grid */}
      <AttendanceHeatmap
        dayMap={attendance?.day_map || {}}
        title="Annual Academic Attendance Grid (365 Days)"
      />

      {/* Upcoming Deadlines & Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deadlines Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" /> Upcoming Deadlines
            </h3>
            <Link to="/student/assignments" className="text-xs font-semibold text-brand-600 hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-2.5">
            {!analytics?.upcoming_deadlines || analytics.upcoming_deadlines.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No pending deadlines right now. You are all caught up!</p>
            ) : (
              analytics.upcoming_deadlines.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                    <p className="text-[11px] text-slate-500">{item.course_title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Due {new Date(item.due_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Suggested Next Action */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-brand-600 font-bold text-sm mb-2">
              <Sparkles className="w-4 h-4" /> Suggested Next Study Activity
            </div>
            <h4 className="text-base font-bold text-slate-900">
              Web Architecture &amp; RESTful Services Assessment
            </h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Complete Quiz 1 to test your understanding of REST statelessness, idempotency, and server-side BOLA authorization mechanisms.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Estimated duration: 15 mins</span>
            <Link
              to="/student/quizzes/qiz_web_1"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              Start Quiz <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
