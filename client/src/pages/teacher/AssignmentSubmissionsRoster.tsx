import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  Paperclip,
  Award,
  ExternalLink,
  Download,
  Search,
  Check,
  Clock,
  GraduationCap,
  Edit3,
  Copy,
  CheckCheck,
  Filter,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  Sparkles,
  MessageSquare,
  BarChart3,
  Share2,
  FolderDown,
  RotateCcw,
  Percent,
  Hash,
  AlertTriangle,
  Info,
  Calendar,
  X,
  ChevronDown,
  ChevronUp,
  MoreVertical
} from 'lucide-react';

export interface AssignmentWithStats {
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

export interface SubmissionItem {
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

export interface GradingStateItem {
  score: number | string;
  feedback: string;
  saving: boolean;
  success: boolean;
  editing: boolean;
}

interface AssignmentSubmissionsRosterProps {
  assignment: AssignmentWithStats;
  submissions: SubmissionItem[];
  isLoading: boolean;
  gradingState: Record<string, GradingStateItem>;
  setGradingState: React.Dispatch<React.SetStateAction<Record<string, GradingStateItem>>>;
  onSaveGrade: (assignmentId: string, submissionId: string, maxScore: number) => Promise<void>;
  onRefreshSubmissions: () => void;
}

/**
 * Generates a clean, consistent assignment code from title or ID.
 * Examples:
 *  "Assignment 1: Relational Modeling" -> "ASG-01"
 *  "Project 2: Fullstack Architecture" -> "PRJ-02"
 *  "Lab 3: React Hooks"                -> "LAB-03"
 *  "asg_1729683921000"                 -> "ASG-1000"
 */
export const getAssignmentCode = (asg: { id?: string; title?: string }): string => {
  if (!asg) return 'ASG-01';
  const title = asg.title || '';
  const match = title.match(/(?:Assignment|HW|Homework|Project|Lab|Task|Coursework)\s*#?\s*([0-9A-Za-z_-]+)/i);
  if (match) {
    const isProject = /project/i.test(title);
    const isLab = /lab/i.test(title);
    const isHW = /hw|homework/i.test(title);
    const prefix = isProject ? 'PRJ' : isLab ? 'LAB' : isHW ? 'HW' : 'ASG';
    const num = match[1];
    return `${prefix}-${/^\d+$/.test(num) ? num.padStart(2, '0') : num.toUpperCase()}`;
  }
  if (asg.id) {
    const clean = asg.id.replace(/^asg_?/i, '');
    if (/^\d+$/.test(clean)) {
      return clean.length <= 3 ? `ASG-${clean.padStart(2, '0')}` : `ASG-${clean.slice(-4)}`;
    }
    return `ASG-${clean.slice(0, 6).toUpperCase()}`;
  }
  return 'ASG-01';
};

/**
 * Extracts and cleans the student's unique code / ID.
 * Example: "STD-2024-001" or "usr_student_1" -> "STU-1"
 */
export const getStudentCode = (sub: { student_code?: string; student_id?: string }): string => {
  if (sub.student_code && sub.student_code.trim()) {
    return sub.student_code.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  }
  if (sub.student_id) {
    const clean = sub.student_id.replace(/^usr_student_?/i, 'STU-').replace(/^usr_?/i, 'ID-');
    return clean.toUpperCase();
  }
  return 'STUDENT';
};

/**
 * Extracts extension, clean base name, and file type category.
 */
export const getFileInfo = (fileUrl: string, originalName?: string) => {
  let ext = '';
  let cleanBase = (originalName || '').trim();

  if (fileUrl.startsWith('data:')) {
    const mimeMatch = fileUrl.match(/^data:([^;,]+)/);
    const mime = (mimeMatch ? mimeMatch[1] : '').toLowerCase();
    if (mime.includes('pdf')) ext = '.pdf';
    else if (mime.includes('word') || mime.includes('document') || mime.includes('msword')) ext = '.docx';
    else if (mime.includes('zip') || mime.includes('compressed')) ext = '.zip';
    else if (mime.includes('png')) ext = '.png';
    else if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
    else if (mime.includes('plain')) ext = '.txt';
    else if (mime.includes('json')) ext = '.json';
  } else {
    try {
      const url = new URL(fileUrl, window.location.href);
      const parts = url.pathname.split('/');
      const last = parts[parts.length - 1] || '';
      if (last.includes('.')) {
        ext = '.' + (last.split('.').pop() || '').toLowerCase();
        if (!cleanBase) cleanBase = last;
      }
    } catch {
      // fallback
    }
  }

  if (!ext) {
    if (cleanBase && cleanBase.includes('.')) {
      ext = '.' + (cleanBase.split('.').pop() || '').toLowerCase();
    } else {
      ext = '.pdf';
    }
  }

  // Strip extension if present in cleanBase
  cleanBase = cleanBase.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  if (!cleanBase || cleanBase === '_') cleanBase = 'submission_artifact';

  // Categorize
  let fileCategory: 'pdf' | 'doc' | 'zip' | 'code' | 'image' | 'file' = 'file';
  if (ext === '.pdf') fileCategory = 'pdf';
  else if (['.doc', '.docx', '.odt', '.rtf'].includes(ext)) fileCategory = 'doc';
  else if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) fileCategory = 'zip';
  else if (['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.cs', '.html', '.css', '.json', '.sql'].includes(ext)) fileCategory = 'code';
  else if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].includes(ext)) fileCategory = 'image';

