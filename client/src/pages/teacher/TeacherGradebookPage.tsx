import React, { useState, useEffect } from 'react';
import { FileCheck2, CheckCircle2, AlertCircle, Search, Edit3, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api';
import { StatusBadge } from '../../components/common/StatusBadge';

export const TeacherGradebookPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState(false);

  const fetchSubmissions = () => {
    setLoading(true);
    api.getGradebook()
      .then(setSubmissions)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleOpenGradeModal = (sub: any) => {
    setSelectedSub(sub);
    setGradeScore(sub.score !== undefined && sub.score !== null ? sub.score : sub.max_score);
    setGradeFeedback(sub.feedback || '');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setSavingGrade(true);

    try {
      await api.gradeSubmission(selectedSub.submission_id, {
        score: Number(gradeScore),
        feedback: gradeFeedback,
      });
      setSelectedSub(null);
      fetchSubmissions();
    } catch (err: any) {
      alert(err.message || 'Failed to save grade');
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Gradebook &amp; Evaluation</h1>
        <p className="text-xs text-slate-500 mt-1">Review student submissions, enter scores, and record feedback</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm overflow-hidden">
        {submissions.length === 0 ? (
          <p className="text-xs text-slate-400 py-12 text-center">No submissions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="pb-3">Student</th>
                  <th className="pb-3">Assignment</th>
                  <th className="pb-3">Course</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {submissions.map((s) => (
                  <tr key={s.submission_id} className="hover:bg-slate-50/80">
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <img
                          src={s.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={s.student_name}
                          className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{s.student_name}</span>
                          <span className="text-[10px] text-slate-400">{s.student_code || s.student_id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 font-semibold text-slate-800">{s.assignment_title}</td>
                    <td className="py-3.5 text-slate-500">{s.course_title}</td>
                    <td className="py-3.5">
                      <StatusBadge status={s.status} size="sm" />
                    </td>
                    <td className="py-3.5">
                      {s.score !== undefined && s.score !== null ? (
                        <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {s.score} / {s.max_score}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Ungraded</span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleOpenGradeModal(s)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Grade
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grade Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-brand-600 uppercase">Evaluation Terminal</span>
                <h3 className="text-lg font-extrabold text-slate-900">{selectedSub.assignment_title}</h3>
                <p className="text-xs text-slate-500">Student: {selectedSub.student_name}</p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Submission content preview */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 max-h-40 overflow-y-auto whitespace-pre-wrap">
              <span className="block font-bold text-slate-900 mb-1">Student Submission Content:</span>
              {selectedSub.content}
            </div>

            {selectedSub.file_url && (
              <a
                href={selectedSub.file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand-600 font-bold hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View Submitted Artifact
              </a>
            )}

            <form onSubmit={handleSaveGrade} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Awarded Score (Max: {selectedSub.max_score} pts)
                </label>
                <input
                  type="number"
                  min={0}
                  max={selectedSub.max_score}
                  step={0.5}
                  required
                  value={gradeScore}
                  onChange={(e) => setGradeScore(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instructor Feedback</label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Provide pedagogical feedback and recommendations..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGrade}
                  className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
                >
                  {savingGrade ? 'Saving...' : 'Release Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
