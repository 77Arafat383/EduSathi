import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Users,
  Award,
  CalendarCheck2,
  FileCheck2,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Edit3,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  TrendingUp,
  GraduationCap,
  Sparkles,
  BarChart3,
  RefreshCw,
  FileText,
  AlertCircle
} from 'lucide-react';
import { api } from '../../lib/api';
import { StatusBadge } from '../../components/common/StatusBadge';

interface CourseItem {
  id: string;
  title: string;
  description?: string;
  subject_name?: string;
  subject_code?: string;
  banner_url?: string;
  student_count?: number;
  assignment_count?: number;
  quiz_count?: number;
  lesson_count?: number;
}

interface StudentPerformance {
  student_id: string;
  full_name: string;
  student_code: string;
  email: string;
  avatar_url?: string;
  department?: string;
  enrollment_id: string;
  enrolled_at: string;

  // Summary KPIs
  overall_pct: number;
  grade_letter: string;
  performance_tier: 'top_performer' | 'on_track' | 'needs_attention' | 'at_risk';
  progress_pct: number;
  completed_lessons: number;
  total_lessons: number;

  assignment_avg_pct: number;
  submitted_assignments: number;
  graded_assignments: number;
  total_assignments: number;
  assignments_breakdown: Array<{
    assignment_id: string;
    title: string;
    max_score: number;
    due_at: string | null;
    submission_id: string | null;
    submitted_at: string | null;
    status: 'graded' | 'submitted' | 'missing';
    content: string | null;
    file_url: string | null;
    score: number | null;
    score_pct: number | null;
    feedback: string | null;
    released_at: string | null;
  }>;

  quiz_avg_pct: number;
  attempted_quizzes: number;
  total_quizzes: number;
  quizzes_breakdown: Array<{
    quiz_id: string;
    title: string;
    max_score: number;
    due_at: string | null;
    attempt_id: string | null;
    submitted_at: string | null;
    status: 'completed' | 'unattempted';
    score: number | null;
    score_pct: number | null;
  }>;

  attendance_pct: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  unmarked_count: number;
  total_sessions: number;
  attendance_breakdown: Array<{
    session_id: string;
    session_date: string;
    session_title: string;
    status: 'present' | 'late' | 'absent' | 'unmarked';
  }>;
}

interface CoursePerformanceData {
  course: {
    id: string;
    title: string;
    description: string;
    subject_name?: string;
    subject_code?: string;
    banner_url?: string;
    total_lessons: number;
    total_assignments: number;
    total_quizzes: number;
    total_sessions: number;
  };
  summary: {
    total_enrolled: number;
    class_avg_overall_pct: number;
    class_avg_assignment_pct: number;
    class_avg_quiz_pct: number;
    class_avg_attendance_pct: number;
    class_avg_progress_pct: number;
    top_performers_count: number;
    at_risk_count: number;
    needs_attention_count: number;
  };
  students: StudentPerformance[];
}

