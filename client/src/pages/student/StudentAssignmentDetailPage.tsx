import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, ArrowLeft, Send, CheckCircle2, Trophy, Clock, ExternalLink, Download, Upload } from 'lucide-react';
import { api } from '../../lib/api';
import { Assignment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

export const StudentAssignmentDetailPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedMsg, setSubmittedMsg] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAssignment = () => {
    if (!assignmentId) return;
    setLoading(true);
    api.getAssignment(assignmentId)
      .then((data) => {
        setAssignment(data);
        if (data.my_submission) {
          setContent(data.my_submission.content || '');
          setFileUrl(data.my_submission.file_url || '');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentId || !content.trim()) return;
    setSubmitting(true);

    try {
      await api.submitAssignment(assignmentId, { content, file_url: fileUrl });
      setSubmittedMsg(true);
      fetchAssignment();
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading assignment details...</div>;
  }

  if (!assignment) {
    return <div className="py-20 text-center text-xs text-slate-400">Assignment not found.</div>;
  }

  const submission = assignment.my_submission;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <Link
        to={`/student/courses/${assignment.course_id}`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Course
      </Link>

      {/* Assignment Overview */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
            {assignment.course_title || 'Course Assignment'}
          </span>
          <StatusBadge status={submission?.status || 'not_submitted'} />
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{assignment.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 pt-1">
          <span>Max Marks: <strong>{assignment.max_score} pts</strong></span>
          <span>Due Date: <strong>{assignment.due_at ? new Date(assignment.due_at).toLocaleDateString() : 'Self-paced'}</strong></span>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Instructions</h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {assignment.instructions}
          </p>
        </div>

        {assignment.file_url && (
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Attached Assignment File</h3>
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {assignment.file_name || 'Assignment_Attached_Document'}
                  </p>
                  <p className="text-[11px] text-slate-400">PDF / Word Document from Instructor</p>
                </div>
              </div>
              <a
                href={assignment.file_url}
                download={assignment.file_name || 'Assignment_Document'}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Grade Result Card if graded */}
      {submission && (
        (submission.score !== undefined && submission.score !== null) ||
        (submission.grade_score !== undefined && submission.grade_score !== null)
      ) && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">Released Evaluation</span>
              <h2 className="text-2xl font-extrabold mt-1">
                Score: {submission.score ?? submission.grade_score} / {assignment.max_score}
              </h2>
              {(submission.feedback || submission.grade_feedback) && (
                <div className="mt-3 p-3.5 rounded-xl bg-white/10 backdrop-blur-md text-xs leading-relaxed">
                  <p className="font-bold mb-1 opacity-90">Instructor Feedback:</p>
                  <p className="italic">"{submission.feedback || submission.grade_feedback}"</p>
                </div>
              )}
            </div>
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      )}

      {/* Submission Form */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          {submission ? 'Your Submitted Work' : 'Submit Assignment Work'}
        </h3>

        {submittedMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Your assignment has been recorded and submitted to the instructor!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Submission Text, Code, or GitHub Repository Link
            </label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide a written summary, solution notes, or your repository URL..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Attached Solution Document / Project Artifact (Optional)
              </label>
              <span className="text-[11px] text-slate-400">Upload PDF, Word, ZIP or paste URL</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="Paste URL or choose a file from your device..."
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <label className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition flex items-center gap-1.5 shrink-0 border border-slate-200">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setFileUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              {fileUrl && fileUrl.startsWith('data:') && (
                <div className="flex items-center justify-between p-2.5 bg-brand-50 border border-brand-200 text-brand-800 rounded-xl text-xs font-semibold">
                  <span>File attached from device ready to submit</span>
                  <button type="button" onClick={() => setFileUrl('')} className="text-rose-600 hover:text-rose-800 text-[11px] font-bold">Remove</button>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting...' : submission ? 'Update Submission' : 'Submit Work'}
          </button>
        </form>
      </div>
    </div>
  );
};
