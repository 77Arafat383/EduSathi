import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  FolderTree,
  ShieldCheck,
  UserPlus,
  ArrowRight,
  GraduationCap,
  Activity,
  FileCheck2,
  Database,
  Lock,
  Plus,
  CalendarCheck2,
  Wallet,
  CreditCard,
  Building,
  TrendingUp,
  ArrowUpRight,
  AlertCircle,
  Receipt,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../app/providers';
import { api } from '../../lib/api';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { User, Course } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [financeSummary, setFinanceSummary] = useState<{
    total_collected: number;
    total_salary_disbursed: number;
    total_outstanding_due: number;
    total_invoiced: number;
  }>({
    total_collected: 0,
    total_salary_disbursed: 0,
    total_outstanding_due: 0,
    total_invoiced: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAdminAnalytics(),
      api.getUsers(),
      api.getCourses(),
      api.getStudentPaymentsSummary().catch(() => null),
      api.getTeacherSalariesSummary().catch(() => null),
    ])
      .then(([analyticsData, usersData, coursesData, studentPaySummary, teacherSalSummary]) => {
        setData(analyticsData);
        setUsers(usersData || []);
        setCourses((coursesData || []).slice(0, 4));

        const collected = Number(studentPaySummary?.total_collected ?? analyticsData?.fiscal_summary?.total_collected ?? 0);
        const disbursed = Number(teacherSalSummary?.total_disbursed ?? analyticsData?.fiscal_summary?.total_salary_disbursed ?? 0);
        const due = Number(studentPaySummary?.total_outstanding_due ?? analyticsData?.fiscal_summary?.total_outstanding_due ?? 0);
        const invoiced = Number(studentPaySummary?.total_invoiced ?? analyticsData?.fiscal_summary?.total_invoiced ?? 0);

        setFinanceSummary({
          total_collected: collected,
          total_salary_disbursed: disbursed,
          total_outstanding_due: due,
          total_invoiced: invoiced,
        });
      })
      .catch((err) => console.error('Failed to load admin dashboard data:', err))
      .finally(() => setLoading(false));
  }, []);

  const students = users.filter((u) => u.role === 'student');
  const teachers = users.filter((u) => u.role === 'teacher');
  const recentStudents = students.slice(0, 5);
  const recentTeachers = teachers.slice(0, 5);

  const studentCount = data?.users_by_role?.find((r: any) => r.role === 'student')?.count || students.length || 0;
  const teacherCount = data?.users_by_role?.find((r: any) => r.role === 'teacher')?.count || teachers.length || 0;
  const adminCount = data?.users_by_role?.find((r: any) => r.role === 'admin')?.count || 0;
  const totalUsers = studentCount + teacherCount + adminCount;

  const studentPercent = totalUsers > 0 ? Math.round((studentCount / totalUsers) * 100) : 0;
  const teacherPercent = totalUsers > 0 ? Math.round((teacherCount / totalUsers) * 100) : 0;
  const adminPercent = totalUsers > 0 ? 100 - studentPercent - teacherPercent : 0;

  // Fiscal Operating Calculations (Profit & Loss)
  const studentCollections = financeSummary.total_collected;
  const teacherPayments = financeSummary.total_salary_disbursed;
  const netProfitLoss = studentCollections - teacherPayments;
  const isProfit = netProfitLoss >= 0;
  const profitMarginPct = studentCollections > 0
    ? Math.round((netProfitLoss / studentCollections) * 100)
    : 0;
  const recoveryRatio = teacherPayments > 0
    ? Math.round((studentCollections / teacherPayments) * 100)
    : 100;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Administrator Console
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Platform-wide governance, user provisioning, course lifecycle, and institutional health.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg shadow-sm transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Manage Users</span>
          </Link>
          <Link
            to="/admin/courses"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg shadow-sm transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>Courses</span>
          </Link>
        </div>
      </div>

      {/* Profit & Loss Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
              isProfit
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-rose-50 text-rose-600 border-rose-200'
            }`}>
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Profit &amp; Loss Overview</h3>
              <p className="text-[11px] text-slate-500">Student fee collections vs. faculty salary payouts</p>
            </div>
          </div>
          <Link
            to="/admin/reports"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition"
          >
            <span>Detailed reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4-Card Financial Metrics */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Net Balance */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between transition ${
            isProfit
              ? 'bg-emerald-50/40 border-emerald-200/70'
              : 'bg-rose-50/40 border-rose-200/70'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  {isProfit ? 'Net Profit' : 'Net Loss'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isProfit
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}>
                  {isProfit ? 'Surplus' : 'Deficit'}
                </span>
              </div>
              <div className={`text-2xl font-extrabold tracking-tight mt-2 ${
                isProfit ? 'text-emerald-700' : 'text-rose-600'
              }`}>
                {isProfit ? '+' : '-'}৳ {Math.abs(netProfitLoss).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {isProfit
                  ? 'Fee collections exceed salary payouts'
                  : 'Salary payouts exceed fee collections'}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
              <span>Operating margin</span>
              <span className={`font-bold ${isProfit ? 'text-emerald-700' : 'text-rose-600'}`}>
                {isProfit ? '+' : ''}{profitMarginPct}%
              </span>
            </div>
          </div>

          {/* Card 2: Student Collections */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Student Collections</span>
                <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
                ৳ {studentCollections.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Realized student tuition payments
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">Invoiced: ৳ {financeSummary.total_invoiced.toLocaleString()}</span>
              <Link to="/admin/student-payments" className="font-bold text-brand-600 hover:text-brand-700 hover:underline">
                Payments →
              </Link>
            </div>
          </div>

          {/* Card 3: Teacher Salaries Paid */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Teacher Salaries Paid</span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
                ৳ {teacherPayments.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Disbursed faculty compensation
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">Coverage: {recoveryRatio}%</span>
              <Link to="/admin/salaries" className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
                Salaries →
              </Link>
            </div>
          </div>

          {/* Card 4: Outstanding Dues */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Outstanding Dues</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-amber-600 tracking-tight mt-2">
                ৳ {financeSummary.total_outstanding_due.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Unpaid student tuition balance
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">Receivables</span>
              <Link to="/admin/student-payments" className="font-bold text-amber-700 hover:text-amber-800 hover:underline">
                Collect dues →
              </Link>
            </div>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Inflow: <strong className="font-semibold text-slate-900">৳ {studentCollections.toLocaleString()}</strong> (Student Collections)</span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span>Outflow: <strong className="font-semibold text-slate-900">৳ {teacherPayments.toLocaleString()}</strong> (Teacher Payments)</span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span>Net: <strong className={`font-semibold ${isProfit ? 'text-emerald-700' : 'text-rose-600'}`}>
              {isProfit ? '+' : '-'}৳ {Math.abs(netProfitLoss).toLocaleString()}
            </strong></span>
          </div>
          <div className="text-slate-500 text-[11px]">
            Payroll Coverage: <span className="font-semibold text-slate-800">{recoveryRatio}%</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Registered Users"
          value={totalUsers}
          subtitle={`${studentCount} Students • ${teacherCount} Faculty`}
          icon={Users}
          color="brand"
        />
        <StatCard
          title="Active Enrollments"
          value={data?.total_enrollments || 0}
          subtitle="Enrolled student seats"
          icon={GraduationCap}
          color="indigo"
        />
        <StatCard
          title="Course Offerings"
          value={courses.length || data?.courses_by_status?.length || 0}
          subtitle="Active delivered courses"
          icon={BookOpen}
          color="emerald"
        />
        <StatCard
          title="Submissions & Quizzes"
          value={(data?.total_submissions || 0) + (data?.total_quizzes || 0)}
          subtitle="Student deliverables recorded"
          icon={FileCheck2}
          color="amber"
        />
      </div>

      {/* Main 2-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Separate Student and Teacher Sections & Courses */}
        <div className="lg:col-span-8 space-y-8">
          {/* Students and Faculty Separated Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Enrolled Students Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Enrolled Students</h3>
                      <p className="text-[11px] text-slate-500">{students.length} active learners</p>
                    </div>
                  </div>
                  <Link
                    to="/admin/users"
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition"
                  >
                    All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-slate-100">
                  {recentStudents.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No students registered yet.
                    </div>
                  ) : (
                    recentStudents.map((s) => (
                      <div
                        key={s.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {s.avatar_url ? (
                            <img
                              src={s.avatar_url}
                              alt={s.full_name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 border border-brand-200 flex items-center justify-center text-xs font-bold shrink-0">
                              {s.full_name?.charAt(0) || 'S'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{s.full_name}</p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {s.student_id ? `ID: ${s.student_id}` : s.email}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={s.status || 'active'} size="sm" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 2. Faculty Instructors Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Faculty Instructors</h3>
                      <p className="text-[11px] text-slate-500">{teachers.length} course educators</p>
                    </div>
                  </div>
                  <Link
                    to="/admin/users"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition"
                  >
                    All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-slate-100">
                  {recentTeachers.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No faculty registered yet.
                    </div>
                  ) : (
                    recentTeachers.map((t) => (
                      <div
                        key={t.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {t.avatar_url ? (
                            <img
                              src={t.avatar_url}
                              alt={t.full_name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center text-xs font-bold shrink-0">
                              {t.full_name?.charAt(0) || 'T'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{t.full_name}</p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {t.department || t.email}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={t.status || 'active'} size="sm" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Active Course Catalog */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Academic Courses Overview</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Published curricula across departments</p>
              </div>
              <Link
                to="/admin/courses"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition"
              >
                All courses <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courses.length === 0 ? (
                <div className="col-span-2 p-6 text-center text-xs text-slate-400">
                  No courses found in catalog.
                </div>
              ) : (
                courses.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 hover:border-slate-200 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {c.subject_code || 'COURSE'}
                      </span>
                      <StatusBadge status={c.status || 'published'} size="sm" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{c.title}</h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>{c.student_count || 0} students enrolled</span>
                      <span>{c.lesson_count || 0} lessons</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): User Distribution & System Health */}
        <div className="lg:col-span-4 space-y-8">
          {/* User Distribution Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">User Role Distribution</h3>

            {/* Distribution Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${studentPercent}%` }}
                className="bg-brand-500 h-full"
                title={`Students: ${studentPercent}%`}
              />
              <div
                style={{ width: `${teacherPercent}%` }}
                className="bg-indigo-500 h-full"
                title={`Teachers: ${teacherPercent}%`}
              />
              <div
                style={{ width: `${adminPercent}%` }}
                className="bg-purple-500 h-full"
                title={`Admins: ${adminPercent}%`}
              />
            </div>

            {/* Distribution Legend */}
            <div className="space-y-2.5 pt-1 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                  <span>Students</span>
                </div>
                <span className="font-bold text-slate-900">
                  {studentCount} ({studentPercent}%)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span>Faculty Instructors</span>
                </div>
                <span className="font-bold text-slate-900">
                  {teacherCount} ({teacherPercent}%)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span>Administrators</span>
                </div>
                <span className="font-bold text-slate-900">
                  {adminCount} ({adminPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Infrastructure Health Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">System Infrastructure</h3>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                  <span>Database Layer</span>
                </div>
                <span className="font-bold text-slate-900">Connected</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Access Control</span>
                </div>
                <span className="font-bold text-slate-900">RBAC &amp; BOLA</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Auth Encryption</span>
                </div>
                <span className="font-bold text-slate-900">Bcrypt + JWT</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <CalendarCheck2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Attendance Logs</span>
                </div>
                <span className="font-bold text-slate-900">
                  {data?.total_attendance_records || 0} entries
                </span>
              </div>
            </div>
          </div>

          {/* Institutional Finance & Dues Management Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 rounded-2xl p-5 text-white shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-white">Finance &amp; Accounts</h3>
                <p className="text-[11px] text-slate-300 mt-0.5">Faculty payroll &amp; student receivables</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-teal-300">
                <Wallet className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-2">
              <Link
                to="/admin/salaries"
                className="group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-teal-200 transition">Faculty Salaries</p>
                    <p className="text-[10px] text-slate-400">Payroll logs &amp; disbursements</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                to="/admin/student-payments"
                className="group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-amber-200 transition">Student Payments &amp; Dues</p>
                    <p className="text-[10px] text-slate-400">Tuition fees &amp; balance settlement</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
