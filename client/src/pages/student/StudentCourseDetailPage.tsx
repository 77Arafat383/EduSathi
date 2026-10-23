import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
  Bell,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Send,
  CalendarCheck2,
  Bot,
  BarChart3,
  Download,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  User,
  Award,
  Layers,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Course, Lesson, Comment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

export const StudentCourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tabParam = searchParams.get('tab') as
    | 'content'
    | 'assignments'
    | 'quizzes'
    | 'attendance'
    | 'announcements'
    | 'doubts'
    | null;

  const [activeTab, setActiveTab] = useState<
    'content' | 'assignments' | 'quizzes' | 'attendance' | 'announcements' | 'doubts'
  >(tabParam || 'content');

  const [course, setCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [markingLesson, setMarkingLesson] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);

  // Sync tab with URL
  const handleTabChange = (
    tab: 'content' | 'assignments' | 'quizzes' | 'attendance' | 'announcements' | 'doubts'
  ) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const fetchCourseData = () => {
    if (!courseId) return;
    setLoading(true);
    api
      .getCourse(courseId)
      .then((data) => {
        setCourse(data);
        const done = data.completed_lesson_ids || [];
        setCompletedLessons(done);

        // Pick first lesson if none selected
        if (
          !selectedLesson &&
          data.modules &&
          data.modules.length > 0 &&
          data.modules[0].lessons &&
          data.modules[0].lessons.length > 0
        ) {
          setSelectedLesson(data.modules[0].lessons[0]);
        }
      })
      .finally(() => setLoading(false));

    api
      .getComments({ course_id: courseId })
      .then(setComments)
      .catch(() => []);
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  // Flatten all lessons across modules for chronological navigation
  const flattenedLessons = useMemo(() => {
    if (!course?.modules) return [];
    const list: { lesson: Lesson; moduleTitle: string; modIndex: number; lessonIndex: number }[] = [];
    course.modules.forEach((mod, mIdx) => {
      (mod.lessons || []).forEach((les, lIdx) => {
        list.push({
          lesson: les,
          moduleTitle: mod.title,
          modIndex: mIdx + 1,
          lessonIndex: lIdx + 1,
        });
      });
    });
    return list;
  }, [course]);

  // Current lesson navigation indices
  const currentNavIndex = useMemo(() => {
    if (!selectedLesson) return -1;
    return flattenedLessons.findIndex((item) => item.lesson.id === selectedLesson.id);
  }, [flattenedLessons, selectedLesson]);

  const currentNavMeta = currentNavIndex >= 0 ? flattenedLessons[currentNavIndex] : null;
  const prevLesson = currentNavIndex > 0 ? flattenedLessons[currentNavIndex - 1]?.lesson : null;
  const nextLesson =
    currentNavIndex >= 0 && currentNavIndex < flattenedLessons.length - 1
      ? flattenedLessons[currentNavIndex + 1]?.lesson
      : null;

  const handleMarkComplete = async (lessonId: string) => {
    if (markingLesson) return;
    setMarkingLesson(true);
    try {
      await api.markLessonProgress(lessonId);
      setCompletedLessons((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]));
    } catch (err: any) {
      alert(err.message || 'Failed to update progress');
    } finally {
      setMarkingLesson(false);
    }
  };

  const handleLiveCheckIn = async (sessionId: string) => {
    setCheckingIn(true);
    setCheckInMessage(null);
    try {
      const res = await api.studentCheckIn(sessionId);
      setCheckInMessage(res.message || 'Checked in successfully! Marked Present.');
      fetchCourseData();
    } catch (err: any) {
      alert(err.message || 'Failed to check in for attendance.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !courseId) return;

    try {
      const created = await api.createComment({
        course_id: courseId,
        body: newComment.trim(),
      });
      setComments((prev) => [...prev, created]);
      setNewComment('');
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading course workspace &amp; curriculum...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-24 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Course Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested course could not be located or you may not have access.</p>
        <Link
          to="/student/courses"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Enrolled Courses
        </Link>
      </div>
    );
  }

  const totalLessonsCount = flattenedLessons.length;
  const completedLessonsCount = completedLessons.length;
  const progressPercent =
    totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;

  const attendance = (course as any).attendance_summary;

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Return Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/student/courses"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Courses</span>
        </Link>

        {/* Global Module Jumpers */}
        <div className="hidden sm:flex items-center gap-2">
          <Link
            to={`/student/attendance?courseId=${course.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg shadow-xs transition"
          >
            <CalendarCheck2 className="w-3 h-3 text-blue-600" />
            <span>Attendance Tracker</span>
          </Link>

          <Link
            to="/student/assignments"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg shadow-xs transition"
          >
            <FileText className="w-3 h-3 text-brand-600" />
            <span>All Tasks</span>
          </Link>

          <Link
            to="/student/ai-assistant"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg shadow-xs transition"
          >
            <Bot className="w-3 h-3 text-purple-600" />
            <span>AI Tutor</span>
          </Link>
        </div>
      </div>

      {/* Course Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Course Metadata */}
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-slate-900 text-white uppercase tracking-wider font-mono shadow-xs">
                {course.subject_code || 'CRS'}
              </span>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200/70">
                {course.subject_name || 'Academic Curriculum'}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-500">
                {course.student_count || 1} Enrolled Learners
              </span>
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{course.title}</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              {course.description ||
                'Comprehensive academic course syllabus containing scheduled modules, lecture materials, assignments, and assessments.'}
            </p>
          </div>

          {/* Instructor & Overall Progress Snapshot */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 shrink-0">
            {/* Faculty Instructor Info */}
            <div className="flex items-center gap-3">
              <img
                src={
                  course.teacher_avatar ||
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
                }
                alt={course.teacher_name || 'Instructor'}
                className="w-11 h-11 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0"
              />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Course Instructor
                </span>
                <span className="text-xs font-bold text-slate-900 block">
                  {course.teacher_name || 'Faculty Instructor'}
                </span>
                {course.teacher_email && (
                  <span className="text-[11px] text-slate-400 block font-mono">
                    {course.teacher_email}
                  </span>
                )}
              </div>
            </div>

            {/* Course Progress Mini Bar */}
            <div className="w-full sm:w-48 lg:w-48 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                <span>Course Progress</span>
                <span className="text-brand-600 font-mono">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-1 text-right font-medium">
                {completedLessonsCount} of {totalLessonsCount} Lessons Done
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto text-xs font-bold pb-px">
        <button
          onClick={() => handleTabChange('content')}
          className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'content'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Syllabus &amp; Lessons</span>
          <span className="px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px] font-mono text-slate-600">
            {totalLessonsCount}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('assignments')}
          className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'assignments'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Assignments</span>
          <span className="px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px] font-mono text-slate-600">
            {course.assignments?.length || 0}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('quizzes')}
          className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'quizzes'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Quizzes</span>
          <span className="px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px] font-mono text-slate-600">
            {course.quizzes?.length || 0}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('attendance')}
          className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck2 className="w-4 h-4" />
          <span>Attendance</span>
          {attendance && (
            <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-[10px] font-mono">
              {attendance.attendance_pct}%
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('announcements')}
          className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'announcements'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Announcements</span>
          <span className="px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px] font-mono text-slate-600">
            {course.announcements?.length || 0}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('doubts')}
          className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'doubts'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Doubts &amp; Discussion</span>
          <span className="px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px] font-mono text-slate-600">
            {comments.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SYLLABUS & LESSONS READER                                          */}
      {/* ========================================================================= */}
      {activeTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Modules & Topics Navigator */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Course Syllabus
              </span>
              <span className="text-[11px] font-bold text-brand-600 font-mono">
                {completedLessonsCount}/{totalLessonsCount} Completed
              </span>
            </div>

            {(!course.modules || course.modules.length === 0) ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No modules published for this course syllabus yet.
              </div>
            ) : (
              <div className="space-y-4">
                {course.modules.map((mod, mIdx) => {
                  const modLessons = mod.lessons || [];
                  const modDoneCount = modLessons.filter((l) => completedLessons.includes(l.id)).length;

                  return (
                    <div key={mod.id} className="space-y-1.5">
                      <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-lg">
                        <span className="text-xs font-bold text-slate-800 line-clamp-1">
                          {mod.title}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 font-mono shrink-0 ml-2">
                          {modDoneCount}/{modLessons.length}
                        </span>
                      </div>

                      <div className="space-y-1 pl-1">
                        {modLessons.map((les, lIdx) => {
                          const isDone = completedLessons.includes(les.id);
                          const isSelected = selectedLesson?.id === les.id;

                          return (
                            <button
                              key={les.id}
                              onClick={() => setSelectedLesson(les)}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                                isSelected
                                  ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200/80 shadow-xs'
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                  {mIdx + 1}.{lIdx + 1}
                                </span>
                                <span className="truncate">{les.title}</span>
                              </div>

                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Active Lesson Content Viewer */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
            {selectedLesson ? (
              <div className="space-y-6">
                {/* Lesson Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    {currentNavMeta && (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Module {currentNavMeta.modIndex}: {currentNavMeta.moduleTitle}
                      </span>
                    )}
                    <h2 className="text-xl font-black text-slate-900 mt-1">
                      {selectedLesson.title}
                    </h2>
                    {selectedLesson.published_at && (
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Published on {new Date(selectedLesson.published_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Mark as Complete Action */}
                  <div>
                    {completedLessons.includes(selectedLesson.id) ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Lesson Completed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkComplete(selectedLesson.id)}
                        disabled={markingLesson}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{markingLesson ? 'Saving...' : 'Mark as Complete'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Lesson Body Content */}
                <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedLesson.content ||
                    'The instructor has not added detailed lecture notes for this topic yet.'}
                </div>

                {/* Navigation Between Lessons */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                  {prevLesson ? (
                    <button
                      onClick={() => setSelectedLesson(prevLesson)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="truncate max-w-[150px] sm:max-w-xs">{prevLesson.title}</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {currentNavIndex >= 0 && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      Lesson {currentNavIndex + 1} of {flattenedLessons.length}
                    </span>
                  )}

                  {nextLesson ? (
                    <button
                      onClick={() => setSelectedLesson(nextLesson)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                    >
                      <span className="truncate max-w-[150px] sm:max-w-xs">{nextLesson.title}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-xs text-slate-400">
                Select a lesson from the syllabus navigator on the left to begin reading.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COURSE ASSIGNMENTS (WHAT TEACHER PROVIDED & ATTACHED)              */}
      {/* ========================================================================= */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Course Assignments &amp; Tasks</h2>
              <p className="text-xs text-slate-500">
                Review instructor problem statements, download attached documents, and submit your responses.
              </p>
            </div>
            <Link
              to="/student/assignments"
              className="text-xs font-bold text-brand-600 hover:underline inline-flex items-center gap-1"
            >
              <span>View In Full Tasks Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {(!course.assignments || course.assignments.length === 0) ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Assignments Yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your instructor has not published any coursework tasks for this course.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {course.assignments.map((asg: any) => {
                const hasSubmitted = Boolean(asg.submission_id || asg.submission_status);
                const isGraded = typeof asg.grade_score === 'number';

                return (
                  <div
                    key={asg.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
                  >
                    <div>
                      {/* Top Chips */}
                      <div className="flex items-center justify-between gap-2 pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {asg.max_score} Total Points
                        </span>

                        {isGraded ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Award className="w-3 h-3" /> Graded: {asg.grade_score}/{asg.max_score}
                          </span>
                        ) : hasSubmitted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <CheckCircle2 className="w-3 h-3" /> Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> Pending Submission
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mt-1">{asg.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                        {asg.instructions}
                      </p>

                      {/* Teacher's Attached Resource / Document */}
                      {asg.file_url && (
                        <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                                Teacher Attached Brief
                              </span>
                              <span className="text-xs font-semibold text-slate-800 truncate block">
                                {asg.file_name || 'Assignment-Brief.pdf'}
                              </span>
                            </div>
                          </div>
                          <a
                            href={asg.file_url}
                            download={asg.file_name || 'Assignment-Document'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition inline-flex items-center gap-1 shrink-0 shadow-2xs"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </a>
                        </div>
                      )}

                      {/* Graded Feedback Callout */}
                      {isGraded && asg.grade_feedback && (
                        <div className="mt-3 p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">
                            Teacher Feedback
                          </span>
                          <p className="text-emerald-900 mt-0.5 italic">"{asg.grade_feedback}"</p>
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                        <span>
                          Deadline:{' '}
                          <strong className="text-slate-700">
                            {asg.due_at ? new Date(asg.due_at).toLocaleDateString() : 'Self-Paced'}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <Link
                        to={`/student/assignments/${asg.id}`}
                        className={`w-full py-2 text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 ${
                          hasSubmitted
                            ? 'bg-slate-900 hover:bg-slate-800 text-white'
                            : 'bg-brand-600 hover:bg-brand-700 text-white'
                        }`}
                      >
                        <span>{hasSubmitted ? 'Review Submission' : 'Submit Assignment'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COURSE QUIZZES                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          <div className="pb-2">
            <h2 className="text-base font-bold text-slate-900">Quizzes &amp; Knowledge Checks</h2>
            <p className="text-xs text-slate-500">
              Interactive assessments configured by your instructor for testing syllabus mastery.
            </p>
          </div>

          {(!course.quizzes || course.quizzes.length === 0) ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Quizzes Scheduled</h3>
              <p className="text-xs text-slate-500 mt-1">
                There are no active quizzes or assessments scheduled for this course.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {course.quizzes.map((quiz: any) => {
                const hasAttempted = Boolean(quiz.attempt_id);

                return (
                  <div
                    key={quiz.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          Max Marks: {quiz.max_score}
                        </span>

                        {hasAttempted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Score: {quiz.attempt_score}/
                            {quiz.max_score}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Ready
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mt-1">{quiz.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {quiz.instructions || 'Answer all questions within the allowed duration.'}
                      </p>

                      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                        {quiz.duration_minutes ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{quiz.duration_minutes} Minutes</span>
                          </span>
                        ) : null}
                        <span>
                          Deadline:{' '}
                          <strong className="text-slate-700">
                            {quiz.due_at ? new Date(quiz.due_at).toLocaleDateString() : 'Self-Paced'}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <Link
                        to={`/student/quizzes/${quiz.id}`}
                        className={`w-full py-2 text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 ${
                          hasAttempted
                            ? 'bg-slate-900 hover:bg-slate-800 text-white'
                            : 'bg-brand-600 hover:bg-brand-700 text-white'
                        }`}
                      >
                        <span>{hasAttempted ? 'Review Quiz Results' : 'Take Quiz Assessment'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: COURSE ATTENDANCE                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Live Check-In Alert Banner (if instructor has an active check-in session) */}
          {attendance?.active_session && (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-white shrink-0 animate-pulse">
                  <CalendarCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200">
                    Live Check-In Active
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {attendance.active_session.session_title || 'Class Attendance Session'}
                  </h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Attendance recording is currently live for this course. Check in now before the window closes.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleLiveCheckIn(attendance.active_session.session_id)}
                disabled={checkingIn}
                className="px-5 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold rounded-xl shadow-sm transition shrink-0 flex items-center justify-center gap-1.5"
              >
                {checkingIn ? (
                  <span>Checking in...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Check In Now (Present)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {checkInMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl">
              {checkInMessage}
            </div>
          )}

          {/* Attendance KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Attendance Rate
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {attendance?.attendance_pct || 100}%
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Overall presence ratio</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Sessions Present
              </span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {attendance?.present_count || 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Attended on time</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Late Check-Ins
              </span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {attendance?.late_count || 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">During late window</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Classes Held
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {attendance?.total_sessions || 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Conducted by instructor</p>
            </div>
          </div>

          {/* Attendance Session History */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Course Session Records
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Complete history of class sessions taken by the faculty instructor.
                </p>
              </div>

              <Link
                to={`/student/attendance?courseId=${course.id}`}
                className="text-xs font-bold text-brand-600 hover:underline inline-flex items-center gap-1"
              >
                <span>Full Attendance Heatmap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {(!attendance?.sessions || attendance.sessions.length === 0) ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No attendance sessions recorded for this course yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {attendance.sessions.map((rec: any) => {
                  const status = rec.my_status || 'not_marked';
                  return (
                    <div
                      key={rec.session_id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition"
                    >
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {rec.session_date}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                          {rec.session_title || `Class Session ${rec.session_date}`}
                        </h4>
                      </div>

                      <div>
                        {status === 'present' ? (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Present
                          </span>
                        ) : status === 'late' ? (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Late
                          </span>
                        ) : status === 'absent' ? (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                            Absent
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: COURSE ANNOUNCEMENTS                                               */}
      {/* ========================================================================= */}
      {activeTab === 'announcements' && (
        <div className="space-y-4 max-w-4xl">
          <div className="pb-2">
            <h2 className="text-base font-bold text-slate-900">Faculty Announcements</h2>
            <p className="text-xs text-slate-500">
              Official circulars and notifications broadcast specifically for this course.
            </p>
          </div>

          {(!course.announcements || course.announcements.length === 0) ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Announcements</h3>
              <p className="text-xs text-slate-500 mt-1">
                The instructor has not posted any announcements for this course yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {course.announcements.map((anc: any) => (
                <div
                  key={anc.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          anc.author_avatar ||
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
                        }
                        alt={anc.author_name || 'Author'}
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <span className="font-bold text-slate-800">
                        {anc.author_name || 'Faculty Instructor'}
                      </span>
                    </div>
                    <span className="font-mono text-[11px]">
                      {new Date(anc.published_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{anc.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {anc.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: DOUBTS & DISCUSSION                                                */}
      {/* ========================================================================= */}
      {activeTab === 'doubts' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs max-w-4xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Course Doubts &amp; Discussion</h2>
            <p className="text-xs text-slate-500">
              Raise doubts or ask academic questions. The course instructor and peers will respond here.
            </p>
          </div>

          <form onSubmit={handlePostComment} className="flex gap-2">
            <input
              type="text"
              required
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ask a question or raise a doubt about this course..."
              className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50 focus:bg-white"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post Question</span>
            </button>
          </form>

          <div className="space-y-3 pt-2">
            {comments.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No discussion threads yet. Be the first to ask a question!
              </div>
            ) : (
              comments.map((cmt) => (
                <div key={cmt.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{cmt.author_name}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          cmt.author_role === 'teacher'
                            ? 'bg-brand-100 text-brand-800 font-bold'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {cmt.author_role}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(cmt.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{cmt.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
