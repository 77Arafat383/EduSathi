import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  PlusCircle,
  Users,
  FileText,
  ArrowRight,
  Layers,
  Search,
  CheckCircle2,
  FileCheck2,
  Eye,
  CalendarCheck2,
  BarChart3,
  Clock,
  Plus,
  Trash2,
  UserPlus,
  X,
  GraduationCap,
  Filter,
  ExternalLink,
  LayoutGrid,
  List,
  Compass,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Course, CourseStudent, User } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

export const TeacherCoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Student Roster Modal State
  const [activeRosterCourse, setActiveRosterCourse] = useState<Course | null>(null);
  const [rosterStudents, setRosterStudents] = useState<CourseStudent[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [submittingEnroll, setSubmittingEnroll] = useState(false);

  const fetchCourses = () => {
    setLoading(true);
    api.getMyCourses()
      .then((data) => {
        setCourses(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to load courses', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
    api.getUsers({ role: 'student' }).then(setAllStudents).catch(() => []);
  }, []);

  const openStudentRoster = async (course: Course) => {
    setActiveRosterCourse(course);
    setStudentSearch('');
    setSelectedStudentId('');
    setRosterLoading(true);
    try {
      const students = await api.getCourseStudents(course.id);
      setRosterStudents(students || []);
    } catch (err: any) {
      console.error('Failed to load roster:', err);
    } finally {
      setRosterLoading(false);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRosterCourse || !selectedStudentId) return;

    setSubmittingEnroll(true);
    try {
      await api.enrollCourse(activeRosterCourse.id, selectedStudentId);
      setSelectedStudentId('');
      const students = await api.getCourseStudents(activeRosterCourse.id);
      setRosterStudents(students || []);
      fetchCourses();
    } catch (err: any) {
      alert(err.message || 'Failed to enroll student');
    } finally {
      setSubmittingEnroll(false);
    }
  };

  const handleUnenrollStudent = async (studentId: string) => {
    if (!activeRosterCourse) return;
    if (!confirm('Are you sure you want to remove this student from the course?')) return;
    try {
      await api.unenrollCourseStudent(activeRosterCourse.id, studentId);
      const students = await api.getCourseStudents(activeRosterCourse.id);
      setRosterStudents(students || []);
      fetchCourses();
    } catch (err: any) {
      alert(err.message || 'Failed to remove student');
    }
  };

  // Distinct subjects
  const distinctSubjects = useMemo(() => {
    const map = new Map<string, string>();
    courses.forEach(c => {
      if (c.subject_id && c.subject_name) {
        map.set(c.subject_id, c.subject_name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [courses]);

  // Overall Metrics
  const metrics = useMemo(() => {
    const totalCourses = courses.length;
    const totalStudents = courses.reduce((sum, c) => sum + (c.student_count || 0), 0);
    const totalQuizzes = courses.reduce((sum, c) => sum + (c.quiz_count || 0), 0);
    const totalAssignments = courses.reduce((sum, c) => sum + (c.assignment_count || 0), 0);
    const totalLessons = courses.reduce((sum, c) => sum + (c.lesson_count || 0), 0);
    return { totalCourses, totalStudents, totalQuizzes, totalAssignments, totalLessons };
  }, [courses]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      if (subjectFilter !== 'all' && c.subject_id !== subjectFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = c.title?.toLowerCase().includes(q);
        const matchesDesc = c.description?.toLowerCase().includes(q);
        const matchesSubject = c.subject_name?.toLowerCase().includes(q) || c.subject_code?.toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesSubject;
      }
      return true;
    });
  }, [courses, subjectFilter, statusFilter, searchQuery]);

  const filteredRosterStudents = rosterStudents.filter((s) =>
    s.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.student_id && s.student_id.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  const enrolledIds = new Set(rosterStudents.map((s) => s.id));
  const availableStudents = allStudents.filter((s) => !enrolledIds.has(s.id));

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200/60 uppercase tracking-wider">
              Faculty Studio
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Academic Hub</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            Course Studio &amp; Curriculum Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage syllabus curriculum, roster enrollments, attendance, and evaluation pipelines.
          </p>
        </div>

        {/* Global Quick Hub Links */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/teacher/attendance"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <CalendarCheck2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Attendance</span>
          </Link>

          <Link
            to="/teacher/analytics"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Class Analytics</span>
          </Link>

          <Link
            to="/teacher/gradebook"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Gradebook</span>
          </Link>

          <Link
            to="/teacher/courses/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Course</span>
          </Link>
        </div>
      </div>

      {/* KPI Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Courses</span>
            <BookOpen className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.totalCourses}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Authoring &amp; teaching</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Learners</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.totalStudents}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Across all classrooms</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Evaluations</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.totalQuizzes + metrics.totalAssignments}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {metrics.totalQuizzes} quizzes • {metrics.totalAssignments} tasks
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Syllabus Topics</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.totalLessons}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Delivered &amp; scheduled</p>
        </div>
      </div>

      {/* Search & Filtering Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search course title, code..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Departments ({courses.length})</option>
            {distinctSubjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-end md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            title="Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md transition ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            title="Table View"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Courses Display */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading your course studio...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No courses match your filter</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Try adjusting your search query, or publish a new course to get started.
          </p>
          <Link
            to="/teacher/courses/create"
            className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Create Course
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all group"
            >
              <div>
                {/* Visual Banner */}
                <div className="h-40 w-full bg-slate-100 relative overflow-hidden">
                  <img
                    src={course.banner_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600'}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                  {/* Top Tags */}
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={course.status} size="sm" />
                  </div>
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-900/90 text-white border border-white/20 uppercase tracking-wider font-mono shadow-xs">
                      {course.subject_code || 'CRS'}
                    </span>
                  </div>

                  {/* Bottom overlay pill */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px]">
                    <span className="font-semibold truncate max-w-[200px] text-slate-200">
                      {course.subject_name || 'Academic Course'}
                    </span>
                    <button
                      onClick={() => openStudentRoster(course)}
                      className="px-2 py-0.5 rounded bg-black/50 hover:bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white border border-white/20 flex items-center gap-1 transition"
                    >
                      <Users className="w-3 h-3 text-indigo-400" />
                      <span>{course.student_count || 0} Learners</span>
                    </button>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-5">
                  <Link
                    to={`/teacher/analytics?courseId=${course.id}&tab=syllabus`}
                    className="block group/title"
                  >
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover/title:text-brand-600 transition">
                      {course.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {course.description || 'Comprehensive curriculum syllabus and interactive materials.'}
                  </p>

                  {/* Course Metrics Stats Pill */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <span className="block font-black text-slate-900">{course.lesson_count || 0}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Lessons</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <span className="block font-black text-slate-900">{course.quiz_count || 0}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Quizzes</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <span className="block font-black text-slate-900">{course.assignment_count || 0}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Tasks</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Complete Course Feature Access Bar */}
              <div className="p-4 pt-0 space-y-2.5">
                {/* Secondary Row: Quick Course Feature Jumpers */}
                <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-slate-50 rounded-xl border border-slate-100">
                  <Link
                    to={`/teacher/attendance?courseId=${course.id}`}
                    className="p-1.5 rounded-lg text-center hover:bg-white hover:text-brand-600 hover:shadow-xs transition group/btn"
                    title="Take or inspect attendance"
                  >
                    <CalendarCheck2 className="w-3.5 h-3.5 mx-auto text-slate-500 group-hover/btn:text-brand-600" />
                    <span className="text-[9px] font-bold text-slate-600 block mt-0.5 truncate">Attendance</span>
                  </Link>

                  <Link
                    to={`/teacher/analytics?courseId=${course.id}`}
                    className="p-1.5 rounded-lg text-center hover:bg-white hover:text-indigo-600 hover:shadow-xs transition group/btn"
                    title="View syllabus roadmap & class analytics"
                  >
                    <BarChart3 className="w-3.5 h-3.5 mx-auto text-slate-500 group-hover/btn:text-indigo-600" />
                    <span className="text-[9px] font-bold text-slate-600 block mt-0.5 truncate">Analytics</span>
                  </Link>

                  <Link
                    to={`/teacher/gradebook?courseId=${course.id}`}
                    className="p-1.5 rounded-lg text-center hover:bg-white hover:text-emerald-600 hover:shadow-xs transition group/btn"
                    title="Check student marks and performance"
                  >
                    <FileCheck2 className="w-3.5 h-3.5 mx-auto text-slate-500 group-hover/btn:text-emerald-600" />
                    <span className="text-[9px] font-bold text-slate-600 block mt-0.5 truncate">Gradebook</span>
                  </Link>

                  <button
                    onClick={() => openStudentRoster(course)}
                    className="p-1.5 rounded-lg text-center hover:bg-white hover:text-blue-600 hover:shadow-xs transition group/btn"
                    title="Manage enrolled students"
                  >
                    <Users className="w-3.5 h-3.5 mx-auto text-slate-500 group-hover/btn:text-blue-600" />
                    <span className="text-[9px] font-bold text-slate-600 block mt-0.5 truncate">Students</span>
                  </button>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2">
                  <Link
                    to={`/teacher/analytics?courseId=${course.id}&tab=syllabus`}
                    className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <span>Curriculum Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Subject Track</th>
                  <th className="py-3 px-4 text-center">Enrolled</th>
                  <th className="py-3 px-4 text-center">Lessons</th>
                  <th className="py-3 px-4 text-center">Quizzes</th>
                  <th className="py-3 px-4 text-center">Tasks</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Quick Features</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.banner_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600'}
                          alt={c.title}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/teacher/analytics?courseId=${c.id}&tab=syllabus`}
                            className="font-bold text-slate-900 hover:text-brand-600 block truncate"
                          >
                            {c.title}
                          </Link>
                          <span className="text-[10px] font-mono text-slate-400">{c.subject_code || 'CRS'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {c.subject_name || 'General Studies'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => openStudentRoster(c)}
                        className="font-black text-indigo-600 hover:underline"
                      >
                        {c.student_count || 0}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {c.lesson_count || 0}
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {c.quiz_count || 0}
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {c.assignment_count || 0}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={c.status} size="sm" />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/teacher/attendance?courseId=${c.id}`}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                          title="Attendance"
                        >
                          <CalendarCheck2 className="w-3.5 h-3.5 text-blue-600" />
                        </Link>

                        <Link
                          to={`/teacher/analytics?courseId=${c.id}`}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                          title="Analytics & Roadmap"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                        </Link>

                        <Link
                          to={`/teacher/gradebook?courseId=${c.id}`}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                          title="Gradebook"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                        </Link>

                        <button
                          onClick={() => openStudentRoster(c)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                          title="Manage Roster"
                        >
                          <Users className="w-3.5 h-3.5 text-purple-600" />
                        </button>

                        <Link
                          to={`/teacher/analytics?courseId=${c.id}&tab=syllabus`}
                          className="p-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition"
                          title="Curriculum Studio & Syllabus Roadmap"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Roster Modal */}
      {activeRosterCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{activeRosterCourse.title}</h3>
                  <p className="text-xs text-slate-400">
                    Enrolled Students Roster ({rosterStudents.length} total learners)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveRosterCourse(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Teacher Enroll Box */}
              <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                    Enroll Student into Class
                  </h4>
                  <p className="text-[11px] text-indigo-800/80 mt-0.5">
                    Grant immediate course and curriculum access to learners.
                  </p>
                </div>

                <form onSubmit={handleEnrollStudent} className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 min-w-[200px]"
                  >
                    <option value="">Select Student...</option>
                    {availableStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.student_id || s.email})
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    disabled={submittingEnroll || !selectedStudentId}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 whitespace-nowrap"
                  >
                    {submittingEnroll ? 'Enrolling...' : 'Enroll'}
                  </button>
                </form>
              </div>

              {/* Roster Search & Table */}
              <div className="space-y-3">
                <div className="relative max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search enrolled students..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {rosterLoading ? (
                  <div className="py-8 text-center text-xs text-slate-500">Loading student roster...</div>
                ) : filteredRosterStudents.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                    No enrolled students found.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                          <th className="py-2.5 px-4">Learner</th>
                          <th className="py-2.5 px-4">Roll Code</th>
                          <th className="py-2.5 px-4">Department</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredRosterStudents.map((st) => (
                          <tr key={st.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={
                                    st.avatar_url ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(st.full_name)}&background=2563eb&color=fff`
                                  }
                                  alt={st.full_name}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                />
                                <div>
                                  <span className="font-bold text-slate-900 block">{st.full_name}</span>
                                  <span className="text-[10px] text-slate-400 block">{st.email}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-2.5 px-4 font-mono text-slate-600 text-[11px] font-semibold">
                              {st.student_id || 'CS-2026'}
                            </td>

                            <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                              {st.department || 'General'}
                            </td>

                            <td className="py-2.5 px-4 text-right">
                              <button
                                onClick={() => handleUnenrollStudent(st.id)}
                                className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
