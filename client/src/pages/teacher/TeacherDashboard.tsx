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
  Wallet,
  Calendar,
  CheckCircle2,
  Clock,
  Building,
  Layers,
  HelpCircle,
  FileText,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../app/providers';
import { api } from '../../lib/api';
import { TeacherSalary } from '../../types';

interface TeacherCourseItem {
  id: string;
  title: string;
  description?: string;
  subject_name?: string;
  subject_code?: string;
  student_count?: number;
  assignment_count?: number;
  quiz_count?: number;
  module_count?: number;
  lesson_count?: number;
  session_count?: number;
  created_at?: string;
}

interface FlaggedStudent {
  id: string;
  full_name: string;
  email?: string;
  student_id?: string;
  course_title: string;
  score: number;
  max_score: number;
  reason: string;
}

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<{
    total_courses?: number;
    total_students?: number;
    pending_grading_count?: number;
    courses?: TeacherCourseItem[];
    flagged_students?: FlaggedStudent[];
  } | null>(null);

  const [salaryData, setSalaryData] = useState<{
    salaries: TeacherSalary[];
    total_paid: number;
    pending_amount: number;
    assigned_courses: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getTeacherAnalytics().catch(() => null),
      api.getMyTeacherSalaries().catch(() => null),
    ])
      .then(([analyticsRes, salaryRes]) => {
        if (analyticsRes) setAnalytics(analyticsRes);
        if (salaryRes?.data) setSalaryData(salaryRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatTaka = (val?: number) => {
    return `৳ ${(Number(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const coursesList = analytics?.courses || [];
  const flaggedList = analytics?.flagged_students || [];
  const pendingGradingCount = analytics?.pending_grading_count || 0;

  if (loading) {
    return (
      <div className="space-y-6 pb-16 animate-pulse">
        <div className="h-44 rounded-3xl bg-slate-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-80 rounded-2xl bg-slate-200" />
          <div className="lg:col-span-4 h-80 rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-16">
      {/* 1. Executive Teacher Hero & Quick Access Bar */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle top gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-600 via-teal-500 to-indigo-600" />

        {/* Ambient soft background lighting */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-brand-50/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-12 w-80 h-80 bg-indigo-50/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Faculty Profile & Greeting */}
          <div className="flex items-start sm:items-center gap-4.5 max-w-2xl">


            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-brand-50 text-brand-700 border border-brand-200 shadow-2xs">
                  <GraduationCap className="w-3 h-3 text-brand-600" />
                  Teacher Portal
                </span>
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {user?.department ? `${user.department} Department` : 'Academic Instructor'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Welcome back, {user?.full_name || 'Instructor'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl">
                Monitor course progress, take interactive attendance sessions, grade student submissions, and view official salary vouchers.
              </p>
            </div>
          </div>

          {/* Quick Action Command Deck */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to="/teacher/attendance"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              <CalendarCheck2 className="w-4 h-4 text-white" />
              <span>Take Attendance</span>
            </Link>

            <Link
              to="/teacher/gradebook"
              className={`inline-flex items-center gap-2 px-4 py-2.5 font-semibold text-xs rounded-xl transition-all border shadow-xs hover:shadow-sm active:scale-[0.98] ${pendingGradingCount > 0
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
            >
              <FileCheck2 className="w-4 h-4 text-slate-500" />
              <span>Gradebook</span>
              {pendingGradingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold">
                  {pendingGradingCount}
                </span>
              )}
            </Link>

            <Link
              to="/teacher/courses/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition-all shadow-xs active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4 text-slate-500" />
              <span>New Course</span>
            </Link>
          </div>
        </div>

        {/* Micro-metrics Status Ribbon */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-500 text-[11px]">Assigned Load:</span>
              <span className="font-bold text-slate-900 text-xs">{coursesList.length} Courses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-slate-500 text-[11px]">Enrolled Learners:</span>
              <span className="font-bold text-slate-900 text-xs">{analytics?.total_students || 0} Students</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${pendingGradingCount > 0 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
              />
              <span className="text-slate-500 text-[11px]">Grading Backlog:</span>
              <span
                className={`font-bold text-xs ${pendingGradingCount > 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
              >
                {pendingGradingCount > 0 ? `${pendingGradingCount} Pending` : 'All Graded'}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <span className="text-slate-500 text-[11px]">Disbursed Salary:</span>
              <span className="font-bold text-teal-700 text-xs">{formatTaka(salaryData?.total_paid || 0)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono bg-slate-50 border border-slate-200/80 px-3 py-1 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Vital Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Courses */}
        <Link to="/teacher/courses" className="group block focus:outline-hidden">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-brand-500/50 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Courses</span>
              <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {analytics?.total_courses || 0}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>Assigned teaching curriculum</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </Link>

        {/* Enrolled Learners */}
        <Link to="/teacher/gradebook" className="group block focus:outline-hidden">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-500/50 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enrolled Learners</span>
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {analytics?.total_students || 0}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>Across all batches &amp; classes</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </Link>

        {/* Grading Queue */}
        <Link to="/teacher/gradebook" className="group block focus:outline-hidden">
          <div
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md ${pendingGradingCount > 0
              ? 'border-rose-200 hover:border-rose-400 bg-rose-50/20'
              : 'border-slate-200/80 hover:border-emerald-400'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grading Queue</span>
              <div
                className={`p-2.5 rounded-xl border group-hover:scale-105 transition-transform ${pendingGradingCount > 0
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}
              >
                <FileCheck2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {pendingGradingCount}
              </span>
              {pendingGradingCount > 0 ? (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                  Pending Review
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Up to Date
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>{pendingGradingCount > 0 ? 'Submissions awaiting evaluation' : 'All submissions evaluated'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </Link>

        {/* Cleared Compensation */}
        <Link to="/teacher/salary" className="group block focus:outline-hidden">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cleared Compensation</span>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:scale-105 transition-transform">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {formatTaka(salaryData?.total_paid || 0)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>Disbursed faculty payroll</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </Link>
      </div>

      {/* 3. Operational Command Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): My Courses & Direct Feature Launchers */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Assigned Courses &amp; Teaching Load</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {coursesList.length} Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Quickly launch attendance, open syllabus roadmaps, and review grades for each course.
                  </p>
                </div>
              </div>

              <Link
                to="/teacher/courses"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 self-start sm:self-auto transition"
              >
                <span>Course Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {coursesList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">No courses assigned yet</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    You currently have no active courses assigned. You can create a new course or wait for administrator allocation.
                  </p>
                </div>
                <Link
                  to="/teacher/courses/create"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Create First Course
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {coursesList.map((course) => (
                  <div
                    key={course.id}
                    className="p-4 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-slate-50/40 hover:bg-white transition-all space-y-3"
                  >
                    {/* Course Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                            {course.subject_code || 'CRS'}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{course.title}</h4>
                        </div>
                        {course.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">{course.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 shrink-0">
                        <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200">
                          <Users className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{course.student_count || 0} Students</span>
                        </span>
                      </div>
                    </div>

                    {/* Real Metrics Indicators */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {course.lesson_count || 0} Lessons ({course.module_count || 0} Modules)
                        </span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarCheck2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{course.session_count || 0} Sessions Logged</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>{course.quiz_count || 0} Quizzes</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>{course.assignment_count || 0} Assignments</span>
                      </span>
                    </div>

                    {/* Direct Feature Launchers for this Course */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Link
                        to={`/teacher/attendance?courseId=${course.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                      >
                        <CalendarCheck2 className="w-3.5 h-3.5" />
                        <span>Take Attendance</span>
                      </Link>

                      <Link
                        to={`/teacher/analytics?courseId=${course.id}&tab=syllabus`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Syllabus Roadmap</span>
                      </Link>

                      <Link
                        to={`/teacher/gradebook?courseId=${course.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Gradebook</span>
                      </Link>

                      <Link
                        to={`/teacher/quizzes`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition ml-auto"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                        <span>Quiz Builder</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Quick Operations & Academic Attention */}
        <div className="lg:col-span-4 space-y-6">
          {/* Module 1: Teacher Operations Hub */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Teacher Operations Hub
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Core Modules</span>
            </div>

            <div className="space-y-2">
              <Link
                to="/teacher/attendance"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                    <CalendarCheck2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Attendance Sessions</span>
                    <span className="text-[10px] text-slate-500">Live timer &amp; roll call grid</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/teacher/analytics?tab=syllabus"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/30 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Syllabus &amp; Roadmaps</span>
                    <span className="text-[10px] text-slate-500">Progress checklists &amp; milestones</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/teacher/quizzes"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/30 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Quiz Builder Studio</span>
                    <span className="text-[10px] text-slate-500">MCQs, formulas &amp; attempts</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/teacher/assignments"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 hover:border-brand-300 hover:bg-brand-50/30 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Assignment Tasks</span>
                    <span className="text-[10px] text-slate-500">Deadlines, files &amp; rubrics</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/teacher/salary"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Faculty Salary Statement</span>
                    <span className="text-[10px] text-slate-500">Payment records &amp; vouchers</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Module 2: Academic Attention Queue */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Academic Attention
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">&lt; 60% Score</span>
            </div>

            {flaggedList.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-slate-800">All Learners On Track</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  No students are currently flagged for low assessment scores across your active courses.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {flaggedList.slice(0, 4).map((st) => (
                  <div
                    key={st.id}
                    className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-xs font-bold text-slate-900 block truncate">{st.full_name}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{st.course_title}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                        {st.score}/{st.max_score}
                      </span>
                      <Link
                        to="/teacher/gradebook"
                        className="text-[10px] font-bold text-brand-600 hover:text-brand-700 block mt-0.5"
                      >
                        Review →
                      </Link>
                    </div>
                  </div>
                ))}

                <Link
                  to="/teacher/gradebook"
                  className="block text-center text-xs font-bold text-slate-600 hover:text-slate-800 py-1 transition"
                >
                  View Full Gradebook Roster →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default TeacherDashboard;