export const TeacherGradebookPage: React.FC = () => {
  // Course listing state
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Performance data state
  const [perfData, setPerfData] = useState<CoursePerformanceData | null>(null);
  const [loadingPerf, setLoadingPerf] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected student for detailed expansion/view
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [activeStudentTab, setActiveStudentTab] = useState<'assignments' | 'quizzes' | 'attendance' | 'syllabus'>('assignments');

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'top_performer' | 'on_track' | 'needs_attention' | 'at_risk'>('all');
  const [sortBy, setSortBy] = useState<'overall_desc' | 'overall_asc' | 'attendance_desc' | 'attendance_asc' | 'assignment_desc' | 'quiz_desc' | 'name_asc'>('overall_desc');

  // Grading modal state
  const [gradingModalData, setGradingModalData] = useState<{
    submission_id: string;
    assignment_title: string;
    student_name: string;
    max_score: number;
    current_score: number;
    feedback: string;
    content: string | null;
    file_url: string | null;
  } | null>(null);
  const [gradeInputScore, setGradeInputScore] = useState<number>(0);
  const [gradeInputFeedback, setGradeInputFeedback] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState(false);

  // 1. Fetch teacher's courses
  const fetchTeacherCourses = () => {
    setLoadingCourses(true);
    api.getMyCourses()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setCourses(list);
        if (list.length > 0) {
          // If no course is selected yet or selected course is not in list, select first
          if (!selectedCourseId || !list.some(c => c.id === selectedCourseId)) {
            setSelectedCourseId(list[0].id);
          }
        } else {
          // Fallback to all courses if teacher is admin or none returned
          api.getCourses()
            .then((all) => {
              const allList = Array.isArray(all) ? all : [];
              setCourses(allList);
              if (allList.length > 0) setSelectedCourseId(allList[0].id);
            })
            .catch(() => { });
        }
      })
      .catch((err) => {
        console.error('Failed to load courses', err);
        setErrorMsg('Could not load course list');
      })
      .finally(() => setLoadingCourses(false));
  };

  useEffect(() => {
    fetchTeacherCourses();
  }, []);

  // 2. Fetch selected course performance data
  const fetchPerformanceData = (courseId: string) => {
    if (!courseId) return;
    setLoadingPerf(true);
    setErrorMsg(null);
    api.getCourseStudentsPerformance(courseId)
      .then((res) => {
        if (res && res.course) {
          setPerfData(res);
          // If there are students, auto-expand the first student if none selected
          if (res.students && res.students.length > 0 && !expandedStudentId) {
            setExpandedStudentId(res.students[0].student_id);
          }
        } else {
          setPerfData(null);
        }
      })
      .catch((err: any) => {
        console.error('Failed to load course performance', err);
        setErrorMsg(err.message || 'Failed to load student performance data');
        setPerfData(null);
      })
      .finally(() => setLoadingPerf(false));
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchPerformanceData(selectedCourseId);
    }
  }, [selectedCourseId]);

  // Open inline grading modal
  const handleOpenGradeModal = (
    submissionId: string,
    assignmentTitle: string,
    studentName: string,
    maxScore: number,
    currentScore: number | null,
    feedback: string | null,
    content: string | null,
    fileUrl: string | null
  ) => {
    setGradingModalData({
      submission_id: submissionId,
      assignment_title: assignmentTitle,
      student_name: studentName,
      max_score: maxScore,
      current_score: currentScore !== null ? currentScore : maxScore,
      feedback: feedback || '',
      content,
      file_url: fileUrl,
    });
    setGradeInputScore(currentScore !== null ? currentScore : maxScore);
    setGradeInputFeedback(feedback || '');
  };

  // Submit grade and refresh
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingModalData) return;
    setSavingGrade(true);

    try {
      await api.gradeSubmission(gradingModalData.submission_id, {
        score: Number(gradeInputScore),
        feedback: gradeInputFeedback,
      });
      setGradingModalData(null);
      // Refresh current course performance data
      if (selectedCourseId) {
        fetchPerformanceData(selectedCourseId);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save grade');
    } finally {
      setSavingGrade(false);
    }
  };

  // Filtered and sorted students
  const filteredStudents = useMemo(() => {
    if (!perfData?.students) return [];

    let list = [...perfData.students];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((s) =>
        s.full_name.toLowerCase().includes(q) ||
        (s.student_code && s.student_code.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q))
      );
    }

    // Status / Performance filter
    if (statusFilter !== 'all') {
      list = list.filter((s) => s.performance_tier === statusFilter);
    }

    // Sorting
    list.sort((a, b) => {
      switch (sortBy) {
        case 'overall_desc':
          return b.overall_pct - a.overall_pct;
        case 'overall_asc':
          return a.overall_pct - b.overall_pct;
        case 'attendance_desc':
          return b.attendance_pct - a.attendance_pct;
        case 'attendance_asc':
          return a.attendance_pct - b.attendance_pct;
        case 'assignment_desc':
          return b.assignment_avg_pct - a.assignment_avg_pct;
        case 'quiz_desc':
          return b.quiz_avg_pct - a.quiz_avg_pct;
        case 'name_asc':
          return a.full_name.localeCompare(b.full_name);
        default:
          return b.overall_pct - a.overall_pct;
      }
    });

    return list;
  }, [perfData?.students, searchQuery, statusFilter, sortBy]);

  // Selected student object
  const currentExpandedStudent = useMemo(() => {
    if (!perfData?.students || !expandedStudentId) return null;
    return perfData.students.find((s) => s.student_id === expandedStudentId) || null;
  }, [perfData?.students, expandedStudentId]);

  // Helper for letter grade colors
  const getGradeColor = (letter: string) => {
    if (letter.startsWith('A')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (letter.startsWith('B')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (letter.startsWith('C')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (letter.startsWith('D')) return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'top_performer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Sparkles className="w-3 h-3 text-emerald-600" /> Top Performer
          </span>
        );
      case 'on_track':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" /> On Track
          </span>
        );
      case 'needs_attention':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Needs Attention
          </span>
        );
      case 'at_risk':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> At Risk
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-7 pb-24 text-slate-800">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 font-bold text-[10px] uppercase tracking-wider border border-brand-200">
              Instructor Analytics
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Academic Progress &amp; Gradebook</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Student Performance &amp; Evaluation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Select a course to inspect enrolled students, monitor overall attendance, quiz results, assignment grades, and lesson completion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => selectedCourseId && fetchPerformanceData(selectedCourseId)}
            disabled={loadingPerf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingPerf ? 'animate-spin text-brand-600' : 'text-slate-500'}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. Step 1: Course List (Teacher Courses Selector Deck) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
              My Teaching Courses ({courses.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Click a course to view enrolled students
          </span>
        </div>

        {loadingCourses ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No courses assigned</h3>
            <p className="text-xs text-slate-400 mt-1">You are not currently teaching or assigned to any courses.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => {
              const isSelected = course.id === selectedCourseId;
              return (
                <div
                  key={course.id}
                  onClick={() => {
                    setSelectedCourseId(course.id);
                  }}
                  className={`relative p-4 rounded-2xl cursor-pointer transition-all border text-left flex flex-col justify-between ${isSelected
                    ? 'bg-gradient-to-br from-brand-50/70 via-white to-indigo-50/40 border-brand-500 shadow-md ring-2 ring-brand-500/20'
                    : 'bg-white hover:bg-slate-50/90 border-slate-200/80 hover:border-slate-300 shadow-sm'
                    }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${isSelected
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                      >
                        {course.subject_code || 'COURSE'}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-700 bg-brand-100/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-brand-600" /> Active
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1 group-hover:text-brand-600">
                      {course.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {course.subject_name || 'General Curriculum'}
                    </p>
                  </div>

                  {/* Course stats footer */}
                  <div className="flex items-center gap-3 pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-500 font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {course.student_count ?? 0} Students
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
                      {course.assignment_count ?? 0} Asg
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      {course.quiz_count ?? 0} Quizzes
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Step 2 & 3: Course Analytics & Enrolled Students Section */}
      {selectedCourseId && (
        <div className="space-y-6 pt-2">
          {loadingPerf ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
              <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">Aggregating student metrics and submissions...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : !perfData ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm text-xs text-slate-400">
              No performance data found for this course.
            </div>
          ) : (
            <>
              {/* Course Overview Banner & Class Health Cards */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 font-extrabold text-[10px] tracking-wider uppercase border border-brand-200">
                        {perfData.course.subject_code || 'COURSE'}
                      </span>
                      <span className="text-slate-300 text-xs">•</span>
                      <span className="text-xs text-slate-500 font-semibold truncate">
                        {perfData.course.subject_name || 'Class Curriculum'}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                      {perfData.course.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl font-normal leading-relaxed">
                      {perfData.course.description || 'Comprehensive class gradebook and individual student performance dashboard.'}
                    </p>
                  </div>

                  {/* Quick badges - strictly single row */}
                  <div className="flex items-center gap-2 sm:gap-2.5 flex-nowrap flex-shrink-0">
                    <div className="px-3 sm:px-3.5 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 text-center min-w-[68px] sm:min-w-[76px] transition flex-shrink-0">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Enrolled</span>
                      <span className="text-base font-black text-slate-900">{perfData.summary.total_enrolled}</span>
                    </div>
                    <div className="px-3 sm:px-3.5 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 text-center min-w-[68px] sm:min-w-[76px] transition flex-shrink-0">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assignments</span>
                      <span className="text-base font-black text-slate-900">{perfData.course.total_assignments}</span>
                    </div>
                    <div className="px-3 sm:px-3.5 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 text-center min-w-[68px] sm:min-w-[76px] transition flex-shrink-0">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quizzes</span>
                      <span className="text-base font-black text-slate-900">{perfData.course.total_quizzes}</span>
                    </div>
                    <div className="px-3 sm:px-3.5 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 text-center min-w-[68px] sm:min-w-[76px] transition flex-shrink-0">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sessions</span>
                      <span className="text-base font-black text-slate-900">{perfData.course.total_sessions}</span>
                    </div>
                  </div>
                </div>

                {/* Class aggregate metrics cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
                  <div className="bg-slate-50/80 hover:bg-slate-50 rounded-2xl p-4 border border-slate-200/80 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Class Average</span>
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-2">
                      <span className="text-2xl font-black text-slate-900">{perfData.summary.class_avg_overall_pct}%</span>
                      <span className="text-[11px] text-emerald-600 font-bold">overall</span>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 hover:bg-slate-50 rounded-2xl p-4 border border-slate-200/80 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Avg Attendance</span>
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-2">
                      <span className="text-2xl font-black text-slate-900">{perfData.summary.class_avg_attendance_pct}%</span>
                      <span className="text-[11px] text-blue-600 font-bold">presence</span>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 hover:bg-slate-50 rounded-2xl p-4 border border-slate-200/80 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Avg Assignment</span>
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-2">
                      <span className="text-2xl font-black text-slate-900">{perfData.summary.class_avg_assignment_pct}%</span>
                      <span className="text-[11px] text-purple-600 font-bold">deliverables</span>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 hover:bg-slate-50 rounded-2xl p-4 border border-slate-200/80 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Avg Quiz Score</span>
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-2">
                      <span className="text-2xl font-black text-slate-900">{perfData.summary.class_avg_quiz_pct}%</span>
                      <span className="text-[11px] text-amber-600 font-bold">knowledge</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Roster Controls: Search, Filters, Sorting */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search enrolled student by name, student ID, email..."
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                    />
                  </div>

                  {/* Sort */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    >
                      <option value="overall_desc">Overall Score (High → Low)</option>
                      <option value="overall_asc">Overall Score (Low → High)</option>
                      <option value="attendance_desc">Attendance (High → Low)</option>
                      <option value="attendance_asc">Attendance (Low → High)</option>
                      <option value="assignment_desc">Assignment Average</option>
                      <option value="quiz_desc">Quiz Average</option>
                      <option value="name_asc">Student Name (A → Z)</option>
                    </select>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${statusFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    All Enrolled ({perfData.students.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('top_performer')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 ${statusFilter === 'top_performer'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                      }`}
                  >
                    <Sparkles className="w-3 h-3" /> Top Performers ({perfData.summary.top_performers_count})
                  </button>
                  <button
                    onClick={() => setStatusFilter('on_track')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 ${statusFilter === 'on_track'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60'
                      }`}
                  >
                    <CheckCircle2 className="w-3 h-3" /> On Track
                  </button>
                  <button
                    onClick={() => setStatusFilter('needs_attention')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 ${statusFilter === 'needs_attention'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
                      }`}
                  >
                    <Clock className="w-3 h-3" /> Needs Attention ({perfData.summary.needs_attention_count})
                  </button>
                  <button
                    onClick={() => setStatusFilter('at_risk')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 ${statusFilter === 'at_risk'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                      }`}
                  >
                    <AlertTriangle className="w-3 h-3" /> At Risk ({perfData.summary.at_risk_count})
                  </button>
                </div>
              </div>

              {/* Enrolled Students Table / Cards */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                      Enrolled Students Roster ({filteredStudents.length})
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click any student row to view their detailed performance analytics
                    </p>
                  </div>
                  {filteredStudents.length > 0 && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      Showing {filteredStudents.length} of {perfData.students.length} students
                    </span>
                  )}
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">No students match your filter criteria.</p>
                    <p className="mt-1">Try resetting search keywords or category filters.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Student</th>
                          <th className="py-3 px-3">Attendance</th>
                          <th className="py-3 px-3">Assignments</th>
                          <th className="py-3 px-3">Quizzes</th>
                          <th className="py-3 px-3">Progress</th>
                          <th className="py-3 px-3 text-center">Overall Grade</th>
                          <th className="py-3 px-4 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map((st) => {
                          const isExpanded = st.student_id === expandedStudentId;
                          return (
                            <React.Fragment key={st.student_id}>
                              <tr
                                onClick={() => {
                                  setExpandedStudentId(isExpanded ? null : st.student_id);
                                }}
                                className={`cursor-pointer transition-colors ${isExpanded
                                  ? 'bg-brand-50/40'
                                  : 'hover:bg-slate-50/90'
                                  }`}
                              >
                                {/* Student Info */}
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={st.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                                      alt={st.full_name}
                                      className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200"
                                    />
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-extrabold text-slate-900 block">{st.full_name}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                        <span className="font-semibold text-brand-600">{st.student_code}</span>
                                        <span>•</span>
                                        <span className="truncate max-w-[140px]">{st.email}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Attendance Score */}
                                <td className="py-3.5 px-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                      <span
                                        className={
                                          st.attendance_pct >= 85
                                            ? 'text-emerald-600'
                                            : st.attendance_pct >= 70
                                              ? 'text-amber-600'
                                              : 'text-rose-600'
                                        }
                                      >
                                        {st.attendance_pct}%
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-normal">
                                        {st.present_count + st.late_count}/{st.total_sessions}
                                      </span>
                                    </div>
                                    <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${st.attendance_pct >= 85
                                          ? 'bg-emerald-500'
                                          : st.attendance_pct >= 70
                                            ? 'bg-amber-500'
                                            : 'bg-rose-500'
                                          }`}
                                        style={{ width: `${Math.min(st.attendance_pct, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>

                                {/* Assignment Score */}
                                <td className="py-3.5 px-3">
                                  <div>
                                    <span className="font-extrabold text-slate-900 block text-xs">
                                      {st.assignment_avg_pct}%
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {st.graded_assignments}/{st.total_assignments} graded
                                    </span>
                                  </div>
                                </td>

                                {/* Quiz Score */}
                                <td className="py-3.5 px-3">
                                  <div>
                                    <span className="font-extrabold text-slate-900 block text-xs">
                                      {st.quiz_avg_pct}%
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {st.attempted_quizzes}/{st.total_quizzes} taken
                                    </span>
                                  </div>
                                </td>

                                {/* Lesson Progress */}
                                <td className="py-3.5 px-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                                      <span>{st.progress_pct}%</span>
                                      <span className="text-[10px] text-slate-400">
                                        {st.completed_lessons}/{st.total_lessons}
                                      </span>
                                    </div>
                                    <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className="bg-brand-500 h-full rounded-full"
                                        style={{ width: `${Math.min(st.progress_pct, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>

                                {/* Overall Performance / Grade */}
                                <td className="py-3.5 px-3 text-center">
                                  <div className="inline-flex flex-col items-center gap-1">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-lg font-black text-xs border ${getGradeColor(
                                        st.grade_letter
                                      )}`}
                                    >
                                      {st.grade_letter} ({st.overall_pct}%)
                                    </span>
                                    {getTierBadge(st.performance_tier)}
                                  </div>
                                </td>

                                {/* Action Toggle */}
                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedStudentId(isExpanded ? null : st.student_id);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1 transition ${isExpanded
                                      ? 'bg-brand-600 text-white shadow-sm'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                      }`}
                                  >
                                    <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </td>
                              </tr>

                              {/* In-Line Expanded Student Detailed Overall Performance */}
                              {isExpanded && (
                                <tr>
                                  <td colSpan={7} className="p-0 bg-slate-50/70 border-b-2 border-brand-200">
                                    <div className="p-6 space-y-6 animate-fade-in">
                                      {/* Student Detailed Performance Header */}
                                      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3.5">
                                          <img
                                            src={st.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                                            alt={st.full_name}
                                            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-brand-500/30"
                                          />
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <h4 className="text-base font-extrabold text-slate-900">{st.full_name}</h4>
                                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px]">
                                                {st.student_code}
                                              </span>
                                              {getTierBadge(st.performance_tier)}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                              {st.email} {st.department && `• ${st.department}`}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Large Overall Composite Grade Card */}
                                        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200">
                                          <div className="text-right">
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase">Composite Grade</span>
                                            <span className="text-xs font-bold text-slate-600">Calculated Score</span>
                                          </div>
                                          <div
                                            className={`px-3 py-1 rounded-xl text-lg font-black border ${getGradeColor(
                                              st.grade_letter
                                            )}`}
                                          >
                                            {st.grade_letter}
                                          </div>
                                          <div className="text-left font-black text-xl text-slate-900">
                                            {st.overall_pct}%
                                          </div>
                                        </div>
                                      </div>

                                      {/* 4 Deep-Dive KPI Cards */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {/* Attendance Card */}
                                        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-2">
                                          <div className="flex items-center justify-between text-slate-500">
                                            <span className="text-[11px] font-bold uppercase tracking-wide">Attendance Rate</span>
                                            <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
                                          </div>
                                          <div className="flex items-baseline justify-between">
                                            <span className="text-2xl font-black text-slate-900">{st.attendance_pct}%</span>
                                            <span className="text-xs text-slate-400 font-semibold">
                                              {st.present_count + st.late_count} / {st.total_sessions} sessions
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 text-[10px] font-bold pt-1 border-t border-slate-100 text-slate-500">
                                            <span className="text-emerald-600">{st.present_count} Present</span>
                                            <span>•</span>
                                            <span className="text-amber-600">{st.late_count} Late</span>
                                            <span>•</span>
                                            <span className="text-rose-600">{st.absent_count} Absent</span>
                                          </div>
                                        </div>

                                        {/* Assignment Card */}
                                        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-2">
                                          <div className="flex items-center justify-between text-slate-500">
                                            <span className="text-[11px] font-bold uppercase tracking-wide">Assignment Average</span>
                                            <FileCheck2 className="w-4 h-4 text-brand-600" />
                                          </div>
                                          <div className="flex items-baseline justify-between">
                                            <span className="text-2xl font-black text-slate-900">{st.assignment_avg_pct}%</span>
                                            <span className="text-xs text-slate-400 font-semibold">
                                              {st.graded_assignments} graded
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 text-[10px] font-bold pt-1 border-t border-slate-100 text-slate-500">
                                            <span className="text-blue-600">{st.submitted_assignments} Submitted</span>
                                            <span>•</span>
                                            <span className="text-slate-400">
                                              {st.total_assignments - st.submitted_assignments} Missing
                                            </span>
                                          </div>
                                        </div>

                                        {/* Quiz Card */}
                                        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-2">
                                          <div className="flex items-center justify-between text-slate-500">
                                            <span className="text-[11px] font-bold uppercase tracking-wide">Quiz Performance</span>
                                            <Award className="w-4 h-4 text-amber-500" />
                                          </div>
                                          <div className="flex items-baseline justify-between">
                                            <span className="text-2xl font-black text-slate-900">{st.quiz_avg_pct}%</span>
                                            <span className="text-xs text-slate-400 font-semibold">
                                              {st.attempted_quizzes} / {st.total_quizzes} taken
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 text-[10px] font-bold pt-1 border-t border-slate-100 text-slate-500">
                                            <span className="text-amber-600">{st.attempted_quizzes} Attempted</span>
                                            <span>•</span>
                                            <span className="text-slate-400">
                                              {st.total_quizzes - st.attempted_quizzes} Unattempted
                                            </span>
                                          </div>
                                        </div>

                                        {/* Syllabus Progress Card */}
                                        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-2">
                                          <div className="flex items-center justify-between text-slate-500">
                                            <span className="text-[11px] font-bold uppercase tracking-wide">Course Syllabus</span>
                                            <GraduationCap className="w-4 h-4 text-purple-600" />
                                          </div>
                                          <div className="flex items-baseline justify-between">
                                            <span className="text-2xl font-black text-slate-900">{st.progress_pct}%</span>
                                            <span className="text-xs text-slate-400 font-semibold">
                                              {st.completed_lessons} / {st.total_lessons} lessons
                                            </span>
                                          </div>
                                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
                                            <div
                                              className="bg-purple-600 h-full rounded-full"
                                              style={{ width: `${Math.min(st.progress_pct, 100)}%` }}
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      {/* Sub-Tabs: Assignments Breakdown, Quizzes Breakdown, Attendance History */}
                                      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                                        <div className="flex border-b border-slate-100 px-4 pt-3 gap-2 bg-slate-50/50">
                                          <button
                                            onClick={() => setActiveStudentTab('assignments')}
                                            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${activeStudentTab === 'assignments'
                                              ? 'border-brand-600 text-brand-600 bg-white'
                                              : 'border-transparent text-slate-500 hover:text-slate-800'
                                              }`}
                                          >
                                            <FileCheck2 className="w-3.5 h-3.5" />
                                            Assignments Breakdown ({st.assignments_breakdown.length})
                                          </button>
                                          <button
                                            onClick={() => setActiveStudentTab('quizzes')}
                                            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${activeStudentTab === 'quizzes'
                                              ? 'border-brand-600 text-brand-600 bg-white'
                                              : 'border-transparent text-slate-500 hover:text-slate-800'
                                              }`}
                                          >
                                            <Award className="w-3.5 h-3.5" />
                                            Quizzes Breakdown ({st.quizzes_breakdown.length})
                                          </button>
                                          <button
                                            onClick={() => setActiveStudentTab('attendance')}
                                            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${activeStudentTab === 'attendance'
                                              ? 'border-brand-600 text-brand-600 bg-white'
                                              : 'border-transparent text-slate-500 hover:text-slate-800'
                                              }`}
                                          >
                                            <CalendarCheck2 className="w-3.5 h-3.5" />
                                            Attendance Sessions ({st.attendance_breakdown.length})
                                          </button>
                                        </div>

                                        {/* Tab 1: Assignments Breakdown */}
                                        {activeStudentTab === 'assignments' && (
                                          <div className="p-4">
                                            {st.assignments_breakdown.length === 0 ? (
                                              <p className="text-xs text-slate-400 py-6 text-center">
                                                No assignments configured for this course.
                                              </p>
                                            ) : (
                                              <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                  <thead className="text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                                                    <tr>
                                                      <th className="pb-2.5">Assignment</th>
                                                      <th className="pb-2.5">Due Date</th>
                                                      <th className="pb-2.5">Status</th>
                                                      <th className="pb-2.5">Score</th>
                                                      <th className="pb-2.5">Feedback</th>
                                                      <th className="pb-2.5 text-right">Action</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-slate-100">
                                                    {st.assignments_breakdown.map((asg) => (
                                                      <tr key={asg.assignment_id} className="hover:bg-slate-50/80">
                                                        <td className="py-3 font-bold text-slate-900">
                                                          {asg.title}
                                                          {asg.file_url && (
                                                            <a
                                                              href={asg.file_url}
                                                              target="_blank"
                                                              rel="noreferrer"
                                                              className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-brand-600 hover:underline font-semibold"
                                                            >
                                                              <ExternalLink className="w-2.5 h-2.5" /> File Attached
                                                            </a>
                                                          )}
                                                        </td>
                                                        <td className="py-3 text-slate-500">
                                                          {asg.due_at ? new Date(asg.due_at).toLocaleDateString() : 'No deadline'}
                                                        </td>
                                                        <td className="py-3">
                                                          <StatusBadge status={asg.status} size="sm" />
                                                        </td>
                                                        <td className="py-3">
                                                          {asg.score !== null ? (
                                                            <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                              {asg.score_pct}%
                                                            </span>
                                                          ) : (
                                                            <span className="text-slate-400 font-medium">Ungraded</span>
                                                          )}
                                                        </td>
                                                        <td className="py-3 max-w-xs truncate text-slate-600">
                                                          {asg.feedback ? (
                                                            <span title={asg.feedback}>{asg.feedback}</span>
                                                          ) : (
                                                            <span className="text-slate-400 italic">No notes</span>
                                                          )}
                                                        </td>
                                                        <td className="py-3 text-right">
                                                          {asg.submission_id ? (
                                                            <button
                                                              onClick={() =>
                                                                handleOpenGradeModal(
                                                                  asg.submission_id!,
                                                                  asg.title,
                                                                  st.full_name,
                                                                  asg.max_score,
                                                                  asg.score,
                                                                  asg.feedback,
                                                                  asg.content,
                                                                  asg.file_url
                                                                )
                                                              }
                                                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1 shadow-sm"
                                                            >
                                                              <Edit3 className="w-3 h-3" />

                                                            </button>
                                                          ) : (
                                                            <span className="text-[11px] text-slate-400 italic">No Submission</span>
                                                          )}
                                                        </td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Tab 2: Quizzes Breakdown */}
                                        {activeStudentTab === 'quizzes' && (
                                          <div className="p-4">
                                            {st.quizzes_breakdown.length === 0 ? (
                                              <p className="text-xs text-slate-400 py-6 text-center">
                                                No quizzes created in this course.
                                              </p>
                                            ) : (
                                              <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                  <thead className="text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                                                    <tr>
                                                      <th className="pb-2.5">Quiz</th>
                                                      <th className="pb-2.5">Due Date</th>
                                                      <th className="pb-2.5">Status</th>
                                                      <th className="pb-2.5">Attempted Date</th>
                                                      <th className="pb-2.5 text-right">Score</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-slate-100">
                                                    {st.quizzes_breakdown.map((q) => (
                                                      <tr key={q.quiz_id} className="hover:bg-slate-50/80">
                                                        <td className="py-3 font-bold text-slate-900">{q.title}</td>
                                                        <td className="py-3 text-slate-500">
                                                          {q.due_at ? new Date(q.due_at).toLocaleDateString() : 'Self-paced'}
                                                        </td>
                                                        <td className="py-3">
                                                          <StatusBadge status={q.status} size="sm" />
                                                        </td>
                                                        <td className="py-3 text-slate-500">
                                                          {q.submitted_at
                                                            ? new Date(q.submitted_at).toLocaleDateString()
                                                            : 'Not completed'}
                                                        </td>
                                                        <td className="py-3 text-right">
                                                          {q.score !== null ? (
                                                            <span className="font-extrabold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                                                              {q.score} / {q.max_score}
                                                            </span>
                                                          ) : (
                                                            <span className="text-slate-400 font-medium">0 pts</span>
                                                          )}
                                                        </td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Tab 3: Attendance History */}
                                        {activeStudentTab === 'attendance' && (
                                          <div className="p-4 space-y-3">
                                            {st.attendance_breakdown.length === 0 ? (
                                              <p className="text-xs text-slate-400 py-6 text-center">
                                                No attendance sessions recorded yet for this course.
                                              </p>
                                            ) : (
                                              <div>
                                                <div className="flex items-center justify-between mb-3">
                                                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                                    Attendance Grid ({st.attendance_breakdown.length} Classes)
                                                  </span>
                                                  <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
                                                    <span className="inline-flex items-center gap-1.5">
                                                      <span className="w-3 h-3 rounded-md bg-blue-500" />
                                                      <span>Present</span>
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5">
                                                      <span className="w-3 h-3 rounded-md bg-red-500" />
                                                      <span>Absent</span>
                                                    </span>
                                                  </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                  {st.attendance_breakdown.map((sess, idx) => {
                                                    const isPresent = sess.status === 'present' || sess.status === 'late';
                                                    const isAbsent = sess.status === 'absent';
                                                    const cellBg = isPresent
                                                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                                      : isAbsent
                                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                                        : 'bg-slate-200 hover:bg-slate-300 text-slate-600';

                                                    const formattedDate = sess.session_date
                                                      ? new Date(sess.session_date).toLocaleDateString(undefined, {
                                                          year: 'numeric',
                                                          month: 'short',
                                                          day: 'numeric',
                                                        })
                                                      : 'No date';

                                                    return (
                                                      <div key={sess.session_id} className="relative group">
                                                        <div
                                                          title={`${formattedDate} • ${sess.status.toUpperCase()}${sess.session_title ? ` (${sess.session_title})` : ''}`}
                                                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-extrabold cursor-pointer transition-all duration-150 group-hover:scale-110 shadow-sm ${cellBg}`}
                                                        >
                                                          {idx + 1}
                                                        </div>

                                                        {/* Tooltip on hover showing date */}
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                                                          <div className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-md whitespace-nowrap shadow-lg">
                                                            <div>{formattedDate}</div>
                                                            <div className="text-[9px] font-normal text-slate-300 capitalize">
                                                              {sess.status}
                                                            </div>
                                                          </div>
                                                          <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-0.5" />
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* 4. Grade Submission Modal */}
      {gradingModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">Evaluation Terminal</span>
                <h3 className="text-lg font-extrabold text-slate-900">{gradingModalData.assignment_title}</h3>
                <p className="text-xs text-slate-500">Student: {gradingModalData.student_name}</p>
              </div>
              <button
                onClick={() => setGradingModalData(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Student submission preview */}
            {gradingModalData.content && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 max-h-40 overflow-y-auto whitespace-pre-wrap">
                <span className="block font-bold text-slate-900 mb-1">Student Submission Content:</span>
                {gradingModalData.content}
              </div>
            )}

            {gradingModalData.file_url && (
              <a
                href={gradingModalData.file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-brand-600 font-bold hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View Attached Deliverable
              </a>
            )}

            <form onSubmit={handleSaveGrade} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Awarded Score (Max: {gradingModalData.max_score} pts)
                </label>
                <input
                  type="number"
                  min={0}
                  max={gradingModalData.max_score}
                  step={0.5}
                  required
                  value={gradeInputScore}
                  onChange={(e) => setGradeInputScore(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instructor Pedagogical Feedback</label>
                <textarea
                  rows={3}
                  value={gradeInputFeedback}
                  onChange={(e) => setGradeInputFeedback(e.target.value)}
                  placeholder="Provide recommendations, positive feedback, and areas of improvement..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGradingModalData(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGrade}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {savingGrade ? 'Saving Grade...' : 'Release Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
