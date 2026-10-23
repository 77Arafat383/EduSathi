import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  PlusCircle,
  CheckCircle2,
  ArrowRight,
  Upload,
  Paperclip,
  X,
  AlertCircle,
  FileCheck2,
  Calendar,
  Award,
  ExternalLink,
  Download,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  Clock,
  User,
  GraduationCap,
  Layers,
  Edit3
} from 'lucide-react';
import { api } from '../../lib/api';
import { Course } from '../../types';
import { AssignmentSubmissionsRoster } from './AssignmentSubmissionsRoster';

interface AssignmentWithStats {
  id: string;
  course_id: string;
  course_title?: string;
  title: string;
  instructions: string;
  max_score: number;
  due_at?: string;
  file_url?: string;
  file_name?: string;
  submission_count: number;
  graded_count: number;
  created_at?: string;
}

interface SubmissionItem {
  id: string;
  assignment_id: string;
  student_id: string;
  student_code?: string;
  student_name: string;
  student_email: string;
  avatar_url?: string;
  content: string;
  file_url?: string;
  submitted_at: string;
  status: 'submitted' | 'graded' | 'returned';
  grade_score?: number | null;
  grade_feedback?: string | null;
  grade_released_at?: string | null;
}

export const TeacherAssignmentBuilderPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'submissions' | 'create'>('submissions');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedFilterCourse, setSelectedFilterCourse] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Assignments state
  const [assignments, setAssignments] = useState<AssignmentWithStats[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);

  // Submissions state per assignment
  const [submissionsByAssignment, setSubmissionsByAssignment] = useState<Record<string, SubmissionItem[]>>({});
  const [loadingSubmissions, setLoadingSubmissions] = useState<Record<string, boolean>>({});

  // Grading state per submission: { [submissionId]: { score: number, feedback: string, saving: boolean, success: boolean, editing: boolean } }
  const [gradingState, setGradingState] = useState<Record<string, {
    score: number | string;
    feedback: string;
    saving: boolean;
    success: boolean;
    editing: boolean;
  }>>({});

  // Create Form Data
  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    instructions: '',
    max_score: 100,
    due_at: '',
    submission_type: 'text_or_link',
  });
  const [submitting, setSubmitting] = useState(false);
  const [newCreatedId, setNewCreatedId] = useState<string | null>(null);

  // Attached PDF / Word file state
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: number;
    type: string;
    dataUrl: string;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.pdf', '.doc', '.docx'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => lowerName.endsWith(ext)) ||
      file.type.includes('pdf') ||
      file.type.includes('word') ||
      file.type.includes('document') ||
      file.type.includes('msword');

    if (!isValid) {
      setFileError('Please upload a PDF or Microsoft Word document (.pdf, .doc, .docx).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setFileError('File size exceeds the 15MB upload limit.');
      return;
    }

    setFileError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Load teacher courses
  useEffect(() => {
    api.getMyCourses()
      .then((data) => {
        if (data && data.length > 0) {
          setCourses(data);
          setFormData((prev) => ({ ...prev, course_id: prev.course_id || data[0].id }));
        } else {
          api.getCourses()
            .then((all) => {
              setCourses(all || []);
              if (all && all.length > 0) {
                setFormData((prev) => ({ ...prev, course_id: prev.course_id || all[0].id }));
              }
            })
            .catch(() => { });
        }
      })
      .catch(() => {
        api.getCourses()
          .then((all) => {
            setCourses(all || []);
            if (all && all.length > 0) {
              setFormData((prev) => ({ ...prev, course_id: prev.course_id || all[0].id }));
            }
          })
          .catch(() => { });
      });
  }, []);

  // Fetch teacher assignments list
  const loadAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const params: Record<string, string> = {};
      if (selectedFilterCourse !== 'all') {
        params.courseId = selectedFilterCourse;
      }
      const data = await api.getTeacherAssignments(params);
      setAssignments(data || []);
      // If there are assignments and none is expanded, expand the first one by default
      if (data && data.length > 0 && !expandedAssignmentId) {
        setExpandedAssignmentId(data[0].id);
        fetchSubmissionsForAssignment(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [selectedFilterCourse]);

  // Fetch submissions for a specific assignment
  const fetchSubmissionsForAssignment = async (assignmentId: string) => {
    setLoadingSubmissions(prev => ({ ...prev, [assignmentId]: true }));
    try {
      const subs = await api.getAssignmentSubmissions(assignmentId);
      setSubmissionsByAssignment(prev => ({ ...prev, [assignmentId]: subs || [] }));

      // Initialize grading state for each submission
      if (subs && subs.length > 0) {
        setGradingState(prev => {
          const next = { ...prev };
          subs.forEach((s: SubmissionItem) => {
            if (!next[s.id]) {
              next[s.id] = {
                score: s.grade_score !== undefined && s.grade_score !== null ? s.grade_score : '',
                feedback: s.grade_feedback || '',
                saving: false,
                success: false,
                editing: false,
              };
            }
          });
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to load submissions for assignment:', assignmentId, err);
    } finally {
      setLoadingSubmissions(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  const handleToggleAssignment = (assignmentId: string) => {
    if (expandedAssignmentId === assignmentId) {
      setExpandedAssignmentId(null);
    } else {
      setExpandedAssignmentId(assignmentId);
      if (!submissionsByAssignment[assignmentId]) {
        fetchSubmissionsForAssignment(assignmentId);
      }
    }
  };

  // Grade submission handler
  const handleSaveGrade = async (assignmentId: string, submissionId: string, maxScore: number) => {
    const currentGrade = gradingState[submissionId];
    if (!currentGrade) return;

    const numScore = Number(currentGrade.score);
    if (isNaN(numScore) || numScore < 0 || numScore > maxScore) {
      alert(`Please enter a valid score between 0 and ${maxScore}.`);
      return;
    }

    setGradingState(prev => ({
      ...prev,
      [submissionId]: { ...prev[submissionId], saving: true, success: false }
    }));

    try {
      await api.gradeSubmission(submissionId, {
        score: numScore,
        feedback: currentGrade.feedback || undefined,
      });

      // Update in local submissions list
      setSubmissionsByAssignment(prev => {
        const list = prev[assignmentId] || [];
        return {
          ...prev,
          [assignmentId]: list.map(item =>
            item.id === submissionId
              ? {
                ...item,
                status: 'graded',
                grade_score: numScore,
                grade_feedback: currentGrade.feedback || null,
                grade_released_at: new Date().toISOString()
              }
              : item
          )
        };
      });

      // Set success feedback and exit edit mode
      setGradingState(prev => ({
        ...prev,
        [submissionId]: {
          ...prev[submissionId],
          saving: false,
          success: true,
          editing: false,
          score: numScore,
        }
      }));

      // Update assignment graded count
      setAssignments(prev =>
        prev.map(a =>
          a.id === assignmentId
            ? { ...a, graded_count: Math.min(a.submission_count, a.graded_count + 1) }
            : a
        )
      );

      setTimeout(() => {
        setGradingState(prev => {
          if (!prev[submissionId]) return prev;
          return {
            ...prev,
            [submissionId]: { ...prev[submissionId], success: false }
          };
        });
      }, 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to submit marks.');
      setGradingState(prev => ({
        ...prev,
        [submissionId]: { ...prev[submissionId], saving: false }
      }));
    }
  };

  // Create Assignment Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.course_id) return;
    setSubmitting(true);

    try {
      const res = await api.createAssignment(formData.course_id, {
        ...formData,
        file_url: attachedFile?.dataUrl || undefined,
        file_name: attachedFile?.name || undefined,
      });

      const createdId = res?.id || res?.data?.id || null;
      setNewCreatedId(createdId);

      setFormData(prev => ({
        ...prev,
        title: '',
        instructions: '',
        due_at: '',
      }));
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Reload assignments list
      await loadAssignments();

      if (createdId) {
        setExpandedAssignmentId(createdId);
        fetchSubmissionsForAssignment(createdId);
      }
    } catch (err: any) {
      alert(err.message || 'Assignment creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const totalSubmissions = assignments.reduce((acc, a) => acc + (Number(a.submission_count) || 0), 0);
  const totalGraded = assignments.reduce((acc, a) => acc + (Number(a.graded_count) || 0), 0);

  const filteredAssignments = assignments.filter(a => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title?.toLowerCase().includes(q) ||
      a.course_title?.toLowerCase().includes(q) ||
      a.instructions?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100/60 shadow-2xs">
              <FileCheck2 className="w-6 h-6" />
            </span>
            Assignment Studio &amp; Evaluations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage course assignments, check student submissions by Student ID, and award marks directly.
          </p>
        </div>



      </div>

      {/* ======================================================== */}
      {/* TAB 1: SUBMISSIONS & GRADING ROSTER                      */}
      {/* ======================================================== */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Assignments</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{assignments.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Submissions</p>
                <p className="text-xl font-black text-brand-600 mt-0.5">{totalSubmissions}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Graded &amp; Released</p>
                <p className="text-xl font-black text-emerald-600 mt-0.5">
                  {totalGraded} <span className="text-xs text-slate-400 font-semibold">/ {totalSubmissions}</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assignments by title or course..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                />
              </div>

              <select
                value={selectedFilterCourse}
                onChange={(e) => setSelectedFilterCourse(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer shadow-2xs"
              >
                <option value="all">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Assignment</span>
            </button>
          </div>

          {/* Assignments & Submissions List */}
          {loadingAssignments ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80">
              <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">Loading assignments and submissions...</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No assignments found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {selectedFilterCourse !== 'all' || searchQuery
                  ? 'No assignments matched your filters. Try selecting a different course or clear search.'
                  : 'You have not created any assignments yet. Create an assignment to assign coursework and collect student submissions.'}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-2 mt-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create First Assignment</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map((assignment) => {
                const isExpanded = expandedAssignmentId === assignment.id;
                const subs = submissionsByAssignment[assignment.id] || [];
                const isLoadingSubs = loadingSubmissions[assignment.id];
                const subCount = Number(assignment.submission_count) || 0;
                const gradedCount = Number(assignment.graded_count) || 0;

                return (
                  <div
                    key={assignment.id}
                    className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden shadow-2xs ${isExpanded ? 'border-brand-300 ring-2 ring-brand-500/10' : 'border-slate-200/80 hover:border-slate-300'
                      }`}
                  >
                    {/* Assignment Header Row */}
                    <div
                      onClick={() => handleToggleAssignment(assignment.id)}
                      className="p-5 sm:p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none hover:bg-slate-50/50 transition"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/80 text-[10px] font-extrabold uppercase tracking-wide">
                            {assignment.course_title || 'Course Assignment'}
                          </span>
                          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Due: {assignment.due_at ? new Date(assignment.due_at).toLocaleDateString() : 'Self-paced'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                            Max {assignment.max_score} pts
                          </span>
                        </div>

                        <h2 className="text-base font-extrabold text-slate-900 tracking-tight truncate">
                          {assignment.title}
                        </h2>

                        <p className="text-xs text-slate-500 line-clamp-1">
                          {assignment.instructions}
                        </p>
                      </div>

                      {/* Right Side Stats & Action Button */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Submissions Badge */}
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 rounded-xl">
                          <div className="text-right">
                            <p className="text-xs font-extrabold text-slate-800">
                              {subCount} {subCount === 1 ? 'Submission' : 'Submissions'}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400">
                              {gradedCount} Graded • {Math.max(0, subCount - gradedCount)} Pending
                            </p>
                          </div>
                          {subCount > 0 && gradedCount === subCount ? (
                            <span className="p-1 rounded-full bg-emerald-100 text-emerald-700">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          ) : subCount > 0 ? (
                            <span className="p-1 rounded-full bg-amber-100 text-amber-700">
                              <Clock className="w-3 h-3 stroke-[2.5]" />
                            </span>
                          ) : null}
                        </div>

                        {/* Expand Toggle Button */}
                        <button
                          type="button"
                          className={`p-2 rounded-xl border transition ${isExpanded
                            ? 'bg-brand-50 border-brand-200 text-brand-700'
                            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                            }`}
                          title={isExpanded ? 'Collapse' : 'View Submissions'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Submissions Roster */}
                    {isExpanded && (
                      <AssignmentSubmissionsRoster
                        assignment={assignment}
                        submissions={subs}
                        isLoading={isLoadingSubs}
                        gradingState={gradingState}
                        setGradingState={setGradingState}
                        onSaveGrade={handleSaveGrade}
                        onRefreshSubmissions={() => fetchSubmissionsForAssignment(assignment.id)}
                      />
                    )}
                  </div>

                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CREATE ASSIGNMENT FORM                            */}
      {/* ======================================================== */}
      {activeTab === 'create' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {newCreatedId && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Assignment published! All enrolled students have received an in-app notification.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('submissions');
                  setNewCreatedId(null);
                }}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shrink-0"
              >
                View in Roster
              </button>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="relative z-20">
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Course</label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 relative z-20 cursor-pointer shadow-xs"
                >
                  {courses.length === 0 ? (
                    <option value="" disabled>No courses available</option>
                  ) : (
                    courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}{c.subject_name ? ` (${c.subject_name})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Project 2: Database Schema & Query Optimization"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Maximum Points</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.max_score}
                    onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value, 10) || 100 })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_at}
                    onChange={(e) => setFormData({ ...formData, due_at: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instructions &amp; Requirements</label>
                <textarea
                  required
                  rows={4}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Detail assignment expectations, required submission artifacts, grading rubric..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Attached Document (PDF / Word) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-brand-600" />
                    Attach Assignment Document (PDF / Word)
                  </label>
                  <span className="text-[11px] text-slate-400">Optional • Max 15MB</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="hidden"
                  id="assignment-file-upload"
                />

                {!attachedFile ? (
                  <label
                    htmlFor="assignment-file-upload"
                    className="border-2 border-dashed border-slate-200 hover:border-brand-400 hover:bg-brand-50/20 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center cursor-pointer transition text-center group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-brand-100 text-slate-500 group-hover:text-brand-600 flex items-center justify-center transition mb-2 shadow-2xs">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-brand-700">
                      Click to upload PDF or Word document from your device
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Supports .pdf, .doc, and .docx formats
                    </p>
                  </label>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-brand-50/40 border border-brand-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 font-extrabold text-xs tracking-wider shadow-2xs">
                        {attachedFile.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOC'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate" title={attachedFile.name}>
                          {attachedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formatFileSize(attachedFile.size)} • Ready to attach
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:text-brand-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={removeAttachedFile}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                        title="Remove attachment"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {fileError && (
                  <div className="flex items-center gap-1.5 mt-2 text-rose-600 text-[11px] font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fileError}</span>
                  </div>
                )}
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  {submitting ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
