import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  ArrowRight,
  CheckCircle2,
  User,
  Sparkles,
  FileText,
  HelpCircle,
  CalendarCheck2,
  Bot,
  BarChart3,
  Filter,
  X,
  Layers,
  GraduationCap,
  Clock,
  Compass,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Course, Subject } from '../../types';

export const StudentCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'progress' | 'alpha'>('recent');
  const [activeTab, setActiveTab] = useState<'my' | 'explore'>('my');
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const fetchCourses = () => {
    setLoading(true);
    Promise.all([
      api.getMyCourses().catch(() => []),
      api.getCourses().catch(() => []),
      api.getSubjects().catch(() => []),
    ]).then(([my, all, subs]) => {
      setCourses(Array.isArray(my) ? my : []);
      setAllCourses(Array.isArray(all) ? all : []);
      setSubjects(Array.isArray(subs) ? subs : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId);
    try {
      await api.enrollCourse(courseId);
      await fetchCourses();
      setActiveTab('my');
    } catch (err: any) {
      alert(err.message || 'Enrollment failed. Please try again.');
    } finally {
      setEnrollingId(null);
    }
  };

  // Distinct subjects available across courses
  const availableSubjects = useMemo(() => {
    if (subjects.length > 0) return subjects;
    const map = new Map<string, string>();
    allCourses.forEach((c) => {
      if (c.subject_id && c.subject_name) {
        map.set(c.subject_id, c.subject_name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({
      id,
      name,
      code: '',
      status: 'active',
    })) as Subject[];
  }, [subjects, allCourses]);

  // Enrolled course KPIs
  const metrics = useMemo(() => {
    const totalEnrolled = courses.length;
    const totalLessons = courses.reduce(
      (sum, c) => sum + (c.lesson_count || (c as any).total_lessons || 0),
      0
    );
    const totalAssignments = courses.reduce((sum, c) => sum + (c.assignment_count || 0), 0);
    const totalQuizzes = courses.reduce((sum, c) => sum + (c.quiz_count || 0), 0);
    const avgProgress =
      totalEnrolled > 0
        ? Math.round(courses.reduce((sum, c) => sum + (c.progress_pct || 0), 0) / totalEnrolled)
        : 0;
    return { totalEnrolled, totalLessons, totalAssignments, totalQuizzes, avgProgress };
  }, [courses]);

  // Current list based on active tab
  const currentList = activeTab === 'my' ? courses : allCourses;

  // Filtered & sorted courses
  const filteredCourses = useMemo(() => {
    return currentList
      .filter((c) => {
        if (subjectFilter !== 'all' && c.subject_id !== subjectFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchesTitle = c.title?.toLowerCase().includes(q);
          const matchesDesc = c.description?.toLowerCase().includes(q);
          const matchesTeacher = c.teacher_name?.toLowerCase().includes(q);
          const matchesSubject =
            c.subject_name?.toLowerCase().includes(q) ||
            c.subject_code?.toLowerCase().includes(q);
          return matchesTitle || matchesDesc || matchesTeacher || matchesSubject;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'progress') {
          return (b.progress_pct || 0) - (a.progress_pct || 0);
        }
        if (sortBy === 'alpha') {
          return a.title.localeCompare(b.title);
        }
        return 0; // 'recent' maintains server order
      });
  }, [currentList, subjectFilter, search, sortBy]);

  const enrolledIdSet = useMemo(() => new Set(courses.map((c) => c.id)), [courses]);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200/60 uppercase tracking-wider">
              Student Workspace
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Academic Curriculum</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            Course Studio &amp; Learning Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Access your course syllabi, teacher lectures, assignments, quizzes, and attendance records.
          </p>
        </div>

        {/* Global Quick Module Jumpers */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/student/assignments"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <FileText className="w-3.5 h-3.5 text-brand-600" />
            <span>Assignments</span>
          </Link>

          <Link
            to="/student/attendance"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <CalendarCheck2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Attendance</span>
          </Link>

          <Link
            to="/student/ai-assistant"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Bot className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Tutor</span>
          </Link>

          <Link
            to="/student/progress"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Progress</span>
          </Link>
        </div>
      </div>

      {/* KPI Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Enrolled Courses
            </span>
            <BookOpen className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.totalEnrolled}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Active curriculum tracks</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Syllabus Lessons
            </span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.totalLessons}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Topics across subjects</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Assessments
            </span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {metrics.totalAssignments + metrics.totalQuizzes}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {metrics.totalAssignments} tasks • {metrics.totalQuizzes} quizzes
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Avg. Completion
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.avgProgress}%</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Overall learning pace</p>
        </div>
      </div>

      {/* Navigation Tabs & Search/Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs w-full md:w-auto">
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'my'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-brand-600" />
            <span>My Enrolled</span>
            <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-mono">
              {courses.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'explore'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-indigo-600" />
            <span>Explore Catalog</span>
            <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-mono">
              {allCourses.length}
            </span>
          </button>
        </div>

        {/* Right: Search, Subject, and Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search course title, code, teacher..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Department / Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Departments</option>
            {availableSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Sort By Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          >
            <option value="recent">Recently Enrolled</option>
            <option value="progress">Highest Progress</option>
            <option value="alpha">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Courses Display Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading courses curriculum...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {activeTab === 'my' ? 'No Enrolled Courses Found' : 'No Courses Found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {activeTab === 'my'
              ? "You haven't enrolled in any courses matching your search criteria. Discover courses in the Explore Catalog tab."
              : 'No courses match your filter parameters. Try clearing the search query or selecting another department.'}
          </p>
          {activeTab === 'my' ? (
            <button
              onClick={() => {
                setActiveTab('explore');
                setSearch('');
                setSubjectFilter('all');
              }}
              className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4" /> Explore Course Catalog
            </button>
          ) : (
            <button
              onClick={() => {
                setSearch('');
                setSubjectFilter('all');
              }}
              className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledIdSet.has(course.id);
            const totalLessons = course.lesson_count || (course as any).total_lessons || 0;
            const completedLessons = (course as any).completed_lessons || 0;
            const progressPct = course.progress_pct || 0;

            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Visual Banner */}
                  <div className="h-40 w-full bg-slate-100 relative overflow-hidden">
                    <img
                      src={
                        course.banner_url ||
                        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600'
                      }
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-900/90 text-white border border-white/20 uppercase tracking-wider font-mono shadow-xs">
                        {course.subject_code || 'CRS'}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      {isEnrolled ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/90 text-white backdrop-blur-xs flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3 h-3" /> Enrolled
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/80 text-white backdrop-blur-xs">
                          Available
                        </span>
                      )}
                    </div>

                    {/* Bottom Subject Pill */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px]">
                      <span className="font-semibold truncate max-w-[220px] text-slate-200">
                        {course.subject_name || 'Academic Course'}
                      </span>
                      {isEnrolled && (
                        <span className="text-[10px] font-bold text-brand-300 font-mono">
                          {progressPct}% Finished
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <Link
                      to={`/student/courses/${course.id}`}
                      className="block group/title"
                    >
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover/title:text-brand-600 transition">
                        {course.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {course.description ||
                        'Comprehensive syllabus curriculum with hands-on lesson modules, tasks, and quizzes.'}
                    </p>

                    {/* Instructor Details */}
                    <div className="mt-3.5 flex items-center gap-2.5 text-xs text-slate-600">
                      <img
                        src={
                          course.teacher_avatar ||
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
                        }
                        alt={course.teacher_name || 'Instructor'}
                        className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="truncate font-semibold block text-slate-800 text-[11px]">
                          {course.teacher_name || 'Faculty Instructor'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar (if enrolled) */}
                    {isEnrolled ? (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                          <span>Syllabus Progress</span>
                          <span className="text-brand-600">
                            {completedLessons}/{totalLessons} Lessons
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-brand-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Curriculum Scope Pills for Explore View */
                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                          <span className="block font-black text-slate-900">
                            {totalLessons}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">Lessons</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                          <span className="block font-black text-slate-900">
                            {course.assignment_count || 0}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">Tasks</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                          <span className="block font-black text-slate-900">
                            {course.quiz_count || 0}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">Quizzes</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Course Action & Feature Navigation Bar */}
                <div className="p-4 pt-0 space-y-2.5">
                  {/* Quick Feature Jumpers for Enrolled Course */}
                  {isEnrolled && (
                    <div className="grid grid-cols-4 gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <Link
                        to={`/student/courses/${course.id}?tab=content`}
                        className="p-1 rounded-lg hover:bg-white hover:text-brand-600 hover:shadow-xs transition"
                        title="View Course Syllabus & Lessons"
                      >
                        <BookOpen className="w-3.5 h-3.5 mx-auto text-slate-500 hover:text-brand-600" />
                        <span className="text-[9px] font-bold text-slate-600 block mt-0.5 truncate">
                          Lessons
                        </span>
                      </Link>

                      <Link
                        to={`/student/courses/${course.id}?tab=assignments`}
                        className="p-1 rounded-lg hover:bg-white hover:text-brand-600 hover:shadow-xs transition"
                        title="View Course Assignments"
                      >
                        <FileText className="w-3.5 h-3.5 mx-auto text-slate-500 hover:text-brand-600" />
                        <span className="text-[9px] font-bold text-slate-600 block mt-0.5 truncate">
                          Tasks ({course.assignment_count || 0})
                        </span>
                      </Link>

                      <Link
                        to={`/student/courses/${course.id}?tab=quizzes`}
                        className="p-1 rounded-lg hover:bg-white hover:text-indigo-600 hover:shadow-xs transition"
                        title="View Course Quizzes"
                      >
                        <HelpCircle className="w-3.5 h-3.5 mx-auto text-slate-500 hover:text-indigo-600" />
                        <span className="text-[9px] font-bold text-slate-600 block mt-0.5 truncate">
                          Quizzes ({course.quiz_count || 0})
                        </span>
                      </Link>

                      <Link
                        to={`/student/courses/${course.id}?tab=attendance`}
                        className="p-1 rounded-lg hover:bg-white hover:text-emerald-600 hover:shadow-xs transition"
                        title="View Course Attendance"
                      >
                        <CalendarCheck2 className="w-3.5 h-3.5 mx-auto text-slate-500 hover:text-emerald-600" />
                        <span className="text-[9px] font-bold text-slate-600 block mt-0.5 truncate">
                          Attendance
                        </span>
                      </Link>
                    </div>
                  )}

                  {/* Primary CTA */}
                  {isEnrolled ? (
                    <Link
                      to={`/student/courses/${course.id}`}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <span>Continue Learning</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrollingId === course.id}
                      className="w-full py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      {enrollingId === course.id ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Enrolling...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Enroll in Course</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
