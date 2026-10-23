import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Send,
  CheckCircle2,
  Trophy,
  Clock,
  Download,
  Upload,
  Calendar,
  AlertCircle,
  ExternalLink,
  Paperclip,
  RotateCcw,
  X,
  FileCheck,
} from 'lucide-react';
import { api } from '../../lib/api';

export const StudentAssignmentDetailPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [assignment, setAssignment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Submission form state
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedMsg, setSubmittedMsg] = useState(false);
  const [isEditingSubmission, setIsEditingSubmission] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssignmentData = async () => {
    if (!assignmentId) return;
    setLoading(true);
    try {
      const data = await api.getAssignment(assignmentId);
      setAssignment(data);

      if (data.my_submission) {
        setContent(data.my_submission.content || '');
        setFileUrl(data.my_submission.file_url || '');
        if (data.my_submission.file_url) {
          const parts = data.my_submission.file_url.split('/');
          const rawName = parts[parts.length - 1];
          // If it was a data URL or generic name
          setFileName(rawName && !rawName.startsWith('data:') ? rawName : 'Submitted_Document');
        }
      }
    } catch (err: any) {
      console.error('Error fetching assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentData();
  }, [assignmentId]);

  const formatFileSize = (bytes?: number | null): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.pdf', '.doc', '.docx'];
    const lowerName = file.name.toLowerCase();
    const isValid =
      validExtensions.some((ext) => lowerName.endsWith(ext)) ||
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
      setFileUrl(reader.result as string);
      setFileName(file.name);
      setFileSize(file.size);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setFileUrl('');
    setFileName('');
    setFileSize(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentId) return;

    if (!content.trim() && !fileUrl) {
      setFileError('Please provide a written response or upload an assignment document.');
      return;
    }

    setSubmitting(true);
    setFileError(null);

    try {
      await api.submitAssignment(assignmentId, {
        content: content.trim(),
        file_url: fileUrl || null,
      });
      setSubmittedMsg(true);
      setIsEditingSubmission(false);
      await fetchAssignmentData();
      setTimeout(() => setSubmittedMsg(false), 4500);
    } catch (err: any) {
      setFileError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center max-w-md mx-auto">
        <RotateCcw className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800">Loading Assignment Details</h3>
        <p className="text-xs text-slate-500 mt-1">Retrieving coursework brief and evaluation records...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="py-24 text-center max-w-md mx-auto bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-extrabold text-slate-900">Assignment Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          This assignment may not exist or you may not be enrolled in the corresponding course.
        </p>
        <Link
          to="/student/assignments"
          className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl transition hover:bg-slate-800 inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assignments</span>
        </Link>
      </div>
    );
  }

  const submission = assignment.my_submission;
  const isSubmitted = submission && (submission.status === 'submitted' || submission.status === 'graded');
  const isGraded =
    submission &&
    ((submission.score !== null && submission.score !== undefined) ||
      (submission.grade_score !== null && submission.grade_score !== undefined));
  const scoreValue = submission?.score ?? submission?.grade_score;
  const feedbackValue = submission?.feedback ?? submission?.grade_feedback;
  const scorePercent =
    scoreValue !== null && scoreValue !== undefined
      ? Math.round((scoreValue / (assignment.max_score || 100)) * 100)
      : null;

  const dueDate = assignment.due_at ? new Date(assignment.due_at) : null;
  const isOverdue = dueDate ? dueDate < new Date() && !isSubmitted : false;

  return (
    <div className="space-y-6 pb-24 max-w-6xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Link
            to="/student/assignments"
            className="inline-flex items-center gap-1.5 font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Assignments</span>
          </Link>
          <span className="text-slate-300">/</span>
          <Link
            to={`/student/courses/${assignment.course_id}`}
            className="hover:text-slate-800 transition truncate max-w-[200px]"
          >
            {assignment.course_title}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-800 truncate max-w-[240px]">
            {assignment.title}
          </span>
        </div>

        <Link
          to={`/student/courses/${assignment.course_id}`}
          className="text-brand-600 hover:text-brand-700 font-bold text-xs inline-flex items-center gap-1"
        >
          <span>Course Workspace</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Main Grid: Assignment Brief (Left) & Submission Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Assignment Details & Instructor Material */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 border border-brand-200/60">
                {assignment.course_title}
              </span>

              {/* Status Badge */}
              {isGraded ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Graded • {scoreValue} / {assignment.max_score}
                  </span>
                </span>
              ) : isSubmitted ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Turned In • Pending Evaluation</span>
                </span>
              ) : isOverdue ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Past Due Date</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Action Required</span>
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {assignment.title}
              </h1>
              {assignment.created_at && (
                <p className="text-xs text-slate-500 mt-1.5">
                  Assigned on {new Date(assignment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>

            {/* Overview Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Due Deadline
                </span>
                <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                  {dueDate
                    ? dueDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : 'Self-Paced'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Maximum Points
                </span>
                <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                  {assignment.max_score} pts
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Submission Mode
                </span>
                <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                  Written Response / File
                </p>
              </div>
            </div>

            {/* Instructions Section */}
            <div className="border-t border-slate-100 pt-5 space-y-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-600" />
                <span>Assignment Instructions & Requirements</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 font-normal">
                {assignment.instructions || 'No detailed written instructions provided.'}
              </div>
            </div>

            {/* Teacher Provided Document (PDF / Word) */}
            {assignment.file_url && (
              <div className="border-t border-slate-100 pt-5 space-y-2.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Attached Assignment Document from Teacher
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {assignment.file_name || 'Assignment_Attached_Document.pdf'}
                      </p>
                      <p className="text-[11px] text-slate-500">PDF / Word Document from Instructor</p>
                    </div>
                  </div>
                  <a
                    href={assignment.file_url}
                    download={assignment.file_name || 'Assignment_Document'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Submission Panel & Grade Card */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-6">
          {/* Grade Card if released by Teacher */}
          {isGraded && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-400 bg-brand-950/80 px-2.5 py-1 rounded-full border border-brand-800">
                    Official Grade Released
                  </span>
                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                      {scoreValue}
                    </span>
                    <span className="text-slate-400 text-sm font-semibold">
                      / {assignment.max_score} pts
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md text-emerald-400">
                  <Trophy className="w-7 h-7" />
                </div>
              </div>

              {scorePercent !== null && (
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                    <span>Evaluation Score</span>
                    <span className="text-emerald-400 font-extrabold">{scorePercent}%</span>
                  </div>
                  <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${scorePercent}%` }}
                    />
                  </div>
                </div>
              )}

              {feedbackValue && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs leading-relaxed space-y-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-300">
                    Teacher Feedback:
                  </p>
                  <p className="italic text-slate-200 text-xs">"{feedbackValue}"</p>
                </div>
              )}
            </div>
          )}

          {/* Submission Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {isSubmitted ? 'Your Submitted Work' : 'Submit Assignment Work'}
              </h3>
              {isSubmitted && !isEditingSubmission && (
                <button
                  type="button"
                  onClick={() => setIsEditingSubmission(true)}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  Edit / Resubmit
                </button>
              )}
            </div>

            {submittedMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Your assignment response has been submitted to the teacher!</span>
              </div>
            )}

            {/* Display submitted snapshot when not editing */}
            {isSubmitted && !isEditingSubmission ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200/60 pb-2">
                    <span className="font-semibold">Turned-in Status:</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Submitted
                    </span>
                  </div>

                  {submission.submitted_at && (
                    <div className="text-[11px] text-slate-500">
                      <span className="font-medium text-slate-400">Timestamp: </span>
                      <strong className="text-slate-700">
                        {new Date(submission.submitted_at).toLocaleString()}
                      </strong>
                    </div>
                  )}

                  {submission.content && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Submitted Answer / Notes:
                      </span>
                      <div className="p-3 bg-white rounded-xl border border-slate-200/70 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {submission.content}
                      </div>
                    </div>
                  )}

                  {submission.file_url && (
                    <div className="pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Attached Submission File:
                      </span>
                      <a
                        href={submission.file_url}
                        target="_blank"
                        rel="noreferrer"
                        download="submitted_assignment_document"
                        className="flex items-center justify-between p-2.5 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-brand-600 hover:text-brand-700 transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                          <span className="truncate max-w-[190px]">
                            {fileName || 'Download Submitted File'}
                          </span>
                        </div>
                        <Download className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      </a>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingSubmission(true)}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Update / Resubmit Work</span>
                </button>
              </div>
            ) : (
              /* Submission Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Written Solution / Response */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Written Response / Solution Notes
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {content.length} characters
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type your answer, summary, or response to the assignment instructions..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 leading-relaxed font-normal"
                  />
                </div>

                {/* Upload PDF / Word Document Area */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Upload Assignment File (.pdf, .doc, .docx)
                  </label>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {fileUrl ? (
                    /* Selected File Chip */
                    <div className="p-3 bg-brand-50/70 border border-brand-200 rounded-2xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                          <FileCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-brand-900 truncate">
                            {fileName || 'Assignment_Document.pdf'}
                          </p>
                          {fileSize && (
                            <p className="text-[10px] text-brand-600 font-semibold">
                              {formatFileSize(fileSize)}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition shrink-0"
                        title="Remove attached file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    /* Upload Dropzone */
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-brand-400 bg-slate-50/60 hover:bg-brand-50/30 rounded-2xl p-5 text-center cursor-pointer transition space-y-2 group"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 group-hover:border-brand-300 text-slate-500 group-hover:text-brand-600 mx-auto flex items-center justify-center transition shadow-2xs">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-brand-700">
                          Click to browse and upload file
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Supports PDF or Word documents (.pdf, .doc, .docx up to 15MB)
                        </p>
                      </div>
                    </div>
                  )}

                  {fileError && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fileError}</span>
                    </p>
                  )}
                </div>

                {/* Submit Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={submitting || (!content.trim() && !fileUrl)}
                    className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {submitting
                        ? 'Submitting Work...'
                        : isSubmitted
                        ? 'Save Updated Submission'
                        : 'Turn In Assignment'}
                    </span>
                  </button>

                  {isSubmitted && isEditingSubmission && (
                    <button
                      type="button"
                      onClick={() => setIsEditingSubmission(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
