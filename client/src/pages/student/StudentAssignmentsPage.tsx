import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  Trophy,
  Paperclip,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../lib/api';

export interface StudentAssignmentItem {
  id: string;
  course_id: string;
  title: string;
  instructions: string;
  due_at: string | null;
  max_score: number;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  course_title: string;
  subject_name: string | null;
  teacher_name: string | null;
  submission_id: string | null;
  submission_status: 'submitted' | 'graded' | null;
  submitted_at: string | null;
  submission_content: string | null;
  submission_file_url: string | null;
  grade_score: number | null;
  grade_feedback: string | null;
  grade_released_at: string | null;
}

export const StudentAssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<StudentAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [sortBy, setSortBy] = useState<'due_asc' | 'due_desc' | 'score_desc'>('due_asc');

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const data = await api.getStudentAssignments();
      setAssignments(data || []);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Unique course list for dropdown filter
  const courseOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const asg of assignments) {
      if (asg.course_id && asg.course_title) {
        map.set(asg.course_id, asg.course_title);
      }
    }
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [assignments]);

  // Aggregate stats
  const stats = useMemo(() => {
    const now = new Date();
    let pendingCount = 0;
    let overdueCount = 0;
    let submittedCount = 0;
    let gradedCount = 0;
    let totalScoreSum = 0;
    let totalMaxScoreSum = 0;

    for (const a of assignments) {
      const isGraded = a.submission_status === 'graded' && a.grade_score !== null;
      const isSubmitted = a.submission_status === 'submitted';
      const isNotSubmitted = !a.submission_status || a.submission_status === null;

      if (isGraded) {
        gradedCount += 1;
        totalScoreSum += a.grade_score || 0;
        totalMaxScoreSum += a.max_score || 100;
      } else if (isSubmitted) {
        submittedCount += 1;
      } else if (isNotSubmitted) {
        pendingCount += 1;
        if (a.due_at && new Date(a.due_at) < now) {
          overdueCount += 1;
        }
      }
    }

    const total = assignments.length;
    const completed = submittedCount + gradedCount;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 100;
    const avgGradePercent =
      totalMaxScoreSum > 0 ? Math.round((totalScoreSum / totalMaxScoreSum) * 100) : null;

    return {
      total,
      pendingCount,
      overdueCount,
      submittedCount,
      gradedCount,
      completionRate,
      avgGradePercent,
    };
  }, [assignments]);

  // Filtered & sorted assignments
  const filteredAssignments = useMemo(() => {
    const now = new Date();

    return assignments
      .filter((item) => {
        // Status filter
        if (statusFilter === 'pending') {
          if (item.submission_status === 'submitted' || item.submission_status === 'graded') {
            return false;
          }
        } else if (statusFilter === 'submitted') {
          if (item.submission_status !== 'submitted') {
            return false;
          }
        } else if (statusFilter === 'graded') {
          if (item.submission_status !== 'graded') {
            return false;
          }
        }

        // Course filter
        if (selectedCourse !== 'all' && item.course_id !== selectedCourse) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title?.toLowerCase().includes(q);
          const matchCourse = item.course_title?.toLowerCase().includes(q);
          const matchInstructions = item.instructions?.toLowerCase().includes(q);
          if (!matchTitle && !matchCourse && !matchInstructions) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'due_asc') {
          // Future due dates first, then nulls
          if (!a.due_at) return 1;
          if (!b.due_at) return -1;
          return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
        } else if (sortBy === 'due_desc') {
          if (!a.due_at) return 1;
          if (!b.due_at) return -1;
          return new Date(b.due_at).getTime() - new Date(a.due_at).getTime();
        } else if (sortBy === 'score_desc') {
          return (b.max_score || 0) - (a.max_score || 0);
        }
        return 0;
      });
  }, [assignments, statusFilter, selectedCourse, searchQuery, sortBy]);

  // Humanize due status
  const getDueStatus = (dueAtStr: string | null, isCompleted: boolean) => {
    if (!dueAtStr) {
      return {
        label: 'Self-Paced / No Due Date',
        isOverdue: false,
        badgeClass: 'text-slate-600 bg-slate-100 border-slate-200/80',
      };
    }

    const now = new Date();
    const dueDate = new Date(dueAtStr);
    const diffMs = dueDate.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (isCompleted) {
      return {
        label: `Due ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        isOverdue: false,
        badgeClass: 'text-slate-600 bg-slate-50 border-slate-200/60',
      };
    }

    if (diffMs < 0) {
      const pastDays = Math.abs(diffDays);
      return {
        label: pastDays === 0 ? 'Overdue today' : `Overdue by ${pastDays}d`,
        isOverdue: true,
        badgeClass: 'text-rose-700 bg-rose-50 border-rose-200 font-bold',
      };
    }

    if (diffHours <= 48) {
      return {
        label: diffHours <= 24 ? `Due in ${Math.max(1, diffHours)}h` : 'Due tomorrow',
        isOverdue: false,
        badgeClass: 'text-amber-800 bg-amber-50 border-amber-200 font-bold',
      };
    }

    return {
      label: `Due ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      isOverdue: false,
      badgeClass: 'text-slate-600 bg-slate-100 border-slate-200/80',
    };
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Assignments</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track academic deadlines, submit project coursework, and inspect instructor evaluations
          </p>
        </div>

        <button
          onClick={fetchAssignments}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs self-start sm:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Action Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pending Submissions
            </span>
            <span
              className={`p-2 rounded-xl ${stats.pendingCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                }`}
            >
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.pendingCount}
            </span>
            {stats.overdueCount > 0 && (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                {stats.overdueCount} Overdue
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.pendingCount === 0 ? 'All current coursework turned in' : 'Requires your attention'}
          </p>
        </div>

        {/* Submitted Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Under Review
            </span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
            {stats.submittedCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Turned in, awaiting evaluation</p>
        </div>

        {/* Graded Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Evaluated Tasks
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Trophy className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {stats.gradedCount}
            </span>
            {stats.avgGradePercent !== null && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                {stats.avgGradePercent}% Avg
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Grades & feedback released</p>
        </div>

        {/* Completion Rate Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Completion Rate
            </span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
            {stats.completionRate}%
          </div>
          <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-brand-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filtering, Search & Status Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3.5">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <span>All Tasks</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}
            >
              {assignments.length}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${statusFilter === 'pending'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <span>Action Required</span>
            {stats.pendingCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
                  }`}
              >
                {stats.pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusFilter('submitted')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${statusFilter === 'submitted'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <span>Under Review</span>
            {stats.submittedCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'submitted' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'
                  }`}
              >
                {stats.submittedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusFilter('graded')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${statusFilter === 'graded'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <span>Evaluated & Graded</span>
            {stats.gradedCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'graded'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-100 text-emerald-800'
                  }`}
              >
                {stats.gradedCount}
              </span>
            )}
          </button>
        </div>

        {/* Search, Course Dropdown & Sort Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-0.5">
          {/* Search Field */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assignments by title or keyword..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            />
          </div>

          {/* Course Select Dropdown */}
          <div className="md:col-span-4 relative">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white text-slate-700 transition"
            >
              <option value="all">All Enrolled Courses ({courseOptions.length})</option>
              {courseOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="md:col-span-3 relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white text-slate-700 transition"
            >
              <option value="due_asc">Sort: Earliest Due First</option>
              <option value="due_desc">Sort: Latest Due First</option>
              <option value="score_desc">Sort: Highest Max Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignment List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
          <RotateCcw className="w-6 h-6 text-brand-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">Loading assignments directory...</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Assignments Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCourse !== 'all' || statusFilter !== 'all'
              ? 'No assignments match your current filter criteria. Try resetting filters or search.'
              : 'You do not have any published assignments in your enrolled courses right now.'}
          </p>
          {(searchQuery || selectedCourse !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCourse('all');
                setStatusFilter('all');
              }}
              className="mt-4 px-4 py-2 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredAssignments.map((asg) => {
            const isGraded = asg.submission_status === 'graded';
            const isSubmitted = asg.submission_status === 'submitted';
            const isPending = !asg.submission_status;
            const dueInfo = getDueStatus(asg.due_at, isSubmitted || isGraded);

            return (
              <div
                key={asg.id}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 p-5 sm:p-6 transition shadow-2xs hover:shadow-xs group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Metadata & Title */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200/60">
                        {asg.course_title}
                      </span>
                      {asg.subject_name && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {asg.subject_name}
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/student/assignments/${asg.id}`}
                      className="text-base font-extrabold text-slate-900 group-hover:text-brand-600 transition tracking-tight line-clamp-1 block"
                    >
                      {asg.title}
                    </Link>

                    {asg.instructions && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {asg.instructions}
                      </p>
                    )}

                    {/* Chips: Due Date, Max Points, Instructor */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] ${dueInfo.badgeClass}`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{dueInfo.label}</span>
                      </span>

                      <span className="font-semibold text-slate-600">
                        Max Score: <strong className="text-slate-900">{asg.max_score} pts</strong>
                      </span>

                      {asg.teacher_name && (
                        <span className="text-slate-400">
                          Instructor: <span className="text-slate-600">{asg.teacher_name}</span>
                        </span>
                      )}

                      {asg.file_url && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                          <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                          <span>Includes Attachment</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Status & Action Button */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Status Display */}
                    <div>
                      {isGraded ? (
                        <div className="text-right">
                          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                            <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              Score: {asg.grade_score} / {asg.max_score}
                            </span>
                          </div>

                        </div>
                      ) : isSubmitted ? (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Turned In</span>
                          </span>
                          {asg.submitted_at && (
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(asg.submitted_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-right">

                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <Link
                      to={`/student/assignments/${asg.id}`}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs ${isGraded
                        ? 'bg-slate-900 hover:bg-slate-800 text-white'
                        : isSubmitted
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          : 'bg-brand-600 hover:bg-brand-700 text-white'
                        }`}
                    >
                      <span>
                        {isGraded
                          ? 'View Feedback'
                          : isSubmitted
                            ? 'Review Submission'
                            : 'Submit Work'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