  return { ext, cleanBase, fileCategory };
};

/**
 * Downloads a file ensuring the filename matches the requested structured format:
 * [AssignmentCode]_[StudentCode]_[CleanBaseName].[ext]
 */
export const downloadFileWithCode = async (fileUrl: string, downloadName: string): Promise<void> => {
  if (fileUrl.startsWith('data:')) {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  try {
    const res = await fetch(fileUrl, { mode: 'cors' });
    if (!res.ok) throw new Error('Fetch failed');
    const blob = await res.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
  } catch {
    // Cross-origin fallback
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = downloadName;
    link.target = '_blank';
    link.rel = 'noreferrer noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const AssignmentSubmissionsRoster: React.FC<AssignmentSubmissionsRosterProps> = ({
  assignment,
  submissions,
  isLoading,
  gradingState,
  setGradingState,
  onSaveGrade,
  onRefreshSubmissions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'graded' | 'with_files'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'score_desc' | 'score_asc'>('newest');

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [showFullBrief, setShowFullBrief] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.file-action-dropdown')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const asgCode = useMemo(() => getAssignmentCode(assignment), [assignment]);

  // Copy helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download single submission file with Assignment Code + Student Code naming
  const handleDownloadSingleFile = async (sub: SubmissionItem) => {
    if (!sub.file_url) return;
    const studentCode = getStudentCode(sub);
    const { ext, cleanBase } = getFileInfo(sub.file_url);

    // Format: [AssignmentCode]_[StudentCode]_[FileName].[ext]
    const filename = `${asgCode}_${studentCode}_${cleanBase}${ext}`;

    setDownloadingId(sub.id);
    try {
      await downloadFileWithCode(sub.file_url, filename);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setTimeout(() => setDownloadingId(null), 600);
    }
  };

  // Download all files sequentially
  const handleDownloadAllFiles = async () => {
    const withFiles = submissions.filter((s) => Boolean(s.file_url));
    if (withFiles.length === 0) return;

    setDownloadingAll(true);
    for (let i = 0; i < withFiles.length; i++) {
      const sub = withFiles[i];
      if (sub.file_url) {
        const studentCode = getStudentCode(sub);
        const { ext, cleanBase } = getFileInfo(sub.file_url);
        const filename = `${asgCode}_${studentCode}_${cleanBase}${ext}`;
        await downloadFileWithCode(sub.file_url, filename);
        // Small delay between downloads to prevent browser suppression
        if (i < withFiles.length - 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }
    setDownloadingAll(false);
  };

  // Export CSV Report
  const handleExportCsv = () => {
    const headers = [
      'Student Code',
      'Student Name',
      'Email',
      'Submission Timestamp',
      'Status',
      'Score Awarded',
      'Max Points',
      'Percentage',
      'Instructor Feedback',
      'Attachment URL',
    ];

    const rows = submissions.map((sub) => {
      const studentCode = getStudentCode(sub);
      const isGraded = sub.grade_score !== null && sub.grade_score !== undefined;
      const score = isGraded ? String(sub.grade_score) : 'Unmarked';
      const pct = isGraded
        ? `${Math.round(((sub.grade_score || 0) / assignment.max_score) * 100)}%`
        : 'N/A';
      const feedback = (sub.grade_feedback || '').replace(/"/g, '""');

      return [
        `"${studentCode}"`,
        `"${sub.student_name || ''}"`,
        `"${sub.student_email || ''}"`,
        `"${new Date(sub.submitted_at).toLocaleString()}"`,
        `"${sub.status}"`,
        `"${score}"`,
        `"${assignment.max_score}"`,
        `"${pct}"`,
        `"${feedback}"`,
        `"${sub.file_url || 'None'}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `${asgCode}_Gradebook_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats
  const totalCount = submissions.length;
  const gradedList = submissions.filter(
    (s) => s.status === 'graded' && s.grade_score !== null && s.grade_score !== undefined
  );
  const gradedCount = gradedList.length;
  const pendingCount = totalCount - gradedCount;
  const withFilesCount = submissions.filter((s) => Boolean(s.file_url)).length;
  const avgScore =
    gradedCount > 0
      ? (
        gradedList.reduce((acc, s) => acc + (Number(s.grade_score) || 0), 0) /
        gradedCount
      ).toFixed(1)
      : null;
  const avgPct = avgScore ? Math.round((Number(avgScore) / assignment.max_score) * 100) : null;

  // Filtered & Sorted Submissions
  const filteredSubmissions = useMemo(() => {
    let list = [...submissions];

    // Status filter
    if (statusFilter === 'pending') {
      list = list.filter((s) => s.status !== 'graded' || s.grade_score === null || s.grade_score === undefined);
    } else if (statusFilter === 'graded') {
      list = list.filter((s) => s.status === 'graded' && s.grade_score !== null && s.grade_score !== undefined);
    } else if (statusFilter === 'with_files') {
      list = list.filter((s) => Boolean(s.file_url));
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((s) => {
        const studentCode = getStudentCode(s).toLowerCase();
        return (
          s.student_name?.toLowerCase().includes(q) ||
          s.student_email?.toLowerCase().includes(q) ||
          studentCode.includes(q) ||
          s.content?.toLowerCase().includes(q)
        );
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
      }
      if (sortBy === 'name') {
        return (a.student_name || '').localeCompare(b.student_name || '');
      }
      if (sortBy === 'score_desc') {
        return (Number(b.grade_score) || -1) - (Number(a.grade_score) || -1);
      }
      if (sortBy === 'score_asc') {
        return (Number(a.grade_score) || -1) - (Number(b.grade_score) || -1);
      }
      return 0;
    });

    return list;
  }, [submissions, statusFilter, searchQuery, sortBy]);

  // Initials generator
  const getInitials = (name: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Preset feedback suggestions
  const feedbackSnippets = [
    'Outstanding solution! Well organized with clear methodology and structure.',
    'Good submission. Meets core requirements, but review edge cases.',
    'Well written analysis and code implementation. Keep up the high standard!',
    'Incomplete submission. Please refer to assignment guidelines and revise.',
  ];

  return (
    <div className="border-t border-slate-200/80 bg-slate-50/50 p-4 sm:p-7 space-y-6">
      {/* ======================================================== */}
      {/* 1. ASSIGNMENT BRIEF & METRICS BANNER                     */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Banner Top Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-white/15 text-indigo-200 font-mono font-black text-xs tracking-wider border border-white/10 flex items-center gap-1.5 shadow-2xs">
                <Hash className="w-3.5 h-3.5 text-indigo-300" />
                <span>CODE: {asgCode}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-slate-200 text-xs font-semibold">
                {assignment.course_title || 'Course Assignment'}
              </span>
              {assignment.due_at && (
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-indigo-300" />
                  Due: {new Date(assignment.due_at).toLocaleDateString()}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
              {assignment.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Max Score</p>
              <p className="text-sm font-black text-white">{assignment.max_score} Points</p>
            </div>
            {assignment.file_url && (
              <button
                type="button"
                onClick={() => {
                  const { ext } = getFileInfo(assignment.file_url!, assignment.file_name);
                  downloadFileWithCode(assignment.file_url!, `${asgCode}_Assignment_Brief${ext}`);
                }}
                className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                title="Download Instructor Brief File"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Brief File</span>
              </button>
            )}
          </div>
        </div>

        {/* Instructions Body */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Assignment Instructions &amp; Solution Guidelines
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(assignment.instructions);
                setCopiedBrief(true);
                setTimeout(() => setCopiedBrief(false), 2000);
              }}
              className="text-[11px] font-bold text-slate-500 hover:text-brand-600 flex items-center gap-1 transition"
            >
              {copiedBrief ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Instructions</span>
                </>
              )}
            </button>
          </div>

          <div
            className={`text-xs text-slate-700 leading-relaxed whitespace-pre-wrap ${!showFullBrief && assignment.instructions?.length > 300 ? 'line-clamp-3' : ''
              }`}
          >
            {assignment.instructions || 'No specific text instructions provided.'}
          </div>

          {assignment.instructions?.length > 300 && (
            <button
              type="button"
              onClick={() => setShowFullBrief(!showFullBrief)}
              className="text-[11px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 pt-1"
            >
              {showFullBrief ? (
                <>
                  <span>Show less</span>
                  <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  <span>Read full instructions</span>
                  <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          )}

          {/* Attached Brief Document if exists */}
          {assignment.file_url && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-black text-[10px] flex items-center justify-center shrink-0">
                  {assignment.file_name?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOC'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {assignment.file_name || 'Assignment_Attached_Brief_File'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Course instructor attached material • Downloads as <span className="font-mono text-slate-600">{asgCode}_Assignment_Brief</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={assignment.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Preview</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const { ext } = getFileInfo(assignment.file_url!, assignment.file_name);
                    downloadFileWithCode(assignment.file_url!, `${asgCode}_Assignment_Brief${ext}`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Brief</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Analytics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-slate-50/70 p-3 sm:p-4 text-center">
          <div className="p-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Submissions</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">{totalCount}</p>
          </div>
          <div className="p-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Graded &amp; Released</p>
            <p className="text-lg font-black text-emerald-600 mt-0.5">
              {gradedCount} <span className="text-xs text-slate-400 font-semibold">({totalCount > 0 ? Math.round((gradedCount / totalCount) * 100) : 0}%)</span>
            </p>
          </div>
          <div className="p-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Needs Review</p>
            <p className={`text-lg font-black mt-0.5 ${pendingCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
              {pendingCount}
            </p>
          </div>
          <div className="p-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class Average</p>
            <p className="text-lg font-black text-indigo-600 mt-0.5">
              {avgScore ? `${avgScore} / ${assignment.max_score}` : '—'}
              {avgPct !== null && <span className="text-xs text-slate-400 font-semibold ml-1">({avgPct}%)</span>}
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. ROSTER CONTROLS TOOLBAR & BATCH ACTIONS              */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        {/* Row 1: Filter Chips & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <span>All Submissions</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100'
                }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Needs Grading</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${statusFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'
                }`}>
                {pendingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('graded')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${statusFilter === 'graded'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100'
                }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Graded</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${statusFilter === 'graded' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'
                }`}>
                {gradedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('with_files')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${statusFilter === 'with_files'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 text-indigo-800 border border-indigo-200/60 hover:bg-indigo-100'
                }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>With Files</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${statusFilter === 'with_files' ? 'bg-white/20 text-white' : 'bg-indigo-200 text-indigo-900'
                }`}>
                {withFilesCount}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, Student ID, email..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Sort & Export Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-2xs"
            >
              <option value="newest">Newest Submission</option>
              <option value="oldest">Oldest Submission</option>
              <option value="name">Student Name (A-Z)</option>
              <option value="score_desc">Score (Highest First)</option>
              <option value="score_asc">Score (Lowest First)</option>
            </select>
            <span className="text-[11px] text-slate-400">
              Showing {filteredSubmissions.length} of {totalCount}
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {withFilesCount > 0 && (
              <button
                type="button"
                disabled={downloadingAll}
                onClick={handleDownloadAllFiles}
                className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                title="Download all attached files formatted as [AssignmentCode]_[StudentCode]_[FileName]"
              >
                {downloadingAll ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <FolderDown className="w-3.5 h-3.5" />
                    <span>Download All Files ({withFilesCount})</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              title="Export all student marks and submissions to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={onRefreshSubmissions}
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition"
              title="Reload submissions"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. SUBMISSIONS LIST                                      */}
      {/* ======================================================== */}
      {isLoading ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Retrieving student submissions...</p>
          <p className="text-[11px] text-slate-400">Loading student solution files and evaluations...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="py-14 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-black text-slate-800">No Student Submissions Yet</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            When enrolled students submit written notes, GitHub links, or attached documents, they will appear here labeled with their <strong>Student ID</strong> and code for grading.
          </p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-700">No submissions matched your search or filters</h4>
          <p className="text-[11px] text-slate-400">
            Try adjusting your search query or reset the filter status to see all students.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5"
          >
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((sub) => {
            const grade = gradingState[sub.id] || {
              score: sub.grade_score ?? '',
              feedback: sub.grade_feedback || '',
              saving: false,
              success: false,
              editing: false,
            };

            const isGraded =
              sub.status === 'graded' &&
              sub.grade_score !== null &&
              sub.grade_score !== undefined;
            const studentCode = getStudentCode(sub);
            const scoreNum = Number(grade.score);
            const livePct =
              !isNaN(scoreNum) && scoreNum >= 0 && assignment.max_score > 0
                ? Math.round((scoreNum / assignment.max_score) * 100)
                : null;

            // Late detection
            const isLate =
              assignment.due_at &&
              new Date(sub.submitted_at).getTime() > new Date(assignment.due_at).getTime();

            // Detect URL in content
            const urlMatch = sub.content?.match(/https?:\/\/[^\s]+/);
            const detectedUrl = urlMatch ? urlMatch[0] : null;

            // File info
            const fileInfo = sub.file_url ? getFileInfo(sub.file_url) : null;
            const downloadFilename = fileInfo
              ? `${asgCode}_${studentCode}_${fileInfo.cleanBase}${fileInfo.ext}`
              : `${asgCode}_${studentCode}_submission.pdf`;

            return (
              <div
                key={sub.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300/90 shadow-2xs hover:shadow-xs transition duration-150 p-5 sm:p-6 space-y-4"
              >
                {/* ======================================================== */}
                {/* A. STUDENT HEADER ROW                                    */}
                {/* ======================================================== */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Avatar with fallback initials */}
                    <div className="relative shrink-0">
                      {sub.avatar_url ? (
                        <img
                          src={sub.avatar_url}
                          alt={sub.student_name}
                          className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-100 shrink-0"
                          onError={(e) => {
                            // Fallback to initials if image link breaks
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        style={{ display: sub.avatar_url ? 'none' : 'flex' }}
                        className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-brand-600 text-white font-extrabold text-sm items-center justify-center shadow-2xs shrink-0"
                      >
                        {getInitials(sub.student_name)}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-slate-900 text-sm sm:text-base tracking-tight truncate">
                          {sub.student_name || 'Enrolled Student'}
                        </h4>

                        {/* Prominent Student ID Badge with 1-click Copy */}
                        <div
                          onClick={() => handleCopyText(studentCode, sub.id)}
                          className="group inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 text-indigo-700 font-mono font-bold text-xs cursor-pointer transition shadow-2xs"
                          title="Click to copy Student ID"
                        >
                          <span>ID: {studentCode}</span>
                          {copiedId === sub.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-indigo-400 group-hover:text-indigo-600" />
                          )}
                        </div>

                        {/* Submission Timing Badge */}
                        {isLate ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                            Late Submission
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            On Time
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
                        <span className="text-slate-600 font-medium">{sub.student_email}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Submitted {new Date(sub.submitted_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submission Status Pill & 3-Dot Menu */}
                  <div className="self-start md:self-auto shrink-0 flex items-center gap-2">
                    {isGraded ? (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/90 text-emerald-800 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span>Graded: </span>
                          <span className="font-extrabold text-emerald-900">
                            {sub.grade_score} / {assignment.max_score} pts
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700 ml-1">
                            ({Math.round(((sub.grade_score || 0) / assignment.max_score) * 100)}%)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/90 text-amber-800 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                        <span>Pending Evaluation</span>
                      </div>
                    )}

                    {/* 3-Dot Dropdown for Submissions without file attachment */}
                    {!sub.file_url && (
                      <div className="relative file-action-dropdown">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === sub.id ? null : sub.id);
                          }}
                          className={`p-2 rounded-xl border transition flex items-center justify-center ${openDropdownId === sub.id
                            ? 'bg-slate-100 border-slate-300 text-slate-900'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-2xs'
                            }`}
                          title="Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openDropdownId === sub.id && (
                          <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                setGradingState((prev) => ({
                                  ...prev,
                                  [sub.id]: { ...grade, editing: true },
                                }));
                              }}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition flex items-center gap-2 text-left"
                            >
                              <Award className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{isGraded ? 'Edit Marks & Remarks' : 'Enter Marks & Feedback'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ======================================================== */}
                {/* B. STUDENT CONTENT & SUBMISSION NOTES                    */}
                {/* ======================================================== */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-slate-400" />
                        Student Written Notes
                      </span>
                      {sub.content && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(sub.content, `content_${sub.id}`)}
                          className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition flex items-center gap-1"
                        >
                          {copiedId === `content_${sub.id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Notes</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-text">
                      {sub.content || (
                        <span className="italic text-slate-400 font-medium">
                          No written solution notes or repository link provided with this submission.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* C. STUDENT ATTACHED FILE (Under ASG Code & Student Code) */}
                  {/* ======================================================== */}
                  {sub.file_url && fileInfo && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/60 via-slate-50/70 to-indigo-50/40 border border-indigo-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* File Category Icon Badge */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-[11px] shadow-2xs ${fileInfo.fileCategory === 'pdf'
                            ? 'bg-rose-100 border border-rose-200 text-rose-700'
                            : fileInfo.fileCategory === 'doc'
                              ? 'bg-blue-100 border border-blue-200 text-blue-700'
                              : fileInfo.fileCategory === 'zip'
                                ? 'bg-amber-100 border border-amber-200 text-amber-800'
                                : fileInfo.fileCategory === 'code'
                                  ? 'bg-emerald-100 border border-emerald-200 text-emerald-800'
                                  : 'bg-indigo-100 border border-indigo-200 text-indigo-800'
                            }`}
                        >
                          {fileInfo.fileCategory.toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate" title={downloadFilename}>
                            {fileInfo.cleanBase}
                            <span className="text-slate-400 font-normal">{fileInfo.ext}</span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span>Downloads as:</span>
                            <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono font-bold text-indigo-700 text-[10px] shadow-2xs">
                              {downloadFilename}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* 3-Dot Dropdown Menu for Preview & Download */}
                      <div className="relative shrink-0 self-start sm:self-auto file-action-dropdown">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === sub.id ? null : sub.id);
                          }}
                          className={`p-2 rounded-xl border transition flex items-center justify-center ${openDropdownId === sub.id
                            ? 'bg-slate-100 border-slate-300 text-slate-900'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-2xs'
                            }`}
                          title="File options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openDropdownId === sub.id && (
                          <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                setGradingState((prev) => ({
                                  ...prev,
                                  [sub.id]: { ...grade, editing: true },
                                }));
                              }}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition flex items-center gap-2 text-left"
                            >
                              <Award className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{isGraded ? 'Edit Marks & Remarks' : 'Enter Marks & Feedback'}</span>
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                            <a
                              href={sub.file_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => setOpenDropdownId(null)}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-2"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                              <span>Preview File</span>
                            </a>

                            <button
                              type="button"
                              disabled={downloadingId === sub.id}
                              onClick={() => {
                                setOpenDropdownId(null);
                                handleDownloadSingleFile(sub);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition flex items-center gap-2 disabled:opacity-50 text-left"
                            >
                              {downloadingId === sub.id ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                  <span>Downloading...</span>
                                </>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Download File</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
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
