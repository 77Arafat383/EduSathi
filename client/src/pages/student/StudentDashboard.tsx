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
  AlertTriangle,
  Bot,
  CreditCard,
  Receipt,
  BadgeCheck,
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
  const [paymentSummary, setPaymentSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getStudentAnalytics().catch(() => null),
      api.getMyAttendance().catch(() => null),
      api.getMyStudentPayments().catch(() => null),
    ]).then(([anaData, attData, payData]) => {
      setAnalytics(anaData);
      setAttendance(attData);
      setPaymentSummary(payData);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome & Overview Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl space-y-2">

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            You are enrolled in {analytics?.enrolled_courses || 0} active curriculum tracks. Track your attendance records, upcoming deadlines, tuition standing, and study materials below.
          </p>
          <div className="mt-4 pt-1 flex flex-wrap items-center gap-2.5">
            <Link
              to="/student/courses"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              <BookOpen className="w-3.5 h-3.5" /> Resume Courses
            </Link>
            <Link
              to="/student/payments"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200/80 transition"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Tuition &amp; Payments
            </Link>
            <Link
              to="/student/attendance"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs transition"
            >
              <CalendarCheck2 className="w-3.5 h-3.5 text-blue-600" /> Attendance History
            </Link>
            <Link
              to="/student/ai-assistant"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200/80 transition"
            >
              <Bot className="w-3.5 h-3.5 text-purple-600" /> AI Study Tutor
            </Link>
          </div>
        </div>
      </div>

      {/* High-Priority Outstanding Due Alert (Conditional) */}
      {paymentSummary?.has_due && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Outstanding Tuition Due Notice
              </div>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                You have a pending tuition balance of ৳{paymentSummary.total_due_available.toLocaleString()}.
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Pay online via bKash, Nagad, Card, or Bank to maintain full laboratory &amp; grade release access.
              </p>
            </div>
          </div>
          <Link
            to="/student/payments"
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 flex items-center justify-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5" /> Pay Due Now
          </Link>
        </div>
      )}

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
        dayDetails={attendance?.day_details || {}}
        records={attendance?.records || []}
        title="Annual Academic Attendance Grid (365 Days)"
      />

      {/* Upcoming Deadlines & Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        {/* Tuition & Financial Standing Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" /> Tuition &amp; Finance
              </h3>
              <Link to="/student/payments" className="text-xs font-semibold text-brand-600 hover:underline">
                View Ledger
              </Link>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Outstanding Due:</span>
                <span className={`text-sm font-black ${paymentSummary?.has_due ? 'text-rose-700' : 'text-slate-900'}`}>
                  ৳{(paymentSummary?.total_due_available || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                <span className="text-xs text-slate-500 font-semibold">Total Paid to Date:</span>
                <span className="text-xs font-bold text-emerald-700">
                  ৳{(paymentSummary?.total_paid || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {paymentSummary?.has_due ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <AlertTriangle className="w-3 h-3 text-amber-600" /> Due Balance Available
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <BadgeCheck className="w-3 h-3 text-emerald-600" /> In Good Standing
                </span>
              )}
              <span className="text-slate-400 text-[11px]">Accounts Verified</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Official ledger synced</span>
            <Link
              to="/student/payments"
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              {paymentSummary?.has_due ? 'Clear Due' : 'Payments'} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Suggested Next Action */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-brand-600 font-bold text-sm mb-2">
              Suggested Next Study Activity
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
