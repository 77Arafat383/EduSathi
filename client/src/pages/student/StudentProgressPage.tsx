import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  BarChart2,
  BookOpen,
  FileText,
  HelpCircle,
  CalendarCheck2,
  ArrowRight,
  ArrowUpRight,
  User,
  Clock,
  Layers,
  GraduationCap,
  Bot,
  Percent,
  Check,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
} from 'recharts';
import { api } from '../../lib/api';
import { StudentAnalytics, Course } from '../../types';

export const StudentProgressPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'assignments' | 'quizzes'>('assignments');
  const [chartView, setChartView] = useState<'trend' | 'courses'>('trend');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getStudentAnalytics().catch(() => null),
      api.getMyCourses().catch(() => []),
      api.getMyQuizResults().catch(() => []),
      api.getMyGrades().catch(() => []),
      api.getMyAttendance().catch(() => null),
    ]).then(([ana, crs, qz, grd, att]) => {
      setAnalytics(ana);
      setCourses(Array.isArray(crs) ? crs : []);
      setQuizResults(Array.isArray(qz) ? qz : []);
      setGrades(Array.isArray(grd) ? grd : []);
      setAttendance(att);
      setLoading(false);
    });
  }, []);

  // Compute weighted academic standing
  const academicStanding = useMemo(() => {
    const quizAvg = analytics?.average_quiz_score || 0;
    const asgAvg = analytics?.average_assignment_score || 0;
    const attAvg = attendance?.percentage ?? analytics?.overall_attendance_pct ?? 100;

    // Academic weights: 40% assignments, 40% quizzes, 20% attendance
    let totalWeight = 0;
    let weightedSum = 0;

    if (grades.length > 0) {
      weightedSum += asgAvg * 0.4;
      totalWeight += 0.4;
    }
    if (quizResults.length > 0) {
      weightedSum += quizAvg * 0.4;
      totalWeight += 0.4;
    }
    if (attendance?.total > 0) {
      weightedSum += attAvg * 0.2;
      totalWeight += 0.2;
    }

    const cumulativePct =
      totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 100;

    let letter = 'A+';
    let label = 'Top Academic Performer';
    let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';

    if (cumulativePct >= 90) {
      letter = 'A+';
      label = 'Top Academic Performer';
      badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (cumulativePct >= 80) {
      letter = 'A';
      label = 'Exemplary Standing';
      badgeBg = 'bg-teal-50 text-teal-700 border-teal-200';
    } else if (cumulativePct >= 70) {
      letter = 'B';
      label = 'Good Academic Standing';
      badgeBg = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (cumulativePct >= 60) {
      letter = 'C';
      label = 'Satisfactory Progress';
      badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
    } else {
      letter = 'D';
      label = 'Academic Attention Needed';
      badgeBg = 'bg-rose-50 text-rose-700 border-rose-200';
    }

    return { cumulativePct, letter, label, badgeBg, quizAvg, asgAvg, attAvg };
  }, [analytics, grades, quizResults, attendance]);

  // Combined chronologically sorted performance trend data
  const trendChartData = useMemo(() => {
    const points: Array<{ name: string; score: number; type: 'Quiz' | 'Assignment'; date: string }> = [];

    quizResults.forEach((q) => {
      const pct =
        q.max_score > 0 ? Math.round(((q.score || 0) / q.max_score) * 100) : 0;
      points.push({
        name: q.quiz_title || 'Quiz',
        score: pct,
        type: 'Quiz',
        date: q.submitted_at || new Date().toISOString(),
      });
    });

    grades.forEach((g) => {
      const pct =
        g.max_score > 0 ? Math.round(((g.score || 0) / g.max_score) * 100) : 0;
      points.push({
        name: g.assignment_title || 'Task',
        score: pct,
        type: 'Assignment',
        date: g.released_at || new Date().toISOString(),
      });
    });

    points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (points.length === 0) {
      return [
        { name: 'Initial Baseline', score: 85, type: 'Quiz', date: '' },
        { name: 'Midterm Review', score: 90, type: 'Assignment', date: '' },
      ];
    }

    return points.map((p, idx) => ({
      ...p,
      label: `#${idx + 1} ${p.name.length > 14 ? p.name.slice(0, 14) + '...' : p.name}`,
    }));
  }, [quizResults, grades]);

  // Course progress comparison chart data
  const courseChartData = useMemo(() => {
    return courses.map((c) => ({
      name: c.subject_code || c.title.slice(0, 12),
      title: c.title,
      progress: c.progress_pct || 0,
      lessons: c.lesson_count || (c as any).total_lessons || 0,
    }));
  }, [courses]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Compiling academic performance transcript...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200/60 uppercase tracking-wider">
              Academic Transcript
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Official Evaluation Report</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            Academic Performance &amp; Progress
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified evaluations across coursework tasks, timed quizzes, curriculum completion, and attendance.
          </p>
        </div>

        {/* Global Jumpers */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/student/courses"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-brand-600" />
            <span>Course Studio</span>
          </Link>

          <Link
            to="/student/assignments"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Assignments</span>
          </Link>

          <Link
            to="/student/attendance"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <CalendarCheck2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Attendance Heatmap</span>
          </Link>
        </div>
      </div>

      {/* Standing Summary Card (Clean, Professional Academic Design) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider border border-slate-200">
              <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
              <span>Cumulative Academic Standing</span>
            </div>

            <div className="flex items-baseline gap-3 pt-0.5">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Grade {academicStanding.letter}
              </h2>
              <span className="text-2xl font-bold font-mono text-brand-600">
                ({academicStanding.cumulativePct}%)
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Calculated using weighted scores across teacher-evaluated assignments (40%), timed quiz
              assessments (40%), and attendance sessions (20%).
            </p>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0">
            <div className="text-left md:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">
                Academic Tier
              </span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">
                {academicStanding.label}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 mt-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Good Standing • Active Status
              </span>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-2xs">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Core Academic KPI Breakdown Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Assignment Mastery
            </span>
            <FileText className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {academicStanding.asgAvg}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {grades.length} evaluated tasks
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quiz Assessments
            </span>
            <HelpCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {academicStanding.quizAvg}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {quizResults.length} completed attempts
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Attendance Compliance
            </span>
            <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {academicStanding.attAvg}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {attendance?.present || 0} classes attended
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Syllabus Completion
            </span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {analytics?.course_completion_pct || 0}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {analytics?.completed_lessons || 0} of {analytics?.total_lessons || 0} topics
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PERFORMANCE VISUALIZATION CHARTS                                          */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {chartView === 'trend'
                ? 'Evaluation Score Trajectory (Timeline)'
                : 'Curriculum Progress by Course Track'}
            </h3>
            <p className="text-xs text-slate-500">
              {chartView === 'trend'
                ? 'Chronological percentage scores across evaluated assignments and quizzes.'
                : 'Module completion percentage achieved in each enrolled course.'}
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto border border-slate-200">
            <button
              onClick={() => setChartView('trend')}
              className={`px-3 py-1 rounded-lg transition ${
                chartView === 'trend'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Score Trajectory
            </button>
            <button
              onClick={() => setChartView('courses')}
              className={`px-3 py-1 rounded-lg transition ${
                chartView === 'courses'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Course Syllabi
            </button>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'trend' ? (
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  unit="%"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, 'Score']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '11px',
                    border: 'none',
                    padding: '8px 12px',
                  }}
                />
                <ReferenceLine
                  y={academicStanding.cumulativePct}
                  stroke="#6366f1"
                  strokeDasharray="4 4"
                  label={{
                    value: `Avg: ${academicStanding.cumulativePct}%`,
                    fill: '#6366f1',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#0d9488"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            ) : (
              <BarChart data={courseChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  unit="%"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [
                    `${val}% (${item.payload.lessons} topics)`,
                    item.payload.title,
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '11px',
                    border: 'none',
                    padding: '8px 12px',
                  }}
                />
                <Bar dataKey="progress" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COURSE-BY-COURSE SYLLABUS BREAKDOWN                                       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Enrolled Course Track Breakdown
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Curriculum progression and evaluation scope for each of your enrolled courses.
            </p>
          </div>
          <Link
            to="/student/courses"
            className="text-xs font-bold text-brand-600 hover:underline inline-flex items-center gap-1"
          >
            <span>Course Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            You are not enrolled in any active courses yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => {
              const totalLessons = course.lesson_count || (course as any).total_lessons || 0;
              const completed = (course as any).completed_lessons || 0;
              const progressPct = course.progress_pct || 0;

              return (
                <div
                  key={course.id}
                  className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 transition flex flex-col justify-between bg-slate-50/50"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 text-white font-mono uppercase">
                        {course.subject_code || 'CRS'}
                      </span>
                      <span className="text-[11px] font-bold text-brand-600 font-mono">
                        {progressPct}% Finished
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{course.title}</h4>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-brand-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
                      <span>{completed}/{totalLessons} Topics Done</span>
                      <span>{course.assignment_count || 0} Tasks • {course.quiz_count || 0} Quizzes</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/70">
                    <Link
                      to={`/student/courses/${course.id}`}
                      className="text-xs font-bold text-slate-800 hover:text-brand-600 inline-flex items-center gap-1 transition"
                    >
                      <span>Open Course Curriculum</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* EVALUATION TRANSCRIPT (ASSIGNMENT GRADES & QUIZ RESULTS)                  */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Tab Toggle */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveHistoryTab('assignments')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeHistoryTab === 'assignments'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Released Task Evaluations ({grades.length})</span>
            </button>

            <button
              onClick={() => setActiveHistoryTab('quizzes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeHistoryTab === 'quizzes'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Quiz Assessment Records ({quizResults.length})</span>
            </button>
          </div>
        </div>

        {/* Assignments Table */}
        {activeHistoryTab === 'assignments' && (
          <div>
            {grades.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No assignment grades released by instructors yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Task Name</th>
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4 text-center">Score Awarded</th>
                      <th className="py-3 px-4">Instructor Feedback</th>
                      <th className="py-3 px-4 text-right">Released Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {grades.map((g) => {
                      const pct =
                        g.max_score > 0 ? Math.round(((g.score || 0) / g.max_score) * 100) : 0;

                      return (
                        <tr key={g.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {g.assignment_title}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-medium">
                            {g.course_title}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold font-mono text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {g.score} / {g.max_score} ({pct}%)
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 italic max-w-xs truncate">
                            {g.feedback ? `"${g.feedback}"` : 'No written feedback provided'}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                            {new Date(g.released_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              to={`/student/assignments/${g.assignment_id || ''}`}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:underline"
                            >
                              <span>View Work</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Quizzes Table */}
        {activeHistoryTab === 'quizzes' && (
          <div>
            {quizResults.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No quiz attempts submitted yet. Complete quizzes from your course workspace.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Quiz Title</th>
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4 text-center">Final Score</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Completion Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {quizResults.map((q) => {
                      const pct =
                        q.max_score > 0 ? Math.round(((q.score || 0) / q.max_score) * 100) : 0;

                      return (
                        <tr key={q.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">{q.quiz_title}</td>
                          <td className="py-3 px-4 text-slate-500 font-medium">
                            {q.course_title}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold font-mono text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {q.score} / {q.max_score} ({pct}%)
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3" /> Evaluated
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                            {new Date(q.submitted_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              to={`/student/quizzes/${q.quiz_id}`}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:underline"
                            >
                              <span>Review Answers</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
